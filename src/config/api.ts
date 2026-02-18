import { API_URL, STORAGE_KEYS } from "@/constants";
import { formatErrorMessage, isTokenExpired, removeSession } from "@/utils";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { getCurrentBaseUrl } from "./env";
import { router } from "expo-router";

// Network throttling for stress testing (only in dev mode)
let networkThrottleDelay = 0;
export function setNetworkThrottle(delay: number) {
  if (__DEV__) {
    networkThrottleDelay = delay;
  }
}
export function clearNetworkThrottle() {
  networkThrottleDelay = 0;
}

const autoRefreshToken = async () => {
  try {
    const storedRefreshToken = await AsyncStorage.getItem(
      STORAGE_KEYS.REFRESH_TOKEN
    );

    if (!storedRefreshToken) {
      return;
    }
    const relativeUrl = "/Huurder/authentication/tokenRefresh";
    const ApiInstance = await createApiInstance();
    const { data: newToken } = await ApiInstance.post(relativeUrl, {
      token: storedRefreshToken,
    });
    const payload = JSON.parse(atob(newToken?.split(".")[1]));

    const user: TUser = {
      id: payload?.user?.loginId,
      name: payload?.user?.fullName,
      email: payload?.user?.loginName,
      custId: payload?.user?.custId,
      corporationName: payload?.user?.corporationName,
      corporation: {
        logo: "",
      },
      passCode: "",
    };

    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newToken);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return newToken;
  } catch (error: TApiError) {
    if (error?.response?.status === 401) {
      await removeSession();
      router.replace("/(auth)/signin-screen");
      return "";
    }
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  try {
    let token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      const tokenExpired = await isTokenExpired(token);

      if (!tokenExpired) {
        return token;
      }

      const refreshToken = await AsyncStorage.getItem(
        STORAGE_KEYS.REFRESH_TOKEN
      );
      if (!refreshToken) {
        await removeSession();
        return "";
      }
      const relativeUrl = "/Huurder/authentication/tokenRefresh";
      const ApiInstance = await createApiInstance();
      const { data: newToken } = await ApiInstance.post(relativeUrl, {
        token: refreshToken,
      });

      if (!newToken) {
        await removeSession();
        return "";
      }
      token = newToken?.data;
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token || "");
    }
    return token;
  } catch (error) {
    await removeSession();
    return "";
  }
};

const createApiInstance = async () => {
  const baseURL = await getCurrentBaseUrl();

  const instance = axios.create({
    baseURL,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
  
  instance.interceptors.request.use(
    async (config) => {
      // Apply network throttling if enabled (for stress testing)
      if (networkThrottleDelay > 0 && __DEV__) {
        await new Promise((resolve) =>
          setTimeout(resolve, networkThrottleDelay)
        );
      }
      return config;
    },
    (error) => {
      Promise.reject(error);
    }
  );
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const message = formatErrorMessage(error);
      if (
        (typeof message === "string" &&
          message.toLowerCase().includes("token expired")) ||
        message.toLowerCase().includes("token is not for this app")
      ) {
        autoRefreshToken();
        Promise.reject("Uw sessie is verlopen");
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Add response interceptor to handle token expiration globally

async function fetchWrapper(
  relativeUrl: string,
  options: TFetchOptions & {
    skipAuth?: boolean;
    responseType?: "json" | "arraybuffer";
  }
) {
  const {
    method = "GET",
    headers = {},
    body,
    skipAuth,
    responseType = "json",
    params,
  } = options;

  let token;
  if (!options?.skipAuth) {
    token = await getAccessToken();
  }

  const ApiInstance = await createApiInstance();

  const response = await ApiInstance.request({
    url: relativeUrl,
    method,
    responseType,
    params,
    data: body,
    headers: {
      ...(responseType !== "arraybuffer" && {
        "Content-Type": "application/json",
      }),
      ...(skipAuth ? {} : { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  });

  return response.data;
}

export default fetchWrapper;
