import fetchWrapper from "@/config/api";
import { useFetchContracts } from "./contracts";
import {
  UseQueryOptions,
  UseQueryResult,
  useQueries,
  useQuery,
} from "@tanstack/react-query";

export type RepairType = "EIGEN" | "COLLECTIEF";
export type RepairStatusType = "OPEN" | "AFGEHANDELD" | "ALL";

/* ????????????????????????????????
   PARAMS + NORMALIZERS
???????????????????????????????? */

type TMaintananceParams = {
  unitId?: string;
  contractId: string;
  repairType?: RepairType;
  repairStatusType?: RepairStatusType;
};

const normalizeRepairType = (rt?: string): RepairType | undefined => {
  if (!rt) return undefined;
  const v = rt.toUpperCase();
  if (v === "EIGEN") return "EIGEN";
  if (v === "COLLECTIEF") return "COLLECTIEF";
  return undefined;
};

const normalizeStatus = (st?: string): RepairStatusType => {
  const v = (st || "ALL").toUpperCase();
  if (v === "OPEN") return "OPEN";
  if (v === "AFGEHANDELD") return "AFGEHANDELD";
  return "ALL";
};

/* ????????????????????????????????
   LIST: /Huurder/maintainance/maintainances
???????????????????????????????? */

export const fetchMaintenanceDetails = async (
  params: TMaintananceParams
): Promise<IMaintenance[]> => {
  const relativeUrl = `/Huurder/maintainance/maintainances`;

  const normalized: TMaintananceParams = {
    ...params,
    repairType: normalizeRepairType(params.repairType),
    repairStatusType: normalizeStatus(params.repairStatusType),
  };

  const result = await fetchWrapper(relativeUrl, {
    method: "GET",
    params: normalized,
  });

  return result?.data || [];
};

const safeFetch = async (
  params: TMaintananceParams
): Promise<IMaintenance[]> => {
  try {
    return await fetchMaintenanceDetails(params);
  } catch (e: any) {
    const status = e?.response?.status;
    if (status === 400 || status === 404) return [];
    throw e;
  }
};

/**
 * Tenant-safe fetch:
 *  - For COLLECTIEF ? try with and without unitId, merge results
 *  - For EIGEN      ? single call with normalized status
 */
export const fetchMaintenanceTenantSafe = async (
  params: TMaintananceParams
): Promise<IMaintenance[]> => {
  const type = normalizeRepairType(params.repairType);
  const status = normalizeStatus(params.repairStatusType);

  if (type === "COLLECTIEF") {
    const withParams: TMaintananceParams = {
      contractId: params.contractId,
      unitId: params.unitId,
      repairType: "COLLECTIEF",
      repairStatusType: status,
    };
    const withoutParams: TMaintananceParams = {
      contractId: params.contractId,
      repairType: "COLLECTIEF",
      repairStatusType: status,
    };

    const [withRes, withoutRes] = await Promise.allSettled([
      safeFetch(withParams),
      safeFetch(withoutParams),
    ]);

    const withData =
      withRes.status === "fulfilled" ? withRes.value : [];
    const withoutData =
      withoutRes.status === "fulfilled" ? withoutRes.value : [];

    const map = new Map<string | number, IMaintenance>();
    for (const item of [...withData, ...withoutData]) {
      map.set((item as any)?.id, item);
    }

    return Array.from(map.values());
  }

  // default: EIGEN
  return safeFetch({
    ...params,
    repairType: "EIGEN",
    repairStatusType: status,
  });
};

export const useFetchMaintananceDetails = ({
  params,
  options,
}: {
  params: TMaintananceParams;
  options?: Omit<UseQueryOptions<IMaintenance[]>, "queryKey" | "queryFn">;
}) => {
  const { repairType = "EIGEN", repairStatusType = "ALL", ...all } = params;

  const normalizedType = normalizeRepairType(repairType) as RepairType;
  const normalizedStatus = normalizeStatus(repairStatusType);

  const { data, isLoading, error, refetch, isRefetching, ...rest } = useQuery<
    IMaintenance[]
  >({
    queryKey: [
      "maintananceDetails",
      "single",
      normalizedType,
      normalizedStatus,
      all,
    ],
    queryFn: () =>
      fetchMaintenanceTenantSafe({
        ...all,
        repairType: normalizedType,
        repairStatusType: normalizedStatus,
      }),
    retry: (failureCount: number, error: any) => {
      const status = error?.response?.status;
      return !!status && status >= 500 && failureCount < 1;
    },
    retryDelay: 500,
    ...options,
  });

  return {
    maintanaceDetails: data,
    maintanaceDetailsLoading: isLoading,
    maintanaceDetailsError: error,
    maintanaceDetailsRefetch: refetch,
    isMaintanaceDetailsRefetching: isRefetching,
    ...rest,
  };
};

