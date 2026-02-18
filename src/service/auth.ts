import {
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import fetchWrapper from "@/config/api";
import { notifyToast } from "@/config/toast";
import { formatErrorMessage } from "@/utils";
import axios from "axios";

export const useSigninService = (
  options?: UseMutationOptions<TSignInResultSuccess, TApiError, TSignInPayload>
) => {
  const { mutateAsync, isPending, reset, ...rest } = useMutation({
    mutationFn: async (variables) => {
      const relativeUrl = "/Huurder/authentication/login";
      const { data } = await fetchWrapper(relativeUrl, {
        method: "POST",
        body: variables,
        skipAuth: true,
      });
      return data;
    },
    mutationKey: ["signin"],
    onError: (err: TApiError) => {
      const status = err?.response?.status ?? err?.status;
      notifyToast({
        props: {
          message: formatErrorMessage(err, { context: "auth" }),
          title: status === 401 ? "Inloggen mislukt" : "Er is iets misgegaan",
          type: "error",
        },
      });
    },
    ...options,
  });

  return {
    signIn: mutateAsync,
    signInloading: isPending,
    signInReset: reset,
    ...rest,
  };
};

export const useEnableBiometricService = (
  options?: UseMutationOptions<{}, TApiError, TEnableBiometricPayload>
) => {
  const { mutateAsync, isPending, reset, ...rest } = useMutation({
    mutationFn: async (variables) => {
      const { data } = await axios.post("/api/biometric/enable", {
        ...variables,
      });
      return data;
    },
    mutationKey: ["enable-biometric"],
    onError: (err: TApiError) => {
      notifyToast({
        props: {
          message: formatErrorMessage(err),
          title: "Er is iets misgegaan",
          type: "error",
        },
      });
    },
    ...options,
  });

  return {
    enableBiometric: mutateAsync,
    enableBiometricloading: isPending,
    enableBiometricReset: reset,
    ...rest,
  };
};

export const useSigninByBiometricService = (
  options?: UseMutationOptions<
    TSignInResultSuccess,
    TApiError,
    TSignInBiometricPayload
  >
) => {
  const { mutateAsync, isPending, reset, ...rest } = useMutation({
    mutationFn: async (variables) => {
      const { data } = await axios.post("/api/biometric/login", variables);
      return data;
    },
    mutationKey: ["signin-biometric"],
    onError: (err: TApiError) => {
      notifyToast({
        props: {
          message: formatErrorMessage(err, { context: "auth" }),
          title: "Inloggen mislukt",
          type: "error",
        },
      });
    },
    ...options,
  });

  return {
    signInBiometric: mutateAsync,
    signInBiometricloading: isPending,
    signInBiometricReset: reset,
    ...rest,
  };
};

export const useVerifyOTPService = (
  options?: UseMutationOptions<ISuccessSigninData, TApiError, TVerifyOTPPayload>
) => {
  const { mutateAsync, isPending, reset, ...rest } = useMutation({
    mutationFn: async (variables) => {
      const relativeUrl = "/Huurder/authentication/verification";
      const { data } = await fetchWrapper(relativeUrl, {
        method: "POST",
        body: variables,
        skipAuth: true,
      });
      return data;
    },
    mutationKey: ["verify-otp"],
    onError: (err: TApiError) => {
      notifyToast({
        props: {
          message: formatErrorMessage(err, { context: "auth" }),
          title: "Verificatie mislukt",
          type: "error",
        },
      });
    },
    ...options,
  });

  return {
    verifyOTP: mutateAsync,
    verifyOTPloading: isPending,
    verifyOTPReset: reset,
    ...rest,
  };
};

export const useRefreshTokenService = (
  options?: UseMutationOptions<string, TApiError, { token: string }>
) => {
  const { mutateAsync, isPending, reset, ...rest } = useMutation({
    mutationFn: async (variables) => {
      const relativeUrl = "/Huurder/authentication/tokenRefresh";
      const { data } = await fetchWrapper(relativeUrl, {
        method: "POST",
        body: variables,
        skipAuth: true,
      });
      return data as string;
    },
    mutationKey: ["refresh-token"],
    onError: () => {},
    ...options,
  });

  return {
    refreshToken: mutateAsync,
    refreshTokenloading: isPending,
    refreshTokenReset: reset,
    ...rest,
  };
};

export const useFetchUserData = (
  options?: UseQueryOptions<TUserDataResponse, TApiError>
) => {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["userData"],
    queryFn: async () => {
      const relativeUrl = "/Huurder/authentication/userData";
      const response = await fetchWrapper(relativeUrl, {
        method: "POST",
        body: {},
      });
      return response?.data;
    },
    ...options,
  });

  return {
    userData: data,
    userDataLoading: isLoading,
    userDataError: error,
    userDataRefetch: refetch,
    isUserDataRefetching: isRefetching,
  };
};
