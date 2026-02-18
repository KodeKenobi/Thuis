import fetchWrapper from "@/config/api";
import { notifyToast } from "@/config/toast";
import { formatErrorMessage } from "@/utils";
import {
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";

export const useFetchCases = ({
  params,
  options,
}: {
  params: { subset: "all" | "open" | "closed" };
  options?: Omit<UseQueryOptions<ICase[]>, "queryKey" | "queryFn">;
}) => {
  const { data, isLoading, error, refetch, isRefetching, ...rest } = useQuery<
    ICase[]
  >({
    queryKey: ["cases", params],
    queryFn: async () => {
      const relativeUrl = `/Huurder/case/cases`;
      const response = await fetchWrapper(relativeUrl, {
        method: "GET",
        params,
      });
      const rawData = response?.data || [];
      return rawData.items.map((caseItem: ICase) => ({
        ...caseItem,
        status: caseItem.status || { label: "Unknown Status", code: 0 },
        state: caseItem.state || { label: "Unknown State", code: 0 },
      }));
    },
    retry: 1,
    retryDelay: 500,
    ...options,
  });

  return {
    cases: data,
    casesLoading: isLoading,
    casesError: error,
    casesRefetch: refetch,
    isCasesRefetching: isRefetching,
    ...rest,
  };
};

export const useCaseComment = (
  id: string,
  options?: UseMutationOptions<
    TCaseCommentResponse,
    unknown,
    TCaseCommentPayload
  >
) => {
  const mutation = useMutation<
    TCaseCommentResponse,
    unknown,
    TCaseCommentPayload
  >({
    mutationFn: async (body) => {
      const url = `/Huurder/case/${id}/add-comment`;
      const { data } = await fetchWrapper(url, { method: "POST", body });
      return data as TCaseCommentResponse;
    },
    mutationKey: ["leaveComment", id],
    onError(error) {
      notifyToast({
        props: {
          message: formatErrorMessage(error),
          type: "error",
        },
      });
    },
    onSuccess(res) {
      notifyToast({
        props: {
          message: "🎉 Reactie succesvol geplaatst!",
          type: "success",
        },
      });
    },
    ...options,
  });

  return {
    leaveComment: mutation.mutateAsync,
    leaveCommentLoading: mutation.isPending,
    leaveCommentReset: mutation.reset,
    leaveCommentData: mutation.data,
    ...mutation,
  };
};
