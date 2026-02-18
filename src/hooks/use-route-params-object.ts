import { parseValue } from "@/utils";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";

export function useRouteParamsObject<T extends Record<string, any>>(): T {
  const raw = useLocalSearchParams<Record<string, string>>();
  return useMemo(() => {
    const out = {} as Record<string, any>;
    Object.entries(raw).forEach(([k, v]) => {
      if (v == null) return;
      out[k] = parseValue(v);
    });
    return out as T;
  }, [raw]);
}
