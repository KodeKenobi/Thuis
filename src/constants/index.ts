import { Dimensions } from "react-native";
import Constants from "expo-constants";

export const API_URL = process.env.EXPO_PUBLIC_PRODUCTION_API_URL;
export const DEVELOP_API_URL = process.env.EXPO_PUBLIC_DEVELOP_API_URL;
export const SANDBOX_API_URL = process.env.EXPO_PUBLIC_SANDBOX_API_URL;

export const LIVE_CORPORATIONS =
  process.env.EXPO_PUBLIC_LIVE_CORPORATIONS || "KNUSWONEN";

export const DEPLOYMENT_ENVIRONMENT: "testing" | "production" =
  (process.env.EXPO_PUBLIC_DEPLOYMENT_ENVIRONMENT as
    | "testing"
    | "production") || "production";

export const ENV_URLS = {
  production: API_URL,
  sandbox: DEPLOYMENT_ENVIRONMENT === "testing" ? SANDBOX_API_URL : API_URL,
  develop: DEPLOYMENT_ENVIRONMENT === "testing" ? DEVELOP_API_URL : API_URL,
};

export const API_TIMEOUT = 10000;
const { width, height } = Dimensions.get("window");

const screen = Dimensions.get("screen");

const statusBarHeight = Constants.statusBarHeight;

export const SIZES = {
  padding: 24,
  radius: 12,
  screen,
  statusBarHeight,
  viewport: {
    height,
    width,
  },
  sheet: {
    radius: 12,
  },
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
  HAS_ONBOARDED: "hasOnboarded",
  CORPORATION_ONBOARDED: "corporationOnboarded",
  ENVIRONMENT: "environment",
  BIOMETRIC_PRIVATE_KEY: "biometricPrivateKey",
  UNFINISHED_FLOWS: "unfinishedFlows",
};
