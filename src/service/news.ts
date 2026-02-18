import fetchWrapper from "@/config/api";
import { UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useFetchContracts } from "./contracts";
import { LOCAL_NEWS_CORPORATIONS_CONFIG } from "@/config/local-news-config";

function isLocalNewsTenant(corporationCode?: string | null) {
  if (!corporationCode) return false;
  return LOCAL_NEWS_CORPORATIONS_CONFIG.includes(corporationCode.toUpperCase());
}

function pickNewsList(body: any): INewsItem[] {
  if (!body) throw new Error("Empty response body");

  if (Array.isArray(body)) return body as INewsItem[];

  if (Array.isArray(body.data)) return body.data as INewsItem[];

  if (typeof body.status !== "undefined" && Array.isArray(body.data)) {
    return body.data as INewsItem[];
  }

  if (body.data && Array.isArray(body.data.data))
    return body.data.data as INewsItem[];

  const keys = typeof body === "object" ? Object.keys(body) : [];
  throw new Error(`Unexpected list shape (keys: ${keys.join(", ") || "none"})`);
}

function pickNewsItem(body: any): INewsItem {
  if (!body) throw new Error("Empty response body");

  if (body && typeof body === "object" && (body.slug || body.id))
    return body as INewsItem;

  if (
    body.data &&
    typeof body.data === "object" &&
    (body.data.slug || body.data.id)
  ) {
    return body.data as INewsItem;
  }

  if (
    typeof body.status !== "undefined" &&
    body.data &&
    typeof body.data === "object" &&
    (body.data.slug || body.data.id)
  ) {
    return body.data as INewsItem;
  }

  const keys = typeof body === "object" ? Object.keys(body) : [];
  throw new Error(
    `Unexpected detail shape (keys: ${keys.join(", ") || "none"})`
  );
}

export const useFetchGeneralNews = ({
  options,
}: {
  options?: Omit<UseQueryOptions<INewsItem[]>, "queryKey" | "queryFn">;
}) => {
  const { data, isLoading, error, refetch, isRefetching, ...rest } = useQuery<
    INewsItem[]
  >({
    queryKey: ["generalNews"],
    queryFn: async () => {
      const { data } = await fetchWrapper("/Huurder/news/generalNews", {
        method: "GET",
      });
      return pickNewsList(data);
    },
    retry: 1,
    retryDelay: 500,
    ...options,
  });

  return {
    news: data,
    newsLoading: isLoading,
    newsError: error,
    newsRefetch: refetch,
    isNewsRefetching: isRefetching,
    ...rest,
  };
};

export const useFetchLocalNews = ({
  options,
}: {
  options?: Omit<UseQueryOptions<INewsItem[]>, "queryKey" | "queryFn">;
}) => {
  const { user } = useAuth() as any;
  const corporationCode: string | undefined =
    user?.corporationKey || user?.corporationName;

  const localTenant = isLocalNewsTenant(corporationCode);

  const {
    contracts,
    contractsLoading,
    contractsError,
  } = useFetchContracts({
    params: {},
  });
  const primaryContract: IContract | undefined = contracts?.[0];

  const unitId = primaryContract?.eenheden?.[0]?.id;
  const contractId = primaryContract?.id;

  const {
    data,
    isLoading: queryLoading,
    error: queryError,
    refetch,
    isRefetching,
    ...rest
  } = useQuery<INewsItem[]>({
    queryKey: [
      "tenantNews",
      localTenant ? "local" : "general",
      corporationCode,
      unitId,
      contractId,
    ],
    enabled: localTenant
      ? !!(unitId && contractId) && !contractsLoading && !contractsError
      : true,
    queryFn: async () => {
      if (!localTenant) {
        const { data } = await fetchWrapper("/Huurder/news/generalNews", {
          method: "GET",
        });
        return pickNewsList(data);
      }

      if (!unitId || !contractId) {
        throw new Error(
          "unitId and contractId are required for local news (no contract found)."
        );
      }

      const params = new URLSearchParams({
        unitId,
        contractId,
      }).toString();

      const { data } = await fetchWrapper(
        `/Huurder/news/localNews?${params}`,
        {
          method: "GET",
        }
      );
      return pickNewsList(data).map((item) => ({
        ...item,
        slug: item.slug ?? item.id,
      }));
    },
    retry: 1,
    retryDelay: 500,
    ...options,
  });

  const mergedLoading = queryLoading || (localTenant && contractsLoading);
  const mergedError = queryError || (localTenant ? contractsError : null);

  return {
    news: data,
    newsLoading: mergedLoading,
    newsError: mergedError,
    newsRefetch: refetch,
    isNewsRefetching: isRefetching,
    ...rest,
  };
};

export const useFetchNewsBySlug = ({
  slug,
  options,
}: {
  slug: string | undefined;
  options?: Omit<UseQueryOptions<INewsItem>, "queryKey" | "queryFn">;
}) => {
  const { data, isLoading, error, refetch, isRefetching, ...rest } =
    useQuery<INewsItem>({
      enabled: !!slug,
      queryKey: ["generalNews", slug],
      queryFn: async () => {
        const { data } = await fetchWrapper(
          `/Huurder/news/generalNews/${slug}`,
          { method: "GET" }
        );
        return pickNewsItem(data);
      },
      retry: 1,
      retryDelay: 500,
      ...options,
    });

  return {
    newsItem: data,
    newsItemLoading: isLoading,
    newsItemError: error,
    newsItemRefetch: refetch,
    isNewsItemRefetching: isRefetching,
    ...rest,
  };
};

export const useFetchNewsById = ({
  id,
  options,
}: {
  id: string | undefined;
  options?: Omit<UseQueryOptions<INewsItem>, "queryKey" | "queryFn">;
}) => {
  const { user } = useAuth() as any;
  const corporationCode: string | undefined =
    user?.corporationKey || user?.corporationName;

  const localTenant = isLocalNewsTenant(corporationCode);

  const { data, isLoading, error, refetch, isRefetching, ...rest } =
    useQuery<INewsItem>({
      enabled: !!id,
      queryKey: [
        "tenantNewsItem",
        localTenant ? "local" : "general",
        corporationCode,
        id,
      ],
      queryFn: async () => {
        if (!id) {
          throw new Error("News id is required");
        }

        const path = localTenant
          ? `/Huurder/news/localNews/${id}`
          : `/Huurder/news/generalNews/${id}`;

        const { data } = await fetchWrapper(path, { method: "GET" });
        return pickNewsItem(data);
      },
      retry: 1,
      retryDelay: 500,
      ...options,
    });

  return {
    newsItem: data,
    newsItemLoading: isLoading,
    newsItemError: error,
    newsItemRefetch: refetch,
    isNewsItemRefetching: isRefetching,
    ...rest,
  };
};
