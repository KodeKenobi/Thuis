import { asyncStoragePersister, queryClient } from "@/config/react-query";
import { API_TIMEOUT, STORAGE_KEYS } from "@/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import Hypher from "hypher";
import dutch from "hyphenation.nl";

/* ────────────────────────────── inline base64/url decoder ───────────────────────────── */

function toBase64(b64url: string) {
  let s = (b64url || "").replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return s;
}

function atob(input: string): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let str = input.replace(/=+$/, "");
  let output = "";

  for (let bc = 0, bs = 0, buffer: any, i = 0; (buffer = str.charAt(i++)); ) {
    const index = chars.indexOf(buffer);
    if (index === -1) break;
    bs = bc % 4 ? bs * 64 + index : index;
    if (bc++ % 4) output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
  }
  return output;
}
/* ────────────────────────────── url helpers ───────────────────────────── */

export const isValidHttpUrl = (s?: string): s is string => {
  if (!s || typeof s !== "string") return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};
/* ────────────────────────────── errors ───────────────────────────── */

type ApiErr = any;

const stripTech = (msg?: string) =>
  (msg || "")
    .replace(/error with .*?:/gi, "")
    .replace(/request[:\s]*/gi, "")
    .replace(/\s+/g, " ")
    .trim();

const GENERIC_MSG = "Er is iets misgegaan, probeer het later opnieuw.";

