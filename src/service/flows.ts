import fetchWrapper from "@/config/api";
import { notifyModalToast } from "@/config/toast";
import { formatErrorMessage } from "@/utils";
import {
  UseMutationOptions,
  useMutation,
  UseQueryOptions,
  useQuery,
} from "@tanstack/react-query";
import { FLOWS } from "@/data/flows";

export interface TContinueFlowBody {
  [key: string]: any;
}

const handleFlowError = (error: unknown) => {
  notifyModalToast({
    props: {
      type: "error",
      message: formatErrorMessage(error),
    },
  });
};

export const useGetFlowProcess = (
  options?: Omit<
    UseQueryOptions<TFlowProcess[], unknown, TFlowProcess[], ["flow-process"]>,
    "queryKey" | "queryFn"
  >
) => {
  const query = useQuery<
    TFlowProcess[],
    unknown,
    TFlowProcess[],
    ["flow-process"]
  >({
    queryKey: ["flow-process"],
    queryFn: async () => {
      const url = `/Huurder/flow/process`;
      const res = await fetchWrapper(url, { method: "GET" });
      const apiFlows = res.data as TFlowProcess[];

      return apiFlows.map((flow) => {
        const match = FLOWS.find((f) => f.code === flow.flowCode);

        return {
          ...flow,
          groups: match?.groups ?? [],
          color: match?.color || "",
          defaultIcon: match?.customIcon,
          defaultDescription: match?.descripiton,
          defaultLabel: match?.label ?? flow.label ?? flow.websiteLabel ?? "",
          flowName:
            flow?.settings?.translations?.["nl"]?.Flow_Titel_Website ||
            flow?.websiteLabel ||
            flow?.defaultLabel ||
            flow.label,
        };
      });
    },
    retry: 1,
    retryDelay: 500,
    ...options,
  });

  return {
    flowProcess: query.data,
    flowProcessLoading: query.isLoading,
    flowProcessError: query.error,
    flowProcessRefetch: query.refetch,
    ...query,
  };
};

// 1. GET flow definition
export const useGetFlowDefinition = (
  code: string,
  options?: Omit<
    UseQueryOptions<
      IFlowDefinitionResponse,
      unknown,
      IFlowDefinitionResponse,
      ["flow-definition", string]
    >,
    "queryKey" | "queryFn"
  >
) => {
  const query = useQuery<
    IFlowDefinitionResponse,
    unknown,
    IFlowDefinitionResponse,
    ["flow-definition", string]
  >({
    queryKey: ["flow-definition", code],
    queryFn: async () => {
      const url = `/Huurder/flow/${encodeURIComponent(code)}/definition`;
      const res = await fetchWrapper(url, { method: "GET" });
      return res.data as IFlowDefinitionResponse;
    },
    retry: 1,
    retryDelay: 500,
    gcTime: 0,
    staleTime: 0,
    ...options,
  });

  return {
    definition: query.data,
    definitionLoading: query.isLoading,
    definitionError: query.error,
    definitionRefetch: query.refetch,
    ...query,
  };
};

// 2. Initiate a new flow
export const useInitiateFlow = (
  options?: UseMutationOptions<IFlowInitializationResponse, unknown, string>
) => {
  const mutation = useMutation<IFlowInitializationResponse, unknown, string>({
    mutationFn: async (code) => {
      const url = `/Huurder/flow/${encodeURIComponent(code)}/initFromProcess`;
      const { data } = await fetchWrapper(url, { method: "POST" });
      return data as IFlowInitializationResponse;
    },
    mutationKey: ["initiateFlow"],
    ...options,
  });

  return {
    initiateFlow: mutation.mutateAsync,
    initiateFlowLoading: mutation.isPending,
    initiateFlowReset: mutation.reset,
    initiateFlowData: mutation.data,
    initiateFlowError: mutation.error,
    ...mutation,
  };
};

// 3. Continue an existing flow (params -> query params, body -> request body)
interface IFlowError extends Error {
  message: string;
}

