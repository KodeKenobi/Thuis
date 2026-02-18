import {
  UseQueryOptions,
  UseQueryResult,
  useQueries,
  useQuery,
} from "@tanstack/react-query";
import fetchWrapper from "@/config/api";

export const useFetchContracts = ({
  params,
  options,
}: {
  params: {
    subset?: TContractsSubset;
  };
  options?: Omit<UseQueryOptions<IContract[]>, "queryKey" | "queryFn">;
}) => {
  const { data, isLoading, error, refetch, isRefetching, ...rest } = useQuery<
    IContract[]
  >({
    queryKey: ["contracts", params],
    queryFn: async () => {
      const relativeUrl = `/Huurder/contract/contracts`;
      const response = await fetchWrapper(relativeUrl, {
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
    contracts: data,
    contractsLoading: isLoading,
    contractsError: error,
    contractsRefetch: refetch,
    isContractsRefetching: isRefetching,
    ...rest,
  };
};

export const useFetchContract = ({
  contractId,
  options,
}: {
  contractId: string;
  options?: Omit<UseQueryOptions<IContract | null>, "queryKey" | "queryFn">;
}) => {
  const { data, isLoading, error, refetch, isRefetching, ...rest } =
    useQuery<IContract | null>({
      queryKey: ["contracts", contractId],
      queryFn: () => fetchContractDetails(contractId),
      retry: 1,
      retryDelay: 500,
      ...options,
    });

  return {
    contract: data,
    contractLoading: isLoading,
    contractError: error,
    contractRefetch: refetch,
    isContractRefetching: isRefetching,
    ...rest,
  };
};

export interface UseContractsWithDetailsResult {
  contractsWithDetails: IContract[];
  contractsWithDetailsTotal: number;
  contractsWithDetailsLoading: boolean;
  contractsWithDetailsError: unknown;
  refetchContractsWithDetails: () => Promise<void>;
}

const fetchContractDetails = async (contractId: string) => {
  const relativeUrl = `/Huurder/contract/details/${contractId}`;
  const response = await fetchWrapper(relativeUrl, { method: "GET" });
  return response?.data;
};

export const useFetchContractsWithDetails =
  (): UseContractsWithDetailsResult => {
    // 1) fetch the “headers” list
    const {
      contracts: headerList,
      contractsLoading: isFetchingHeaders,
      contractsError: headersError,
      contractsRefetch: refetchHeaders,
    } = useFetchContracts({
      params: {},
    });

    // 2) fire off a details query for each header in parallel
    const detailQueries: UseQueryResult<IContract>[] = useQueries({
      queries:
        (headerList || [])?.map((h) => ({
          queryKey: ["contracts", { contractId: h.id }],
          queryFn: () => fetchContractDetails(h?.id),
          enabled: Boolean(h.id),
          retry: 1,
          retryDelay: 500,
        })) || [],
    });

    // 3) collect only the successful contract objects
    const data: IContract[] = detailQueries
      .map((q) => q.data)
      .filter((c): c is IContract => Boolean(c));

    // 4) compute the total brutoHuur
    const total = data.reduce((sum, c) => sum + (c.brutoHuur ?? 0), 0);

    // 5) aggregate loading & error
    const isLoading =
      isFetchingHeaders || detailQueries.some((q) => q.isLoading);
    const error =
      headersError || detailQueries.find((q) => q.error)?.error || null;

    // 6) a refetch that covers both levels
    const refetchContractsWithDetails = async () => {
      await refetchHeaders();
      await Promise.all(detailQueries.map((q) => q.refetch()));
    };

    return {
      contractsWithDetails: data,
      contractsWithDetailsTotal: total,
      contractsWithDetailsError: error,
      contractsWithDetailsLoading: isLoading,
      refetchContractsWithDetails,
    };
  };
