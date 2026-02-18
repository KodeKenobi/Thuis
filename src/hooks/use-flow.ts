import { useEffect, useCallback, useState, useMemo, useRef } from "react";
import { readAsStringAsync } from "expo-file-system/legacy";
import {
  useGetFlowDefinition,
  useInitiateFlow,
  useContinueFlow,
  useBackFlow,
  useRestoreFlow,
} from "@/service/flows";
import { useRouteParamsObject } from "@/hooks/use-route-params-object";
import { useLocalSearchParams, usePathname } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { API_URL } from "@/constants";
import { validateFlowFields } from "@/utils";
import { notifyModalToast } from "@/config/toast";
import { useUnfinishedFlowsContext } from "@/contexts/unfinished-flows-context";
import { trackScreen } from "@/config/analytics";

const REDIRECT_LINK_URL = API_URL + "/Huurder/payments/redirect";

const PAYMENT_POLL_INTERVAL = 1000;
const PAYMENT_POLL_TIMEOUT = 180000; // 3 minutes timeout
const MAX_POLL_ATTEMPTS = 30; // Maximum number of polling attempts

const PAYMENT_STATUS = {
  PAID: "PAID",
  SUCCESS: "success",
  COMPLETED: "completed",
  PENDING: "pending",
} as const;