export const useContinueFlow = (
  params: { id: string; debug?: string; snapshotKey?: string },
  options?: UseMutationOptions<
    IFlowInitializationResponse,
    IFlowError,
    TContinueFlowBody
  >
) => {
  const mutation = useMutation<
    IFlowInitializationResponse,
    IFlowError,
    TContinueFlowBody
  >({
    mutationFn: async (body) => {
      try {
        const query = new URLSearchParams();
        if (params.debug !== undefined) {
          query.append("debug", String(params.debug));
        }
        if (params.snapshotKey) {
          query.append("snapshotKey", params.snapshotKey);
        }

        const url = `/Huurder/flow/${encodeURIComponent(
          params.id
        )}/continue?${query.toString()}`;

        const { data } = await fetchWrapper(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...body,
            paymentReturn: body.RedirectURL
              ? {
                  status: "success",
                  redirectUrl: body.RedirectURL,
                }
              : undefined,
          }),
        });

        if (data.error) {
          const error = new Error(data.error) as IFlowError;
          throw error;
        }

        return data as IFlowInitializationResponse;
      } catch (error) {
        handleFlowError(error);
        throw error as IFlowError;
      }
    },
    mutationKey: ["continueFlow", params.id, params.debug, params.snapshotKey],
    retry: (failureCount, error: IFlowError) => {
      if (error?.message?.includes("Notificaties")) {
        return failureCount < 3;
      }
      return false;
    },
    retryDelay: 1000,
    onError: handleFlowError,
    ...options,
  });

  return {
    continueFlow: mutation.mutateAsync,
    continueFlowLoading: mutation.isPending,
    continueFlowError: mutation.error,
    continueFlowReset: mutation.reset,
    error: mutation.error,
  };
};

// 4. Go back in the flow (params -> query params)
export const useBackFlow = (
  params: { id: string; debug?: string; snapshotKey?: string },
  options?: UseMutationOptions<IFlowInitializationResponse, unknown, void>
) => {
  const mutation = useMutation<IFlowInitializationResponse, unknown, void>({
    mutationFn: async () => {
      const query = new URLSearchParams();
      if (params.debug !== undefined)
        query.append("debug", String(params.debug));
      if (params.snapshotKey) query.append("snapshotKey", params.snapshotKey);
      const url = `/Huurder/flow/${encodeURIComponent(
        params.id
      )}/back?${query.toString()}`;
      const { data } = await fetchWrapper(url, { method: "POST" });
      return data as IFlowInitializationResponse;
    },
    mutationKey: ["backFlow", params.id, params.debug, params.snapshotKey],
    onError(error) {
      notifyModalToast({
        props: {
          message: formatErrorMessage(error),
          type: "error",
        },
      });
    },
    ...options,
  });

  return {
    backFlow: mutation.mutateAsync,
    backFlowLoading: mutation.isPending,
    backFlowReset: mutation.reset,
    backFlowData: mutation.data,
    ...mutation,
  };
};

// 5. Restore a flow (params -> query params)
export const useRestoreFlow = (
  params: { id: string; debug?: "true" | "false" },
  options?: UseMutationOptions<
    IFlowInitializationResponse,
    unknown,
    { snapshotKey?: string }
  >
) => {
  const mutation = useMutation<
    IFlowInitializationResponse,
    unknown,
    { snapshotKey?: string }
  >({
    mutationFn: async ({ snapshotKey }) => {
      const query = new URLSearchParams();
      if (params.debug !== undefined)
        query.append("debug", String(params.debug));
      if (snapshotKey) query.append("snapshotKey", snapshotKey);
      const url = `/Huurder/flow/${encodeURIComponent(
        params.id
      )}/restore?${query.toString()}`;
      const { data } = await fetchWrapper(url, { method: "POST" });
      return data as IFlowInitializationResponse;
    },
    ...options,
  });

  return {
    restoreFlow: mutation.mutateAsync,
    restoreFlowLoading: mutation.isPending,
    restoreFlowReset: mutation.reset,
    restoreFlowData: mutation.data,
    ...mutation,
  };
};
