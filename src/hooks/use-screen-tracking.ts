import { useEffect, useMemo, useRef } from "react";
import { useSegments, usePathname, useLocalSearchParams } from "expo-router";
import { useRouteParamsObject } from "@/hooks/use-route-params-object";
import { trackScreen } from "@/config/analytics";

// Screens where we want to include ID in metadata (optional)
const SCREENS_WITH_OPTIONAL_ID = ["contracts"];

// Screens where we always want to include ID in metadata
const SCREENS_WITH_ID = [
  "post",
  "news",
  "financial",
  "house-valuation",
  "rent-score",
];

// Screens that should be tracked in their own components (not in useScreenTracking)
// These screens need params that aren't available in _layout.tsx
const SCREENS_TRACKED_IN_COMPONENT = ["flows"];

export function useScreenTracking() {
  const segments = useSegments();
  const pathname = usePathname();
  const params = useLocalSearchParams();
  // Use useRouteParamsObject to get route params (works better for dynamic routes)
  const routeParams = useRouteParamsObject<{
    id?: string;
    code?: string;
    flowCode?: string;
    flowName?: string;
    subject?: string;
    slug?: string;
    contractId?: string;
  }>();

  // Track if we've already tracked this screen to avoid duplicates
  const trackedRef = useRef<{
    screenName: string;
    readableIdentifier?: string;
  } | null>(null);

  const screenInfo = useMemo(() => {
    // Keep exact pathname as screen_name (don't break existing analytics)
    let exactScreenName: string;

    if (pathname && pathname !== "/") {
      // Remove leading slash and use pathname as-is
      exactScreenName = pathname.startsWith("/") ? pathname.slice(1) : pathname;
    } else if (segments && segments.length > 0) {
      // Build from segments, filtering out route groups
      const filteredSegments = segments.filter(
        (seg) => !seg.startsWith("(") || seg === "(tabs)" || seg === "(auth)"
      );
      exactScreenName = filteredSegments.join("/");
    } else {
      return null;
    }

    if (
      !exactScreenName ||
      exactScreenName === "root" ||
      exactScreenName === "_root"
    ) {
      return null;
    }

    // Extract base screen name (first part of path) for metadata
    const baseScreenName = exactScreenName.split("/")[0];

    // Extract ID from pathname if it exists (for dynamic routes like flows/[id])
    const pathParts = exactScreenName.split("/");
    const pathId = pathParts.length > 1 ? pathParts[1] : null;

    // Extract readable identifiers from params for metadata
    // Handle arrays by taking first element
    const getParamValue = (key: string): string | null => {
      // Try routeParams first (better for dynamic routes), then params
      const routeValue = routeParams?.[key as keyof typeof routeParams];
      if (routeValue != null && routeValue !== undefined && routeValue !== "") {
        return String(routeValue);
      }

      const value = params?.[key];
      if (!value) return null;
      if (Array.isArray(value)) return value[0] || null;
      return String(value);
    };

    // Extract screen ID (for tracking)
    // Priority: routeParams > params > pathname ID
    const screenId =
      getParamValue("code") ||
      getParamValue("flowCode") ||
      getParamValue("id") ||
      getParamValue("slug") ||
      getParamValue("contractId") ||
      pathId || // Fallback to ID from pathname
      null;

    // Extract readable identifiers based on screen type
    let readableIdentifier: string | undefined;

    switch (baseScreenName) {
      case "flows":
        // For flows, prioritize flowName (most human-readable), then flowCode, then code
        // If not in params, use ID from pathname as fallback
        readableIdentifier =
          getParamValue("flowName") ||
          getParamValue("flowCode") ||
          getParamValue("code") ||
          screenId || // Use ID from pathname if code not available
          undefined;
        break;
      case "post":
        // For posts, use subject (human-readable)
        readableIdentifier = getParamValue("subject") || screenId || undefined;
        break;
      case "news":
        // For news, prefer slug (more readable)
        readableIdentifier = getParamValue("slug") || screenId || undefined;
        break;
      case "contracts":
      case "financial":
      case "house-valuation":
      case "rent-score":
        // For these, use the ID as readable identifier
        readableIdentifier = screenId || undefined;
        break;
      default:
        // For other screens, use code if available, otherwise ID
        readableIdentifier =
          getParamValue("code") ||
          getParamValue("slug") ||
          screenId ||
          undefined;
    }

    // Determine if we should include ID in metadata
    const shouldIncludeId =
      screenId &&
      (SCREENS_WITH_ID.includes(baseScreenName) ||
        (SCREENS_WITH_OPTIONAL_ID.includes(baseScreenName) && screenId));

    return {
      screenName: exactScreenName, // Keep exact pathname - don't break existing analytics
      baseScreenName,
      screenId: shouldIncludeId ? screenId : undefined,
      readableIdentifier: readableIdentifier || undefined,
    };
  }, [
    pathname,
    segments.join("/"),
    JSON.stringify(params),
    JSON.stringify(routeParams),
  ]);

  useEffect(() => {
    if (!screenInfo) return;

    // Skip tracking for screens that should be tracked in their own components
    // These screens need params that aren't available in _layout.tsx
    if (SCREENS_TRACKED_IN_COMPONENT.includes(screenInfo.baseScreenName)) {
      return;
    }

    // Check if this is a new screen or if readable identifier has been updated
    const isNewScreen =
      trackedRef.current?.screenName !== screenInfo.screenName;
    const readableIdentifierUpdated =
      !isNewScreen &&
      trackedRef.current?.readableIdentifier !==
        screenInfo.readableIdentifier &&
      screenInfo.readableIdentifier;

    // Only track if it's a new screen
    if (!isNewScreen && !readableIdentifierUpdated) {
      return;
    }

    // Track with exact pathname as screen_name, add metadata as extra params
    trackScreen(screenInfo.screenName, {
      base_screen: screenInfo.baseScreenName,
      ...(screenInfo.screenId && { screen_id: screenInfo.screenId }),
      ...(screenInfo.readableIdentifier && {
        readable_identifier: screenInfo.readableIdentifier,
      }),
    });

    // Update tracked ref
    trackedRef.current = {
      screenName: screenInfo.screenName,
      readableIdentifier: screenInfo.readableIdentifier,
    };
  }, [screenInfo]);
}
