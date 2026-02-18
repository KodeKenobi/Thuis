import fetchWrapper from "@/config/api";
import { UseQueryOptions, useQuery } from "@tanstack/react-query";

export const useFetchPayments = ({
  params,
  options,
}: {
  params: { status?: string };
  options?: Omit<UseQueryOptions<IPaymentData>, "queryKey" | "queryFn">;
}) => {
  const { status = "ALL" } = params;
  const { data, isLoading, error, refetch, isRefetching, ...rest } =
    useQuery<IPaymentData>({
      queryKey: ["payments", status],
      queryFn: async () => {
        const relativeUrl = `/Huurder/invoice`;
        const response = await fetchWrapper(relativeUrl, {
          method: "GET",
          params: {
            status,
          },
        });

        const data = response?.data as IPaymentData;

        return {
          ...data,
        };
      },
      retry: 1,
      retryDelay: 500,
      ...options,
    });

  return {
    payments: data,
    paymentsLoading: isLoading,
    paymentsError: error,
    paymentsRefetch: refetch,
    isPaymentsRefetching: isRefetching,
    ...rest,
  };
};

export const useFetchPaymentOverview = ({
  options,
}: {
  options?: Omit<
    UseQueryOptions<IGroupedPaymentData[]>,
    "queryKey" | "queryFn"
  >;
} = {}) => {
  const { data, isLoading, error, refetch, isRefetching, ...rest } = useQuery<
    IGroupedPaymentData[]
  >({
    queryKey: ["invoice-overview"],
    queryFn: async () => {
      try {
        const relativeUrl = `/Huurder/invoice`;
        const response = await fetchWrapper(relativeUrl, {
          method: "GET",
          params: {
            status: "ALL",
          },
        });

        // The API response structure is: { status, message, data: { items, totaalSaldo, etc } }
        const paymentData = response?.data;
        const paymentItems: IPaymentOverviewItem[] = paymentData?.items || [];

        // Group items by rental unit code, and create separate group for service contracts
        const grouped = paymentItems.reduce((acc, item) => {
          let code: string;

          if (item.huurovereenkomst?.code) {
            // Regular rental unit
            code = item.huurovereenkomst.code;
          } else {
            // Service contracts or other items without rental unit
            code = "SERVICE_CONTRACTS";
          }

          if (!acc[code]) {
            acc[code] = {
              rentalUnitCode: code,
              items: [],
              totalSaldo: 0,
              totalBedrag: 0,
            };
          }

          acc[code].items.push(item);
          acc[code].totalSaldo += item.saldo;
          acc[code].totalBedrag += item.bedrag;

          return acc;
        }, {} as Record<string, IGroupedPaymentData>);

        // Sort results: rental units first (alphabetically), then service contracts
        return Object.values(grouped).sort((a, b) => {
          if (a.rentalUnitCode === "SERVICE_CONTRACTS") return 1;
          if (b.rentalUnitCode === "SERVICE_CONTRACTS") return -1;
          return a.rentalUnitCode.localeCompare(b.rentalUnitCode);
        });
      } catch (error) {
        throw error;
      }
    },
    retry: 1,
    retryDelay: 500,
    ...options,
  });

  return {
    paymentOverview: data,
    paymentOverviewLoading: isLoading,
    paymentOverviewError: error,
    paymentOverviewRefetch: refetch,
    isPaymentOverviewRefetching: isRefetching,
    ...rest,
  };
};
