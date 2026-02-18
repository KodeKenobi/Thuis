// src/config/analytics.ts
// Using modular SDK API per https://rnfirebase.io/migrating-to-v22
import {
  getAnalytics,
  logEvent as firebaseLogEvent,
  setUserId,
  setUserProperties,
  resetAnalyticsData,
} from "@react-native-firebase/analytics";
import { getApp } from "@react-native-firebase/app";

// React Native Firebase Analytics is automatically initialized
// when the app starts (via google-services.json and GoogleService-Info.plist)

// Get Firebase app instance (modular SDK approach)
const getFirebaseApp = () => {
  try {
    return getApp();
  } catch (e) {
    console.warn("[Analytics] Failed to get Firebase app:", e);
    throw e;
  }
};

// Get analytics instance using modular SDK approach
const getAnalyticsInstance = () => {
  const app = getFirebaseApp();
  return getAnalytics(app);
};

// —————————————————————————————————————————————————————————————————————————
// Core logging function with proper types
export function logEvent(name: string, params?: Record<string, any>): void {
  try {
    const analyticsInstance = getAnalyticsInstance();
    // Use modular API: logEvent(analytics, name, params)
    firebaseLogEvent(analyticsInstance, name, params);
  } catch (e) {
    console.log("[Analytics] logEvent failed:", e);
  }
}

// —————————————————————————————————————————————————————————————————————————
// Screen tracking
export function trackScreen(
  name: string,
  extra?: {
    base_screen?: string;
    screen_id?: string;
    readable_identifier?: string;
  }
): void {
  logEvent("screen_view", {
    screen_name: name,
    screen_class: name,
    ...(extra?.base_screen && { base_screen: extra.base_screen }),
    ...(extra?.screen_id && { screen_id: extra.screen_id }),
    ...(extra?.readable_identifier && {
      readable_identifier: extra.readable_identifier,
    }),
  });
}

export function trackTab(tab: string): void {
  logEvent("tab_changed", { tab });
}

// —————————————————————————————————————————————————————————————————————————
// User identity and properties
export function setUser(id: string): void {
  try {
    const analyticsInstance = getAnalyticsInstance();
    // Use modular API: setUserId(analytics, userId)
    setUserId(analyticsInstance, id);
  } catch (e) {
    console.log("[Analytics] setUser failed:", e);
  }
}

export function setUserProps(props: Record<string, any>): void {
  try {
    const analyticsInstance = getAnalyticsInstance();
    // Filter out null/undefined values - Firebase requires strings
    const validProps: Record<string, string> = {};
    for (const [key, value] of Object.entries(props)) {
      if (value != null && typeof value === "string") {
        validProps[key] = value;
      } else if (value != null) {
        // Convert non-string values to strings
        validProps[key] = String(value);
      }
    }
    // Use modular API: setUserProperties(analytics, properties)
    setUserProperties(analyticsInstance, validProps);
  } catch (e) {
    console.log("[Analytics] setUserProps failed:", e);
  }
}

// —————————————————————————————————————————————————————————————————————————
// Custom analytics events
export function trackLogin(
  method: "email" | "biometric" | "microsoft" | string,
  extra?: Record<string, any>
): void {
  logEvent("user_login", { method, ...extra });
}

export function trackLogout(): void {
  logEvent("user_logout");
}

export function trackFlowStep(
  flow: string,
  step: string,
  extra?: Record<string, any>
): void {
  logEvent("flow_step", { flow, step, ...extra });
}

export function seedCorpTracking(
  corporation: string | null | undefined,
  environment: string | null | undefined,
  userId: string | null | undefined
): void {
  try {
    // Validate inputs - Firebase requires strings, not null/undefined
    if (!corporation || typeof corporation !== "string") {
      console.warn(
        "[Analytics] seedCorpTracking: corporation must be a non-empty string"
      );
      return;
    }
    if (!environment || typeof environment !== "string") {
      console.warn(
        "[Analytics] seedCorpTracking: environment must be a non-empty string"
      );
      return;
    }
    if (!userId || typeof userId !== "string") {
      console.warn(
        "[Analytics] seedCorpTracking: userId must be a non-empty string"
      );
      return;
    }

    const analyticsInstance = getAnalyticsInstance();

    // Set user properties first (corporation, environment)
    // Use modular API: setUserProperties(analytics, properties)
    setUserProperties(analyticsInstance, {
      corporation,
      environment,
    });

    // Set user ID (should be unique user identifier, not email)
    // Use modular API: setUserId(analytics, userId)
    setUserId(analyticsInstance, userId);

    // Track corporation seed event
    logEvent("corp_seed", { corporation, environment });
  } catch (e) {
    console.error("[Analytics] seedCorpTracking failed:", e);
  }
}

export function unseedCorpTracking(): void {
  try {
    const analyticsInstance = getAnalyticsInstance();
    // Use modular API: resetAnalyticsData(analytics)
    resetAnalyticsData(analyticsInstance);
  } catch (e) {
    console.error("[Analytics] unseedCorpTracking failed:", e);
  }
}
