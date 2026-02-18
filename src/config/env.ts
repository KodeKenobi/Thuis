import { ENV_URLS, STORAGE_KEYS } from "@/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Updates from "expo-updates";
import { removeSession } from "@/utils";

export const getCurrentEnvironment = async () => {
  try {
    const env = await AsyncStorage.getItem(STORAGE_KEYS.ENVIRONMENT);
    return (env as keyof typeof ENV_URLS) || "production";
  } catch {
    return "production";
  }
};

// Get base URL for current environment
export const getCurrentBaseUrl = async () => {
  const env = await getCurrentEnvironment();
  return ENV_URLS[env] || ENV_URLS.production;
};

// Set new environment and restart app
export const setCurrentEnvironment = async (env: keyof typeof ENV_URLS) => {
  await AsyncStorage.setItem(STORAGE_KEYS.ENVIRONMENT, env);
  await removeSession();

  if (Platform.OS === "web") {
    window.location.reload();
  } else {
    await Updates.reloadAsync();
  }
};
