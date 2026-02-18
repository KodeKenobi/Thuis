import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import fetchWrapper from "@/config/api";

export const useFetchRentPeriods = ({
  params,
  options,
}: {
  params: { contractId: string };
  options?: Omit<UseQueryOptions<string[]>, "queryKey" | "queryFn">;
}) => {
  const {
    data: rentPeriods,
    isLoading: rentPeriodsLoading,
    error: rentPeriodsError,
    refetch: rentPeriodsRefetch,
    isRefetching,
  } = useQuery({
    queryKey: ["rent-periods", params.contractId],
    queryFn: async () => {
      const relativeUrl = "/Huurder/rent/periods";
      const response = await fetchWrapper(relativeUrl, {
        method: "GET",
        params: {
          contractId: params.contractId,
        },
      });
      return response?.data;
    },
    enabled: !!params.contractId,
    ...options,
  });

  return {
    rentPeriods,
    rentPeriodsLoading,
    rentPeriodsError,
    rentPeriodsRefetch,
    isRentPeriodReFetching: isRefetching,
  };
};

export const useFetchRentBreakdown = ({
  params,
  options,
}: {
  params: {
    contractId: string;
    rentStartDate: string;
  };
  options?: Omit<UseQueryOptions<IRentData[]>, "queryKey" | "queryFn">;
}) => {
  const {
    data: rentBreakdown,
    isLoading: rentBreakdownLoading,
    error: rentBreakdownError,
    refetch: rentBreakdownRefetch,
    isRefetching: isRentDataRefetching,
  } = useQuery({
    queryKey: ["rent-breakdown", params.contractId, params.rentStartDate],
    queryFn: async () => {
      const relativeUrl = "/Huurder/rent";
      const response = await fetchWrapper(relativeUrl, {
        method: "GET",
        params: {
          contractId: params.contractId,
          rentStartDate: params.rentStartDate?.split("T")[0],
        },
      });
      return response?.data;
    },
    enabled: !!params.contractId && !!params.rentStartDate,
    ...options,
  });

  return {
    rentBreakdown,
    rentBreakdownLoading,
    rentBreakdownError,
    rentBreakdownRefetch,
    isRentDataRefetching,
  };
};
