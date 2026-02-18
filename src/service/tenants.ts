import fetchWrapper from "@/config/api";
import { LIVE_CORPORATIONS } from "@/constants";
import { useAuth } from "@/contexts/auth-context";
import { UseQueryOptions, useQuery } from "@tanstack/react-query";

export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const useGetTenants = ({
  options,
  querykeySuffix,
}: {
  options?: Omit<UseQueryOptions<ITenant[]>, "queryKey" | "queryFn">;
  querykeySuffix?: string;
}) => {
  const { environment } = useAuth();
  const { data, isLoading, error, refetch, isRefetching, ...rest } = useQuery<
    ITenant[]
  >({
    queryKey: ["tenants", querykeySuffix],
    queryFn: async () => {
      const requiredCorporation = LIVE_CORPORATIONS;
      const relativeUrl = "/Huurder/corporations";
      const response = await fetchWrapper(relativeUrl, {
        method: "GET",
        ...(environment === "production"
          ? {
              params: {
                requiredCorporation,
              },
            }
          : {}),
      });
      return response?.data;
    },
    retry: 1,
    retryDelay: 500,
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
    ...options,
  });

  return {
    tenants: data
      ?.filter((tenant) => tenant?.status === "ACTIVE")
      ?.sort((a, b) => a.displayName.localeCompare(b.displayName)),
    tenantsLoading: isLoading,
    tenantsError: error,
    tenantsRefetch: refetch,
    isTenantsRefetching: isRefetching,
    ...rest,
  };
};