/* ????????????????????????????????
   DETAIL: /Huurder/maintainance/{id}
???????????????????????????????? */

export const fetchMaintananceDetailById = async (
  id: string
): Promise<IMaintenanceDetail> => {
  const relativeUrl = `/Huurder/maintainance/${id}`;
  const result = await fetchWrapper(relativeUrl, { method: "GET" });

  return result.data as IMaintenanceDetail;
};

export const useFetchMaintananceDetail = ({
  id,
  options,
}: {
  id?: string;
  options?: Omit<UseQueryOptions<IMaintenanceDetail>, "queryKey" | "queryFn">;
}) => {
  const { data, isLoading, error, refetch, isRefetching, ...rest } = useQuery<
    IMaintenanceDetail
  >({
    enabled: !!id,
    queryKey: ["maintananceDetail", id],
    queryFn: async () => fetchMaintananceDetailById(id as string),
    retry: 1,
    retryDelay: 500,
    ...options,
  });

  return {
    maintananceDetail: data,
    maintananceDetailLoading: isLoading,
    maintananceDetailError: error,
    maintananceDetailRefetch: refetch,
    isMaintananceDetailRefetching: isRefetching,
    ...rest,
  };
};

/* ????????????????????????????????
   ALL MAINTENANCE FOR RELATIE
???????????????????????????????? */

export const useFetchMaintenanceForRelatie = ({
  repairType,
  repairStatusType = "ALL",
}: {
  repairType: RepairType;
  repairStatusType?: RepairStatusType;
}) => {
  const normalizedType = normalizeRepairType(repairType) as RepairType;
  const normalizedStatus = normalizeStatus(repairStatusType);

  const { contracts, contractsLoading, contractsError, contractsRefetch } =
    useFetchContracts({ params: {} });

  const maintanaceQueries: UseQueryResult<IMaintenance[] | null>[] = useQueries(
    {
      queries:
        contracts?.map((contract: IContract) => ({
          queryKey: [
            "maintananceDetails",
            "relatie",
            contract.id,
            normalizedType,
            normalizedStatus,
          ],
          queryFn: () =>
            fetchMaintenanceTenantSafe({
              unitId: contract?.eenheden?.[0]?.id || undefined,
              contractId: contract?.id,
              repairType: normalizedType,
              repairStatusType: normalizedStatus,
            }),
          enabled: !!contract.id,
          retry: (failureCount: number, error: any) => {
            const status = error?.response?.status;
            return !!status && status >= 500 && failureCount < 1;
          },
          retryDelay: 500,
        })) || [],
    }
  );

  const allMaintananceData = contracts
    ? contracts
        .filter((_, idx) => maintanaceQueries[idx]?.data)
        .flatMap((contract, idx) =>
          (maintanaceQueries[idx]?.data || []).map((item) => ({
            ...item,
            contract,
          }))
        )
    : [];

  const isLoading =
    contractsLoading || maintanaceQueries.some((q) => q.isLoading);
  const isRefetching = maintanaceQueries.some((q) => q.isRefetching) || false;
  const error =
    contractsError || maintanaceQueries.find((q) => q.error)?.error || null;

  const refetch = async () => {
    await contractsRefetch();
    await Promise.all(maintanaceQueries.map((q) => q.refetch()));
  };

  return {
    allMaintananceData: allMaintananceData as IMaintenance[],
    allMaintananceDataLoading: isLoading,
    allMaintananceDataIsRefetching: isRefetching,
    allMaintananceDataError: error,
    allMaintananceDataRefetch: refetch,
  };
};

/* ????????????????????????????????
   CONVENIENCE WRAPPERS
???????????????????????????????? */

export const useFetchEigenMaintenanceForRelatie = (opts?: {
  repairStatusType?: RepairStatusType;
}) =>
  useFetchMaintenanceForRelatie({
    repairType: "EIGEN",
    repairStatusType: opts?.repairStatusType ?? "ALL",
  });

export const useFetchCollectiefMaintenanceForRelatie = (opts?: {
  repairStatusType?: RepairStatusType;
}) =>
  useFetchMaintenanceForRelatie({
    repairType: "COLLECTIEF",
    repairStatusType: opts?.repairStatusType ?? "ALL",
  });
