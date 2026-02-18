import fetchWrapper from "@/config/api";
import { notifyToast } from "@/config/toast";
import { formatErrorMessage } from "@/utils";
import {
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";

interface TContinueFlowBody {
  [key: string]: any;
}

interface IFlowError extends Error {
  message: string;
}

const handleFlowError = (error: unknown) => {
  notifyToast({
    props: {
      type: "error",
      message: formatErrorMessage(error),
    },
  });
};

export const useGetFlowProcess = (
  corporationName: string,
  options?: Omit<
    UseQueryOptions<
      TFlowProcess[],
      unknown,
      TFlowProcess[],
      ["auth-flow-process", string]
    >,
    "queryKey" | "queryFn"
  >
) => {
  const query = useQuery<
    TFlowProcess[],
    unknown,
    TFlowProcess[],
    ["auth-flow-process", string]
  >({
    queryKey: ["auth-flow-process", corporationName],
    queryFn: async () => {
      const url = `/Huurder/authentication/flow/process`;
      const { data } = await fetchWrapper(url, {
        method: "GET",
        skipAuth: true,
        params: {
          corporationName,
        },
      });
      return data;
    },
    retry: 1,
    enabled: !!corporationName,
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

// init flow
export const useInitiateFlow = (
  corporationName: string,
  options?: UseMutationOptions<
    IFlowInitializationResponse,
    unknown,
    { code: string }
  >
) => {
  const mutation = useMutation<
    IFlowInitializationResponse,
    unknown,
    { code: string }
  >({
    mutationFn: async ({ code }) => {
      const url = `/Huurder/authentication/flow/${encodeURIComponent(
        code
      )}/init`;
      const { data } = await fetchWrapper(url, {
        method: "POST",
        skipAuth: true,
        params: { corporationName },
      });
      return data as IFlowInitializationResponse;
    },
    mutationKey: ["initiateAuthFlow", corporationName],
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

export const useContinueFlow = (
  params: {
    id: string;
    debug?: string;
    snapshotKey?: string;
    corporationName: string;
  },
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

        if (params.corporationName) {
          query.append("corporationName", params.corporationName);
        }

        const url = `/Huurder/authentication/flow/${encodeURIComponent(
          params.id
        )}/continue?${query.toString()}`;

        const { data } = await fetchWrapper(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          skipAuth: true,
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
    mutationKey: [
      "continueAuthFlow",
      params.id,
      params.debug,
      params.snapshotKey,
      params.corporationName,
    ],
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
  params: {
    id: string;
    debug?: string;
    snapshotKey?: string;
    corporationName: string;
  },
  options?: UseMutationOptions<IFlowInitializationResponse, unknown, void>
) => {
  const mutation = useMutation<IFlowInitializationResponse, unknown, void>({
    mutationFn: async () => {
      const query = new URLSearchParams();
      if (params.debug !== undefined)
        query.append("debug", String(params.debug));
      if (params.snapshotKey) query.append("snapshotKey", params.snapshotKey);
      if (params.corporationName)
        query.append("corporationName", params.corporationName);
      const url = `/Huurder/authentication/flow/${encodeURIComponent(
        params.id
      )}/back?${query.toString()}`;
      const { data } = await fetchWrapper(url, {
        method: "POST",
        skipAuth: true,
      });
      return data as IFlowInitializationResponse;
    },
    mutationKey: [
      "backFlow",
      params.id,
      params.debug,
      params.snapshotKey,
      params.corporationName,
    ],
    onError(error) {
      notifyToast({
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
  params: { id: string; debug?: "true" | "false"; corporationName: string },
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
      if (params?.corporationName)
        query.append("corporationName", params?.corporationName);
      const url = `/Huurder/authentication/flow/${encodeURIComponent(
        params.id
      )}/restore?${query.toString()}`;
      const { data } = await fetchWrapper(url, {
        method: "POST",
        skipAuth: true,
      });
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