export function useFlow(
  onFlowComplete?: (response: IFlowInitializationResponse) => void,
  options?: {
    onAction?: (action: "continue" | "back" | "restore") => void;
  },
): IUseFlowReturn {
  // Get flow params from route, only use id/code for initial fetch
  const routeParams = useRouteParamsObject<{
    id?: string;
    defaultLabel?: string;
    code?: string;
    flowCode?: string;
    flowName?: string;
  }>();
  const pathname = usePathname();
  const trackedRef = useRef(false);

  const { id: flowId, code, defaultLabel, flowCode, flowName } = routeParams;

  // Local state for flow definition, instance, step, snapshots
  const [currentDefinition, setCurrentDefinition] = useState<
    IFlowDefinitionResponse | undefined
  >(undefined);
  const [currentInstance, setCurrentInstance] = useState<
    IFlowInitializationResponse | undefined
  >(undefined);
  const [currentSnapshots, setCurrentSnapshots] = useState<
    IFlowInitializationResponse[]
  >([]);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Store form data for each snapshot to enable restoration when going back
  const [snapshotFormData, setSnapshotFormData] = useState<
    Record<string, Record<string, any>>
  >({});
  const params = useLocalSearchParams();
  const REDIRECT_URL = useMemo(() => {
    return REDIRECT_LINK_URL;
  }, [params?.id]);

  // Add formData and formErrors state inside useFlow
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Unfinished flows hook
  const { saveUnfinishedFlow, removeUnfinishedFlow, getUnfinishedFlowById } =
    useUnfinishedFlowsContext();

  // Helper to save unfinished flow state
  const saveUnfinishedFlowState = useCallback(async () => {
    if (
      !currentInstance ||
      !currentDefinition ||
      !currentInstance.status?.backEnabled
    ) {
      return;
    }

    const unfinishedFlow: IUnfinishedFlow = {
      id: currentInstance.id,
      flowCode: flowCode || "",
      flowLabel: defaultLabel || "Regelen",
      flowName: flowName || "",
      currentInstance, // This should be the current step's instance
      currentDefinition,
      currentSnapshots,
      currentStep,
      formData,
      snapshotFormData,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await saveUnfinishedFlow(unfinishedFlow);
  }, [
    currentInstance,
    currentDefinition,
    flowCode,
    defaultLabel,
    flowName,
    currentSnapshots,
    currentStep,
    formData,
    snapshotFormData,
    saveUnfinishedFlow,
  ]);

  // Helper to reset formData and formErrors for the current step
  const resetFormState = (
    instance?: IFlowInitializationResponse,
    restoreFromSnapshot?: boolean,
    restoreSnapshotKey?: string,
  ) => {
    if (instance?.elements) {
      const newFormData: Record<string, any> = {};

      // Check if we should restore form data from a previous snapshot
      const keyToRestore = restoreSnapshotKey || instance.snapshotKey;
      if (
        restoreFromSnapshot &&
        keyToRestore &&
        snapshotFormData[keyToRestore]
      ) {
        // Restore form data from the stored snapshot
        const storedFormData = snapshotFormData[keyToRestore];
        setFormData(storedFormData);
        setFormErrors({});
        return;
      }

      // check if its only one field, yeah?

      const fieldsElements = (instance?.elements || [])?.filter(
        (element) => !["rich-text", "title", "display"].includes(element?.type),
      );

      const showLabel = fieldsElements?.length > 1;

      // @ts-ignore
      const selectField: IFlowSelectElement = fieldsElements?.find(
        (field) => field?.type === "select",
      );

      const hasOneSelectField = selectField?.data?.list?.length === 1;

      const renderFields = !hasOneSelectField || showLabel;

      if (!renderFields) {
        newFormData[selectField?.data?.outputKey] =
          selectField?.data?.list?.[0]?.value;
        setFormData(newFormData);
        return setFormErrors({});
      }

      const carryFromSnapshot =
        restoreSnapshotKey && snapshotFormData[restoreSnapshotKey]
          ? snapshotFormData[restoreSnapshotKey]
          : undefined;

      instance.elements.forEach((el: any) => {
        if (el.data?.outputKey) {
          const outputKey = el.data.outputKey;
          if (
            carryFromSnapshot &&
            Object.prototype.hasOwnProperty.call(carryFromSnapshot, outputKey)
          ) {
            newFormData[outputKey] = carryFromSnapshot[outputKey];
          } else if (el?.default) {
            newFormData[outputKey] = el?.default;
          } else if (el?.type === "checkbox") {
            newFormData[outputKey] = false;
          } else {
            if (el?.data?.multiple || el?.data?.multiSelect) {
              newFormData[outputKey] = [];
            } else {
              newFormData[outputKey] = "";
            }
          }
        }
      });
      setFormData(newFormData);
      setFormErrors({});
    }
  };

  // Service hooks
  const {
    definition: fetchedDefinition,
    definitionError,
    definitionRefetch,
  } = useGetFlowDefinition(flowCode || "", {
    enabled: !!flowCode && !currentDefinition,
  });

  const { initiateFlow, initiateFlowLoading, initiateFlowError } =
    useInitiateFlow();

  const {
    backFlow,
    backFlowLoading,
    error: backError,
  } = useBackFlow({
    id: currentInstance?.id || flowId || "",
    snapshotKey: currentInstance?.snapshotKey || "",
    debug: "false",
  });

  const {
    continueFlow,
    continueFlowLoading,
    error: continueError,
  } = useContinueFlow({
    id: currentInstance?.id || flowId || "",
    snapshotKey: currentInstance?.snapshotKey || "",
    debug: "false",
  });

  const { restoreFlow, restoreFlowLoading } = useRestoreFlow({
    id: currentInstance?.id || flowId || "",
    debug: "false",
  });

  // On mount: fetch definition and initiate flow
  useEffect(() => {
    if (!currentDefinition && fetchedDefinition) {
      setCurrentDefinition(fetchedDefinition);
    }
  }, [fetchedDefinition, currentDefinition]);

  // Track screen with flow name once flow definition is loaded
  useEffect(() => {
    // Reset tracking ref when pathname changes (new flow)
    trackedRef.current = false;
  }, [pathname]);

  useEffect(() => {
    if (!pathname || !currentDefinition || trackedRef.current) return;

    const screenName = pathname.startsWith("/") ? pathname.slice(1) : pathname;
    if (!screenName.startsWith("flows/")) return; // Only track flows screens

    const flowId = screenName.split("/")[1];

    // Get readable identifier: flowName > flowCode > code > flowId
    const readableIdentifier =
      flowName ||
      flowCode ||
      code ||
      currentDefinition?.code ||
      flowId ||
      undefined;

    if (readableIdentifier) {
      trackScreen(screenName, {
        base_screen: "flows",
        screen_id: flowId,
        readable_identifier: readableIdentifier,
      });

      trackedRef.current = true;
    }
  }, [pathname, currentDefinition, flowName, flowCode, code]);

  // Check for unfinished flow when id is provided
  useEffect(() => {
    if (!currentInstance && flowId && !code) {
      getUnfinishedFlowById(flowId).then((unfinishedFlow) => {
        if (unfinishedFlow) {
          // Restore the correct current instance (should be the last snapshot)
          const correctCurrentInstance =
            unfinishedFlow.currentSnapshots[
              unfinishedFlow.currentSnapshots.length - 1
            ];

          setCurrentInstance(correctCurrentInstance);
          setCurrentDefinition(unfinishedFlow.currentDefinition);
          setCurrentSnapshots(unfinishedFlow.currentSnapshots);
          setCurrentStep(unfinishedFlow.currentStep);
          setSnapshotFormData(unfinishedFlow.snapshotFormData);

          // Restore form data for the current step
          resetFormState(
            correctCurrentInstance,
            true,
            correctCurrentInstance.snapshotKey,
          );
        }
      });
    }
  }, [flowId, currentInstance, code, getUnfinishedFlowById, resetFormState]);

  useEffect(() => {
    if (!currentInstance && code) {
      initiateFlow(code).then((res) => {
        setCurrentInstance(res);
        setCurrentSnapshots([res]);
        setCurrentStep(1);
        resetFormState(res);
      });
    }
  }, [code, currentInstance, initiateFlow]);

  // Continue handler (submits form data and updates local state)
  const handleContinue = useCallback(
    (formDataToSubmit: Record<string, any>) => {
      if (!currentInstance) return;
      options?.onAction?.("continue");

      // Store current form data with the current snapshot key before proceeding
      if (currentInstance.snapshotKey) {
        setSnapshotFormData((prev) => ({
          ...prev,
          [currentInstance.snapshotKey]: { ...formData },
        }));
      }

      continueFlow({
        ...formDataToSubmit,
        RedirectURL: REDIRECT_URL,
        Notificaties: [],
      }).then((res) => {
        const newSnapshots = [...currentSnapshots, res];
        setCurrentInstance(res);
        setCurrentSnapshots(newSnapshots);
        setCurrentStep(currentStep + 1);
        resetFormState(res);

        if (res?.status?.running && res?.status?.backEnabled) {
          setTimeout(() => saveUnfinishedFlowState(), 100);
        } else if (res?.status?.running === false) {
          // Flow completed, remove from unfinished flows
          removeUnfinishedFlow(currentInstance.id);
          if (onFlowComplete) {
            return onFlowComplete(res);
          }
        }
        if (
          res?.elements?.find((element) => element?.type === "link") &&
          res?.elements?.length === 1 &&
          // @ts-ignore
          res?.elements?.[0]?.data?.target === "redirect"
        ) {
          redirectedUrlsRef.current.add(`instance-${res?.id}`);
          handleExternalRedirect(res);
        }
      });
    },
    [
      continueFlow,
      currentInstance,
      currentSnapshots,
      currentStep,
      onFlowComplete,
      options,
      formData,
    ],
  );

  const openRedirectLink = () => {
    redirectedUrlsRef.current.add(`instance-${currentInstance?.id}`);
    handleExternalRedirect(currentInstance);
  };

  // Back handler (updates local state)
  const handleBack = useCallback(() => {
    if (!currentInstance) return;
    options?.onAction?.("back");
    backFlow().then((res) => {
      const newSnapshots = [...currentSnapshots];
      if (newSnapshots.length > 0) newSnapshots.pop();
      newSnapshots.push(res);
      setCurrentInstance(res);
      setCurrentSnapshots(newSnapshots);
      setCurrentStep(Math.max(currentStep - 1, 1));
      // Restore form data for the instance we navigated to
      resetFormState(res, true, res?.snapshotKey);
    });
  }, [
    backFlow,
    currentInstance,
    currentSnapshots,
    currentStep,
    options,
    snapshotFormData,
  ]);

  // Restore handler (updates local state)
  const handleRestore = useCallback(
    (snapshotKey: string) => {
      if (!currentInstance) return;
      options?.onAction?.("restore");
      restoreFlow({ snapshotKey }).then((res) => {
        const snapshotIndex = currentSnapshots.findIndex(
          (snapshot) => snapshot.snapshotKey === snapshotKey,
        );
        const prevSnapshots =
          snapshotIndex >= 0
            ? [...currentSnapshots.slice(0, snapshotIndex)]
            : [...currentSnapshots];
        const newSnapshots = [...prevSnapshots, res];
        const newCurrentStep =
          prevSnapshots.length > 0 ? prevSnapshots.length : 1;
        setCurrentInstance(res);
        setCurrentSnapshots(newSnapshots);
        setCurrentStep(newCurrentStep + 1);
        // Restore form data from the specific snapshot key provided
        resetFormState(res, true, snapshotKey);
      });
    },
    [restoreFlow, currentInstance, currentSnapshots, options, snapshotFormData],
  );

  const refetch = useCallback(async () => {
    if (!currentDefinition) {
      const defResponse = await definitionRefetch();
      return defResponse?.data;
    }
    if (!currentInstance && code) {
      const flowResponse = await initiateFlow(code);
      setCurrentInstance(flowResponse);
      setCurrentSnapshots([flowResponse]);
      setCurrentStep(1);
      resetFormState(flowResponse);
      return flowResponse;
    }
    return currentInstance;
  }, [
    currentDefinition,
    currentInstance,
    definitionRefetch,
    initiateFlow,
    code,
  ]);

  // Loading states
  const isLoading = initiateFlowLoading;

  const fieldsElements = (currentInstance?.elements || [])?.filter(
    (element) => !["rich-text", "title", "display"].includes(element?.type),
  );

  const showLabel = fieldsElements?.length > 1;

  // @ts-ignore
  const selectField: IFlowSelectElement = fieldsElements?.find(
    (field) => field?.type === "select",
  );

  const hasOneSelectField = selectField?.data?.list?.length === 1;

  const renderFields = !hasOneSelectField || showLabel;

  const redirectedUrlsRef = useRef<Set<string>>(new Set());

  const checkPaymentStatus = useCallback(
    (instance: IFlowInitializationResponse): boolean => {
      const noPaymentNeeded = instance.state?.heeftUitzondering === true;
      if (noPaymentNeeded) {
        return true;
      }

      const hadPaymentLink = instance.elements?.some(
        (e) =>
          e.type === "link" &&
          (e.data as any)?.["@url"]?.includes("mollie.com/checkout"),
      );

      if (!hadPaymentLink) {
        return true;
      }

      const isPaid =
        instance.state?.paymentStatus === PAYMENT_STATUS.PAID ||
        instance.state?.status === PAYMENT_STATUS.SUCCESS ||
        instance.state?.status === PAYMENT_STATUS.PAID ||
        instance.properties?.paymentCompleted === true;

      return isPaid;
    },
    [],
  );

  const handleExternalLink = useCallback(
    async (url: string) => {
      if (isRedirecting || redirectedUrlsRef.current.has(url)) return;

      try {
        redirectedUrlsRef.current.add(url);
        setIsRedirecting(true);

        const result = await WebBrowser.openBrowserAsync(url);

        if (result.type === "opened" || result.type === "cancel") {
          const startTime = Date.now();
          let pollAttempts = 0;

          const pollPaymentStatus = async (): Promise<boolean> => {
            pollAttempts++;

            if (Date.now() - startTime > PAYMENT_POLL_TIMEOUT) {
              console.error(
                "Payment polling timed out after",
                (Date.now() - startTime) / 1000,
                "seconds",
              );
              throw new Error("Payment status check timed out");
            }

            if (pollAttempts >= MAX_POLL_ATTEMPTS) {
              console.error("Maximum poll attempts reached:", pollAttempts);
              throw new Error("Maximum payment check attempts reached");
            }

            try {
              const response = await refetch();

              if (!response || !isFlowInitializationResponse(response)) {
                return false;
              }

              await new Promise((resolve) => setTimeout(resolve, 2000));

              const isPaid = checkPaymentStatus(response);

              if (isPaid) {
                setCurrentInstance(response);
                return true;
              }

              // Use exponential backoff
              const delay = Math.min(
                PAYMENT_POLL_INTERVAL * Math.pow(1.5, pollAttempts - 1),
                5000,
              );
              await new Promise((resolve) => setTimeout(resolve, delay));
              return pollPaymentStatus();
            } catch (error) {
              console.error("Poll attempt error:", error);
              throw error;
            }
          };

          try {
            const paymentSuccessful = await pollPaymentStatus();

            if (paymentSuccessful) {
              notifyModalToast({
                props: {
                  type: "success",
                  message: "Betaling is succesvol verwerkt",
                },
              });

              if (currentInstance) {
                const response = await refetch();
                if (response && isFlowInitializationResponse(response)) {
                  setCurrentInstance(response);
                  handleContinue({});
                }
              }
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error) {
            console.error("Payment polling error:", error);
            notifyModalToast({
              props: {
                type: "error",
                message:
                  "Betaling verificatie mislukt. Controleer uw betaling status.",
              },
            });
          }
        }
      } catch (error) {
        console.error("External link error:", error);
        notifyModalToast({
          props: {
            type: "error",
            message:
              "Er is een fout opgetreden bij de betaling. Probeer het opnieuw.",
          },
        });
      } finally {
        setIsRedirecting(false);
      }
    },
    [
      REDIRECT_URL,
      refetch,
      currentInstance,
      isRedirecting,
      handleContinue,
      checkPaymentStatus,
    ],
  );

  const handleExternalRedirect = useCallback(
    async (instance: any) => {
      if (
        !instance?.elements?.length ||
        isRedirecting ||
        instance.state?.redirectProcessed
      )
        return;
      try {
        const redirectUrl =
          instance.state?.RedirectURL ??
          instance.properties?.redirectUrl ??
          instance.state?.redirectUrl;

        if (
          typeof redirectUrl === "string" &&
          redirectUrl.startsWith("http") &&
          !redirectedUrlsRef.current.has(redirectUrl)
        ) {
          await handleExternalLink(redirectUrl);
          return;
        }

        const linkEl = instance.elements.find(
          (e: any) => e.type === "link" && e.data?.url,
        );

        if (
          linkEl?.data?.url &&
          !redirectedUrlsRef.current.has(linkEl.data.url)
        ) {
          await handleExternalLink(linkEl.data.url);
        }
      } catch (error) {}
    },
    [handleExternalLink, isRedirecting],
  );

  const handleElementChange = (outputKey: string, value: any) => {
    const newFormData = { ...formData, [outputKey]: value };
    setFormData(newFormData);

    // Store the updated form data with the current snapshot key
    if (currentInstance?.snapshotKey) {
      setSnapshotFormData((prev) => ({
        ...prev,
        [currentInstance.snapshotKey]: newFormData,
      }));
    }

    const elements = currentInstance?.elements || [];
    const element = elements.find(
      (el: any) =>
        (el.data?.outputKey || el.data?.outputKey === "") &&
        el.data.outputKey === outputKey,
    );
    if (element && element.type === "input") {
      let error: string | undefined = undefined;
      if (
        element.data.required &&
        (!value || (typeof value === "string" && value.trim() === ""))
      ) {
        error = "Dit veld is verplicht";
      } else if (
        element.data &&
        typeof element.data === "object" &&
        "pattern" in element.data &&
        typeof (element.data as any).pattern === "string" &&
        typeof value === "string" &&
        !new RegExp((element.data as any).pattern).test(value)
      ) {
        const sample = (element as any).properties?.placeholder || "";
        error = `Ongeldig formaat${sample ? ` (bijv. ${sample})` : ""}`;
      }
      setFormErrors((prev: any) => {
        if (error) return { ...prev, [outputKey]: error };
        const newErrors = { ...prev };
        delete newErrors[outputKey];
        return newErrors;
      });
    } else {
      setFormErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[outputKey];
        return newErrors;
      });
    }
  };

  const handleContinueWithValidation = async () => {
    const elements = currentInstance?.elements || [];
    if (!elements) return;
    const vErr = validateFlowFields(elements, formData);

    if (Object.keys(vErr).length) {
      setFormErrors(vErr);
      return;
    }

    let hasFile = false;
    for (const key in formData) {
      const val = formData[key];
      if (
        (Array.isArray(val) && val.length > 0 && val[0]?.uri && val[0]?.name) ||
        (val && val.uri && val.name)
      ) {
        hasFile = true;
        break;
      }
    }
    if (hasFile) {
      // Convert file fields to required JSON structure (base64, etc.)
      const newFormData: Record<string, any> = { ...formData };
      const fileFieldKeys = Object.keys(formData).filter((key) => {
        const el = elements.find((e: any) => e.data?.outputKey === key);
        return el && el.type && String(el.type).toLowerCase() === "file";
      });
      for (const key of fileFieldKeys) {
        const files = Array.isArray(formData[key])
          ? formData[key]
          : [formData[key]];
        newFormData[key] = await Promise.all(
          files.map(async (file: any) => {
            if (Platform.OS === "web") {
              // Web: use FileReader
              const base64String = await new Promise((resolve, reject) => {
                const reader = new FileReader();

                let blob: Blob;

                // If it's already a Blob/File
                if (file instanceof Blob) {
                  blob = file;
                } else if (file.file instanceof Blob) {
                  // Expo Web sometimes wraps the File
                  blob = file.file;
                } else {
                  reject(new Error("Invalid file type on web"));
                  return;
                }

                reader.onload = () => {
                  const result = reader.result;
                  if (typeof result === "string") {
                    const splitResult = result.split(",");
                    resolve(
                      splitResult.length > 1 ? splitResult[1] : splitResult[0],
                    );
                  } else {
                    resolve("");
                  }
                };
                reader.onerror = reject;

                reader.readAsDataURL(blob);
              });
              return {
                Base64: base64String,
                // it is not done properly.
                FileID: file.name.split(".").slice(0, -1).join("."),
                FileExtension: file.name.split(".").slice(-1)[0],
                FileSize: file.size,
                MimeType: file.mimeType || file.type,
              };
            } else {
              // Native: fetch file and convert to base64
              const getBase64FromUri = async (uri: string) => {
                try {
                  return await readAsStringAsync(uri, { encoding: "base64" });
                } catch (e) {
                  return null;
                }
              };
              const base64String = await getBase64FromUri(file.uri);
              return {
                Base64: base64String,
                FileID: file.name.split(".").slice(0, -1).join("."),
                FileExtension: file.name.split(".").slice(-1)[0],
                FileSize: file.size,
                MimeType: file.mimeType || file.type,
              };
            }
          }),
        );
      }
      handleContinue(newFormData);
    } else {
      handleContinue(formData);
    }
  };

  // Determine if all required fields are filled
  const elements = currentInstance?.elements || [];
  let allRequiredFilled = true;
  let hasRequired = false;
  elements.forEach((element) => {
    if (
      (element.type === "input" ||
        element.type === "select" ||
        element.type === "file" ||
        element.type === "checkbox" ||
        element.type === "date-input" ||
        element.type === "list") &&
      element.data.required
    ) {
      hasRequired = true;
      const outputKey = element.data.outputKey;
      const value = formData[outputKey];

      if (element.type === "list") {
        // List validation: ensure it's an array with at least one item
        if (!Array.isArray(value) || value.length === 0) {
          allRequiredFilled = false;
        }
      } else if (element.type === "file") {
        if (element.data.multipleFiles || element.data.multiple) {
          if (Array.isArray(value) && value.length === 0) {
            allRequiredFilled = false;
          }
        } else if (!value) {
          allRequiredFilled = false;
        }
      } else if (!value || (typeof value === "string" && value.trim() === "")) {
        allRequiredFilled = false;
      }
    }
  });
  const continueDisabled =
    (hasRequired && !allRequiredFilled) ||
    backFlowLoading ||
    continueFlowLoading;

  return {
    handleContinue,
    handleBack,
    handleRestore,
    refetch,
    currentDefinition,
    currentInstance,
    isLoading,
    isContinueLoading: continueFlowLoading,
    isBackLoading: backFlowLoading,
    isRestoreFlowLoading: restoreFlowLoading,
    definitionError,
    initiateFlowError,
    continueError,
    backError,
    existingLabel: defaultLabel,
    flowName,
    currentStep,
    currentSnapshots,
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    renderFields,
    handleElementChange,
    selectField,
    hasOneSelectField,
    continueDisabled,
    handleContinueWithValidation,
    isRedirecting,
    showLabel,
    openRedirectLink,
    error: continueError || undefined,
    continueFlowError: continueError || undefined,
  };
}

const isFlowInitializationResponse = (
  response: unknown,
): response is IFlowInitializationResponse => {
  return (
    typeof response === "object" &&
    response !== null &&
    "id" in response &&
    "state" in response &&
    "elements" in response &&
    "snapshotKey" in response
  );
};