function getStatusCode(error: any): number | null {
  const s =
    error?.status ??
    error?.response?.status ??
    error?.originalStatus ??
    error?.response?.data?.status ??
    null;

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function getRawMessage(error: any): string {
  return (
    error?.response?.data?.message?.error?.message ??
    error?.response?.data?.error?.message ??
    error?.response?.data?.message ??
    error?.response?.data?.detail ??
    error?.message ??
    ""
  );
}

export const formatErrorMessage = (
  error: ApiErr,
  opts?: { context?: "auth" | "default" }
): string => {
  const statusCode = getStatusCode(error);
  const raw = String(getRawMessage(error) || "");
  const lowered = stripTech(raw).toLowerCase();
  const looksLikeHtml =
    typeof raw === "string" &&
    /<html|<h1|<!doctype html|<body|<\/[a-z]+>/i.test(raw);

  /* ---- Hard fallbacks for infra/server outages & junk HTML pages ---- */
  if (
    statusCode === 503 ||
    /service unavailable|app service is offline/i.test(raw) ||
    looksLikeHtml
  ) {
    return GENERIC_MSG;
  }

  if (lowered.includes(String(API_TIMEOUT)) || /timeout/i.test(raw)) {
    return "Er is iets misgegaan. Controleer je internetverbinding en probeer het opnieuw.";
  }
  if (
    /network|fetch|failed to fetch|network error|typeerror: failed to fetch/i.test(
      raw
    )
  ) {
    return "Netwerkfout. Controleer je verbinding en probeer het opnieuw.";
  }

  if (statusCode === 429 || /too many requests|rate limit/i.test(raw)) {
    return opts?.context === "auth"
      ? "Je account is tijdelijk vergrendeld door te veel pogingen. Probeer het later opnieuw of reset je wachtwoord."
      : "Te veel verzoeken. Probeer het over een paar minuten opnieuw.";
  }

  /* ---- Auth-specific UX ---- */
  if (opts?.context === "auth") {
    if (
      statusCode === 401 ||
      statusCode === 403 ||
      /unauthorized|forbidden/i.test(raw) ||
      /loginname\/password invalid/i.test(raw) ||
      /invalid (credentials|username|password)/i.test(raw)
    ) {
      return "Onjuiste e-mailadres of wachtwoord. Controleer je gegevens of reset je wachtwoord.";
    }
    if (/locked|too many attempts|rate limit/i.test(raw)) {
      return "Je account is tijdelijk vergrendeld door te veel pogingen. Probeer het later opnieuw of reset je wachtwoord.";
    }
    if (/passcode|otp|verification|two[-\s]?factor/i.test(raw)) {
      return "We hebben een verificatiecode gestuurd. Voer de code in om door te gaan.";
    }
  }

  /* ---- Tenant/corporation selection errors ---- */
  if (/tenant|corporation|verhuurder/i.test(raw)) {
    return "Er is een probleem met je gekozen verhuurder. Kies je verhuurder opnieuw of probeer het later.";
  }

  if (statusCode !== null && statusCode >= 400 && statusCode < 500) {
    return "Er ging iets mis met je invoer. Controleer je gegevens en probeer opnieuw.";
  }
  if (statusCode !== null && statusCode >= 500 && statusCode < 600) {
    return GENERIC_MSG;
  }

  return GENERIC_MSG;
};

/* ────────────────────────────── money ───────────────────────────── */

interface FormatAmountOptions {
  currency: "EUR" | "USD";
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function formatAmount(
  amount: number,
  options: FormatAmountOptions
): string {
  const defaultLocales = { EUR: "nl-NL", USD: "en-US" as const };
  const {
    currency,
    locale = defaultLocales[currency],
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

/* ────────────────────────────── colors ──────────────────────────── */

export const getBackgroundColor = (color?: string, alpha = 0.2) => {
  const a = Math.min(1, Math.max(0, alpha));
  if (!color || !color.startsWith("#")) return `rgba(224,224,224,${a})`;
  let hex = color.slice(1);
  if (hex.length === 3)
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return `rgba(224,224,224,${a})`;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

/* ────────────────────────────── router helpers ──────────────────── */

export function serializeParamsForRouter<T extends Record<string, any>>(
  obj: T
): Record<string, string> {
  const out: Record<string, string> = {};
  (Object.entries(obj) as [keyof T, any][]).forEach(([k, v]) => {
    out[k as string] = typeof v === "string" ? v : JSON.stringify(v);
  });
  return out;
}

export function parseValue(v: string): any {
  try {
    return JSON.parse(v);
  } catch {}
  if (v === "true") return true;
  if (v === "false") return false;
  const num = Number(v);
  if (!isNaN(num) && String(num) === v) return num;
  return v;
}

/* ────────────────────────────── tokens ──────────────────────────── */

export const isTokenExpired = async (
  token: string,
  leewaySec = 60
): Promise<boolean> => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return true;
    const payloadJson = atob(toBase64(parts[1]));
    const payload = JSON.parse(payloadJson);

    const expSec = Number(payload?.exp);
    if (!Number.isFinite(expSec)) return true;

    const nowSec = Math.floor(Date.now() / 1000);

    // Optional: respect nbf (not before) if present
    const nbfSec = payload?.nbf ? Number(payload.nbf) : null;
    if (Number.isFinite(nbfSec) && nowSec + leewaySec < (nbfSec as number)) {
      // Token is not yet valid; treat as expired for safety
      return true;
    }

    // Consider token expired slightly earlier to avoid edge cases
    return expSec <= nowSec - leewaySec;
  } catch {
    return true;
  }
};

/* ────────────────────────────── news helpers ────────────────────── */

type ProseNode = {
  type?: string;
  attrs?: { src?: string };
  content?: ProseNode[];
};

export const getNewsThumbnail = (newsItem: INewsItem): string | null => {
  const root: any = newsItem?.content;
  const nodes: ProseNode[] = Array.isArray(root?.content)
    ? root.content
    : Array.isArray(root)
    ? root
    : [];
  for (const node of nodes) {
    if (node?.type === "image" && node?.attrs?.src) {
      return String(node.attrs.src);
    }
  }
  return null;
};

/* ────────────────────────────── contract helpers ────────────────── */

export function getActiveContracts(contracts: IContract[]) {
  const today = new Date();
  return (contracts || []).filter((c) => {
    const begin = new Date(c.begindatum);
    const end = c.einddatum ? new Date(c.einddatum) : null;
    return begin <= today && (!end || end >= today);
  });
}

export const getContractType = (contract: IContract) => {
  const first = contract?.eenheden?.[0];
  return first?.soort?.naam || "Woning";
};

export const getContractAddress = (contract: IContract) => {
  const address = contract?.eenheden?.[0]?.adres;
  if (!address) return "Geen adres beschikbaar";
  const straatnaam = address.straatnaam || "";
  const huisnummer = address.huisnummer || "";
  const woonplaats = address.woonplaats || "";
  return `${straatnaam} ${huisnummer}, ${woonplaats.toUpperCase()}`.trim();
};

export function isFlowDisabled(
  flow: TFlowProcess,
  activeContracts: IContract[]
) {
  return (
    (flow.requireContract &&
      (!activeContracts || activeContracts.length === 0)) ||
    !flow?.settings?.enabledWebsite
  );
}

export async function removeSession() {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
    AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    AsyncStorage.removeItem(STORAGE_KEYS.USER),
    queryClient.clear(),
    asyncStoragePersister.removeClient(),
  ]);
}

/* ────────────────────────────── file-share utils ────────────────── */

export const sanitizeFileName = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[^\w\-]+/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120)
    .toLowerCase();

