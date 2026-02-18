import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import fetchWrapper from "@/config/api";
import { Buffer } from "buffer";

export const useFetchMessages = ({
  params,
  options,
}: {
  params: {};
  options?: Omit<UseQueryOptions<IMessage[]>, "queryKey" | "queryFn">;
}) => {
  const { data, isLoading, error, refetch, isRefetching, ...rest } = useQuery<
    IMessage[]
  >({
    queryKey: ["messages", params],
    queryFn: async () => {
      const response = await fetchWrapper("/Huurder/message/files", {
        method: "GET",
        params,
      });
      return response?.data;
    },
    retry: 1,
    retryDelay: 500,
    ...options,
  });

  return {
    messages: data,
    messagesLoading: isLoading,
    messagesError: error,
    messagesRefetch: refetch,
    isMessagesRefetching: isRefetching,
    ...rest,
  };
};

export const useFetchMessageById = ({
  id,
  options,
}: {
  id: string;
  options?: Omit<UseQueryOptions<string | null>, "queryKey" | "queryFn">;
}) => {
  return useQuery<string | null>({
    queryKey: ["messageFile", id],
    queryFn: async () => {
      const arrayBuffer = await fetchWrapper(`/Huurder/message/file/${id}`, {
        method: "GET",
        responseType: "arraybuffer",
      });
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      return base64;
    },
    retry: 1,
    // retryDelay: 500,
    ...options,
  });
};
