import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import fetchWrapper from "@/config/api";

type TryFetchOk = { ok: true; data: IChatConfig };
type TryFetchNotFound = { ok: false; notFound: true };
type TryFetchResult = TryFetchOk | TryFetchNotFound;

const buildCandidates = (raw: string) => {
  const t = (raw || "").trim();
  const up = t.toUpperCase();
  const noSpaces = up.replace(/\s+/g, "");
  const alnum = up.replace(/[^A-Z0-9]/g, "");
  return Array.from(new Set([t, up, noSpaces, alnum])).map(encodeURIComponent);
};

const tryFetchOnce = async (key: string): Promise<TryFetchResult> => {
  const relativeUrl = `/Huurder/corporations/${key}`;
  const response = await fetchWrapper(relativeUrl, { method: "GET" });

  if (response.status !== "success") {
    const msg = String(response.message || "").toLowerCase();
    if (msg.includes("404") || msg.includes("not found")) {
      return { ok: false, notFound: true };
    }
    throw new Error(response.message || "Failed to fetch chat configuration");
  }

  const chatConfig = response.data?.liveChat;
  if (
    !chatConfig?.LIVECHAT_ORG_ID ||
    !chatConfig?.LIVECHAT_ORG_URL ||
    !chatConfig?.LIVECHAT_APP_ID
  ) {
    return { ok: false, notFound: true };
  }

  return { ok: true, data: chatConfig };
};

export const fetchChatConfig = async (
  corpRaw: string
): Promise<IChatConfig | null> => {
  if (!corpRaw) return null;

  for (const cand of buildCandidates(corpRaw)) {
    try {
      const res = await tryFetchOnce(cand);
      if (res.ok) return res.data;
      // notFound → try next candidate
    } catch (e: any) {
     
      throw e;
    }
  }
  return null;
};

export const useChatService = (
  corporationIdOrName: string | undefined,
  options?: UseQueryOptions<IChatConfig | null, Error> & { __env?: string }
) => {
  const envKey = options?.__env || "default";

  return useQuery<IChatConfig | null, Error>({
    queryKey: ["chat-config", envKey, (corporationIdOrName || "").trim()],
    queryFn: () => fetchChatConfig(corporationIdOrName as string),
    enabled: !!corporationIdOrName,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60,
    retry: (count, err) => {
      const m = String((err as Error)?.message || "");
      return !m.includes("404") && count < 1;
    },
    ...options,
  });
};
