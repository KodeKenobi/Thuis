import fetchWrapper from "@/config/api";
import { useFetchContracts } from "./contracts";
import {
  UseQueryOptions,
  UseQueryResult,
  useQueries,
  useQuery,
} from "@tanstack/react-query";

type THouseValuetionParams = {
  unitId: string;
  startDate?: string;
};

export const fetchHouseValuation = async (
  params: THouseValuetionParams
): Promise<IHouseValuationData[]> => {
  const relativeUrl = `/Huurder/house-valuation/house-valuations`;
  const result = await fetchWrapper(relativeUrl, { method: "GET", params });
  return result.data || [];
};

export const useFetchHouseValuationDetails = ({
  params,
  options,
}: {
  params: THouseValuetionParams;
  options?: Omit<
    UseQueryOptions<IHouseValuationData[]>,
    "queryKey" | "queryFn"
  >;
}) => {
  const { data, isLoading, error, refetch, isRefetching, ...rest } = useQuery<
    IHouseValuationData[]
  >({
    queryKey: [
      "houseValuation",
      {
        ...params,
        startDate: params.startDate || new Date().toISOString().split("T")[0],
      },
    ],
    queryFn: async () =>
      fetchHouseValuation({
        ...params,
        startDate: params.startDate || new Date().toISOString().split("T")[0],
      }),
    retry: 1,
    retryDelay: 500,
    ...options,
  });

  return {
    houseValuationDetails: data,
    houseValuationDetailsLoading: isLoading,
    houseValuationDetailsError: error,
    houseValuationDetailsRefetch: refetch,
    isHouseValuationDetailsRefetching: isRefetching,
    ...rest,
  };
};

export const useFetchHouseValuationForRelatie = ({}: {}) => {
  // 1) Fetch all contracts first
  const { contracts, contractsLoading, contractsError, contractsRefetch } =
    useFetchContracts({
      params: {},
    });

  const units = (contracts || [])
    .flatMap((contract) => contract.eenheden)
    .map((eenheid) => ({
      unitId: eenheid.id,
      straatnaam: eenheid.adres.straatnaam,
      huisnummer: eenheid.adres.huisnummer,
    }))
    .filter(
      (unit, index, self) =>
        unit.unitId && self.findIndex((u) => u.unitId === unit.unitId) === index
    );

  // 2) For each contract, create a rent‑data query
  const houseValuationQueries: UseQueryResult<IHouseValuation | null>[] =
    useQueries({
      queries:
        units?.map((unit) => ({
          queryKey: ["houseValuation", { unitId: unit?.unitId }],
          queryFn: () =>
            fetchHouseValuation({
              unitId: unit?.unitId || "",
            }),
          enabled: !!unit?.unitId,
          retry: 1,
          retryDelay: 500,

        })) || [],
    });

  // 3) Combine results into your final shape
  const allHouseValuationData = units
    ? units.map((unit, idx) => {
        return {
          straatnaam: unit.straatnaam,
          huisnummer: unit.huisnummer,
          valuation: houseValuationQueries[idx]?.data,
        };
      })
    : [];

  // 4) Combined loading / error flags
  const isLoading =
    contractsLoading || houseValuationQueries.some((q) => q.isLoading);
  const isRefetching =
    houseValuationQueries.some((q) => q.isRefetching) || false;
  const error =
    contractsError || houseValuationQueries.find((q) => q.error)?.error || null;

  // 5) expose a refetch that will refresh both levels
  const refetch = async () => {
    await contractsRefetch();
    await Promise.all(houseValuationQueries.map((q) => q.refetch()));
  };

  return {
    allHouseValuationData: allHouseValuationData as {
      valuation: IHouseValuation;
      straatnaam: string;
      huisnummer: string;
    }[],
    allHouseValuationDataLoading: isLoading,
    allHouseValuationDataIsRefetching: isRefetching,
    allHouseValuationDataError: error,
    allHouseValuationDataRefetch: refetch,
  };
};
