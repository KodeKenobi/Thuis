import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useFetchUserData, useRefreshTokenService } from "@/service/auth";
import { isTokenExpired, removeSession } from "@/utils";
import { DEPLOYMENT_ENVIRONMENT, ENV_URLS, STORAGE_KEYS } from "@/constants";
import { getOrgColor } from "@/constants/colors";
import { getCurrentEnvironment, setCurrentEnvironment } from "@/config/env";
import { router } from "expo-router";
import {
  seedCorpTracking,
  trackLogout,
  unseedCorpTracking,
} from "@/config/analytics";
import { clearFontCache } from "@/utils/font-preloader";
import { Platform } from "react-native";

const AuthContext = createContext<IAuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<TUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [corporationOnboarded, setCorporationOnboarded] = useState({
    id: "",
    corporationName: "",
  });
  const [environment, setEnvironment] =
    useState<keyof typeof ENV_URLS>("production");
  const [biometric, setBiometrics] = useState<string>("");

  const { refreshToken } = useRefreshTokenService();

  const { userData } = useFetchUserData();

  const signIn = async (user: TUser) => {
    const { access_token, refresh_token, ...rest } = user;
    const color = user?.corporationName
      ? getOrgColor(user?.corporationName)
      : "#00A7DB";
    const updatedUser: TUser = {
      ...user,
      color,
    };
    setUser(updatedUser);
    if (access_token) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(rest));
      if (refresh_token) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
      }
    }
  };

  const signOut = async () => {
    trackLogout();
    unseedCorpTracking();
    // Clear font cache and FileSystem cache on logout
    await clearFontCache(true);
    setUser(null);
    await removeSession();
    router.replace("/(auth)/signin-screen");
  };

  const updateEnvironment = async (env: keyof typeof ENV_URLS) => {
    if (DEPLOYMENT_ENVIRONMENT === "production") return;
    setEnvironment(env);
    await setCurrentEnvironment(env);
  };

  const updateBiometrics = async (privateKey?: string) => {
    if (privateKey) {
      await SecureStore?.setItemAsync(
        STORAGE_KEYS.BIOMETRIC_PRIVATE_KEY,
        privateKey,
      );
    } else {
      await SecureStore?.deleteItemAsync(STORAGE_KEYS.BIOMETRIC_PRIVATE_KEY);
    }
    setBiometrics(privateKey || "");
  };

  const autoRefreshToken = async () => {
    try {
      const storedRefreshToken = await AsyncStorage.getItem(
        STORAGE_KEYS.REFRESH_TOKEN,
      );

      if (!storedRefreshToken) {
        return;
      }
      await refreshToken({ token: storedRefreshToken }).then(async (res) => {
        const payload = JSON.parse(atob(res?.split(".")[1]));

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

        setUser(user);
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, res);
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify(payload?.user),
        );
      });
    } catch (error) {
      await signOut();
    }
  };

  const initializeAuth = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (token) {
        const tokenExpired = await isTokenExpired(token);
        if (tokenExpired) {
          await autoRefreshToken();
        }
        if (!tokenExpired) {
          const user = await AsyncStorage.getItem(STORAGE_KEYS.USER);
          if (user) {
            setUser(JSON.parse(user));
            const parsedUser = JSON.parse(user);
            // Use corporationKey if available, otherwise fallback to corporationName
            const corporationId =
              parsedUser?.corporationKey || parsedUser?.corporationName;
            const userId =
              parsedUser?.loginId || parsedUser?.email || parsedUser?.id;

            if (corporationId && userId) {
              seedCorpTracking(
                corporationId,
                DEPLOYMENT_ENVIRONMENT || "production",
                userId,
              );
            }
          }
        }
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error initializing auth:", error);
    }
  };

  const loadEnvironment = async () => {
    if (DEPLOYMENT_ENVIRONMENT === "production") return;
    const env = await getCurrentEnvironment();
    if (env) {
      setEnvironment(env);
    }
  };

  const loadCorporationOnboarding = async () => {
    const onboarding = await AsyncStorage.getItem(
      STORAGE_KEYS.CORPORATION_ONBOARDED,
    );
    if (onboarding) {
      setCorporationOnboarded(JSON.parse(onboarding));
    }
  };

  const loadBiometricSettings = async () => {
    if (Platform.OS === "web") return;
    const privateKey = await SecureStore?.getItemAsync(
      STORAGE_KEYS.BIOMETRIC_PRIVATE_KEY,
    );
    if (privateKey) {
      setBiometrics(privateKey);
    }
  };

  useEffect(() => {
    initializeAuth();
    loadEnvironment();
    loadBiometricSettings();
    loadCorporationOnboarding();

    const tokenRefreshInterval = setInterval(
      async () => {
        const accessToken = await AsyncStorage.getItem(
          STORAGE_KEYS.ACCESS_TOKEN,
        );
        if (accessToken) {
          autoRefreshToken();
        }
      },
      20 * 60 * 1000,
    );

    return () => clearInterval(tokenRefreshInterval);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        signIn,
        signOut,
        loading,
        environment,
        biometric,
        updateEnvironment,
        updateBiometrics,
        corporationOnboarded,
        updateCorporationOnboarded: async (onboarding) => {
          setCorporationOnboarded(onboarding);
          await AsyncStorage.setItem(
            STORAGE_KEYS.CORPORATION_ONBOARDED,
            JSON.stringify(onboarding),
          );
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
