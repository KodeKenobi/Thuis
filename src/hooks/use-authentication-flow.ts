import { useEffect, useCallback, useState, useRef } from "react";
import { readAsStringAsync } from "expo-file-system/legacy";
import {
  useInitiateFlow,
  useContinueFlow,
  useBackFlow,
  useRestoreFlow,
} from "@/service/authentication-flows";
import { Platform } from "react-native";
import { validateFlowFields } from "@/utils";
import { AUTHENTICATION_FLOWS } from "@/data/flows";

const PAYMENT_STATUS = {
  PAID: "PAID",
  SUCCESS: "success",
  COMPLETED: "completed",
  PENDING: "pending",
} as const;

export function useAuthenticationFlow(
  flowValue: TAuthenticationFlow,
  onFlowComplete?: (response: IFlowInitializationResponse) => void,
  options?: {
    onAction?: (action: "continue" | "back" | "restore") => void;
  }
): IUseAuthenticationFlowReturn {
  const flow = AUTHENTICATION_FLOWS.find((flow) => flow?.value === flowValue);
  const [selectedTenant, setSelectedTenant] = useState<{
    id: string;
    name?: string;
  } | null>(null);
  const [currentInstance, setCurrentInstance] = useState<
    IFlowInitializationResponse | undefined
  >(undefined);
  const [currentSnapshots, setCurrentSnapshots] = useState<
    IFlowInitializationResponse[]
  >([]);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Add formData and formErrors state inside useFlow
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Store form data for each snapshot to enable restoration when going back
  const [snapshotFormData, setSnapshotFormData] = useState<
    Record<string, Record<string, any>>
  >({});

  // Helper to reset formData and formErrors for the current step
  const resetFormState = (
    instance?: IFlowInitializationResponse,
    restoreFromSnapshot?: boolean,
    restoreSnapshotKey?: string
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

      const fieldsElements = (instance?.elements || [])?.filter(
        (element) => !["rich-text", "title", "display"].includes(element?.type)
      );

      const showLabel = fieldsElements?.length > 1;

      // @ts-ignore
      const selectField: IFlowSelectElement = fieldsElements?.find(
        (field) => field?.type === "select"
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

  const { initiateFlow, initiateFlowLoading, initiateFlowError } =
    useInitiateFlow(selectedTenant?.id || "");

  const {
    backFlow,
    backFlowLoading,
    error: backError,
  } = useBackFlow({
    id: currentInstance?.id || "",
    snapshotKey: currentInstance?.snapshotKey || "",
    debug: "false",
    corporationName: selectedTenant?.id || "",
  });

  const {
    continueFlow,
    continueFlowLoading,
    error: continueError,
  } = useContinueFlow({
    id: currentInstance?.id || "",
    snapshotKey: currentInstance?.snapshotKey || "",
    debug: "false",
    corporationName: selectedTenant?.id || "",
  });

  const { restoreFlow, restoreFlowLoading } = useRestoreFlow({
    id: currentInstance?.id || "",
    debug: "false",
    corporationName: selectedTenant?.id || "",
  });

  useEffect(() => {
    if (flow?.flowCode && selectedTenant?.id) {
      setCurrentInstance(undefined);
      initiateFlow({ code: flow?.flowCode }).then((res) => {
        setCurrentInstance(res);
        setCurrentSnapshots([res]);
        setCurrentStep(1);
        resetFormState(res);
      });
    }
  }, [flow?.flowCode, selectedTenant?.id]);

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
      }).then((res) => {
        const newSnapshots = [...currentSnapshots, res];
        setCurrentInstance(res);
        setCurrentSnapshots(newSnapshots);
        setCurrentStep(currentStep + 1);
        resetFormState(res);
        if (res?.status?.running === false && onFlowComplete) {
          return onFlowComplete(res);
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
    ]
  );

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
          (snapshot) => snapshot.snapshotKey === snapshotKey
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
    [restoreFlow, currentInstance, currentSnapshots, options, snapshotFormData]
  );

  const refetch = useCallback(async () => {
    if (!currentInstance && flow?.flowCode) {
      const flowResponse = await initiateFlow({ code: flow?.flowCode });
      setCurrentInstance(flowResponse);
      setCurrentSnapshots([flowResponse]);
      setCurrentStep(1);
      resetFormState(flowResponse);
      return flowResponse;
    }
    return currentInstance;
  }, [currentInstance, initiateFlow, flow?.flowCode]);

  // Loading states
  const isLoading = initiateFlowLoading;

  const fieldsElements = (currentInstance?.elements || [])?.filter(
    (element) => !["rich-text", "title", "display"].includes(element?.type)
  );

  const showLabel = fieldsElements?.length > 1;

  // @ts-ignore
  const selectField: IFlowSelectElement = fieldsElements?.find(
    (field) => field?.type === "select"
  );

  const hasOneSelectField = selectField?.data?.list?.length === 1;

  const renderFields = !hasOneSelectField || showLabel;

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
        el.data.outputKey === outputKey
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
                reader.onload = () => {
                  const result = reader.result;
                  if (typeof result === "string") {
                    const splitResult = result.split(",");
                    resolve(
                      splitResult.length > 1 ? splitResult[1] : splitResult[0]
                    );
                  } else {
                    resolve("");
                  }
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
              return {
                Base64: base64String,
                FileID: file.name.split(".").slice(0, -1).join("."),
                FileExtension: file.name.split(".").slice(-1)[0],
                FileSize: file.size,
                MimeType: file.type,
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
          })
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
  elements.forEach((element: any) => {
    if (
      (element.type === "input" || element.type === "select") &&
      element.data.required
    ) {
      hasRequired = true;
      const outputKey = element.data.outputKey;
      const value = formData[outputKey];
      if (!value || (typeof value === "string" && value.trim() === "")) {
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
    currentInstance,
    isLoading,
    isContinueLoading: continueFlowLoading,
    isBackLoading: backFlowLoading,
    isRestoreFlowLoading: restoreFlowLoading,
    initiateFlowError,
    continueError,
    backError,
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
    showLabel,
    error: continueError || undefined,
    continueFlowError: continueError || undefined,
    selectedTenant,
    updateSelectedTenant: setSelectedTenant,
    flow,
  };
}