export async function writePdfToCache(
  base64: string,
  name: string
): Promise<string> {
  const safe = sanitizeFileName(name);

  // Use cache directory for both platforms
  const directory = FileSystem.cacheDirectory;

  const path = `${directory}${safe}.pdf`;
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Ensure the file exists and is readable
  const fileInfo = await FileSystem.getInfoAsync(path);
  if (!fileInfo.exists) {
    throw new Error("Failed to create PDF file");
  }

  return path;
}

export async function shareFile(path: string, dialogTitle: string) {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Delen is niet beschikbaar op dit apparaat.");
  }
  await Sharing.shareAsync(path, { dialogTitle });
}

/* ────────────────────────────── payments ────────────────────────── */

export const generatePaymentStats = (
  paymentOverview: IGroupedPaymentData[]
) => {
  const overallStats = paymentOverview?.reduce(
    (acc, group) => {
      const totalSaldo = Number(group.totalSaldo) || 0;
      const totalBedrag = Number(group.totalBedrag) || 0;

      acc.totalOutstanding += totalSaldo;
      acc.totalInvoiced += totalBedrag;
      acc.totalPaid += totalBedrag - totalSaldo;

      group.items.forEach((item) => {
        const saldo = Number(item.saldo);
        if (saldo === 0) acc.paidInvoices++;
        else acc.unpaidInvoices++;
      });

      return acc;
    },
    {
      totalOutstanding: 0,
      totalInvoiced: 0,
      totalPaid: 0,
      paidInvoices: 0,
      unpaidInvoices: 0,
    }
  ) || {
    totalOutstanding: 0,
    totalInvoiced: 0,
    totalPaid: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
  };
  return overallStats;
};

/* ────────────────────────────── dates ───────────────────────────── */

export const formatDate = (
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }
) => {
  try {
    // Use toLocaleString if time options are provided, otherwise use toLocaleDateString
    const hasTimeOptions =
      options.hour !== undefined || options.minute !== undefined;
    const date = new Date(dateString);
    return hasTimeOptions
      ? date.toLocaleString("nl-NL", options)
      : date.toLocaleDateString("nl-NL", options);
  } catch {
    return dateString;
  }
};

/* ────────────────────────────── flow validation ─────────────────── */

export const validateFlowFields = (
  elements: TFlowElement[],
  formData: Record<string, any>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  elements.forEach((element) => {
    const outputKey = (element as any).data?.outputKey;
    switch (element.type) {
      case "list":
        if (outputKey && (element as any).data.required) {
          const value = formData[outputKey];
          if (!Array.isArray(value) || value.length === 0) {
            errors[outputKey] = "Selecteer ten minste één item";
          }
        }
        break;

      case "select":
        if (
          outputKey &&
          (element as any).data.required &&
          !formData[outputKey]
        ) {
          errors[outputKey] = "Dit veld is verplicht";
        }
        break;

      case "input":
        if (
          outputKey &&
          (element as any).data.required &&
          (!formData[outputKey] || !String(formData[outputKey]).trim())
        ) {
          errors[outputKey] = "Dit veld is verplicht";
        }
        if (outputKey && (element as any).data.pattern && formData[outputKey]) {
          const regex = new RegExp((element as any).data.pattern);
          if (!regex.test(String(formData[outputKey]))) {
            errors[outputKey] = "Ongeldig formaat";
          }
        }
        break;

      case "file":
        if (outputKey && (element as any).data.required) {
          if (
            (element as any).data.multipleFiles ||
            (element as any).data.multiple
          ) {
            if (
              Array.isArray(formData[outputKey]) &&
              formData[outputKey].length === 0
            ) {
              errors[outputKey] = "Dit veld is verplicht";
            }
          } else if (!formData[outputKey]) {
            errors[outputKey] = "Dit veld is verplicht";
          }
        }
        break;

      case "checkbox":
      case "date-input":
        if (
          outputKey &&
          (element as any).data.required &&
          !formData[outputKey]
        ) {
          errors[outputKey] = "Dit veld is verplicht";
        }
        break;
    }
  });

  return errors;
};

/* ────────────────────────────── hyphenation util ────────────────── */

const hypherInstance = new Hypher(dutch);
export function hyphenateDutch(text: string): string {
  return text
    .split(/\b/)
    .map((word) =>
      word.length > 10 ? hypherInstance.hyphenateText(word) : word
    )
    .join("");
}
