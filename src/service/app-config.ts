import fetchWrapper from "@/config/api";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

export const useFetchAppConfig = ({
  options,
}: {
  options?: Omit<UseQueryOptions<TAppConfig | null>, "queryKey" | "queryFn">;
}) => {
  const { data, isLoading, error, refetch, isRefetching, ...rest } =
    useQuery<TAppConfig | null>({
      queryKey: ["app-config"],
      queryFn: async () => {
        const response = await fetchWrapper(`/Huurder/corporations/details`, {
          method: "GET",
        });

        return response.data;
      },
      retry: 1,
      ...options,
    });

  return {
    appConfig: data,
    appConfigLoading: isLoading,
    appConfigError: error,
    appConfigRefetch: refetch,
    isAppConfigRefetching: isRefetching,
    ...rest,
  };
};
