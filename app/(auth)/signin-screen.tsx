import React, { useEffect, useRef, useState, useMemo } from "react";
import { Platform, TextInput, StyleSheet, Keyboard } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as LocalAuthentication from "expo-local-authentication";
import * as Device from "expo-device";
import * as Application from "expo-application";
import { RSA } from "react-native-rsa-native";
import { add, getUnixTime } from "date-fns";
import { useAuth } from "@/contexts/auth-context";
import { useGetTenants } from "@/service/tenants";
import { useSigninService, useSigninByBiometricService } from "@/service/auth";
import { notifyToast } from "@/config/toast";
import { formatErrorMessage } from "@/utils";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { IconButton } from "@/components/ui/icon-button";
import { Container } from "@/components/ui/container";
import { isValidHttpUrl } from "@/utils";
import AuthLayout from "@/components/layouts/auth-layout";
import { AUTHENTICATION_FLOWS } from "@/data/flows";
import { useGetFlowProcess } from "@/service/authentication-flows";
import { trackLogin, seedCorpTracking } from "@/config/analytics";
import { DEPLOYMENT_ENVIRONMENT } from "@/constants";

const Signin = () => {
  type TenantOption = { id: string; name?: string } | null;

  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [formData, setFormData] = useState<{
    email: string;
    password: string;
    tenant: TenantOption;
  }>({
    email: "",
    password: "",
    tenant: null,
  });

  const tenantId = formData.tenant?.id ?? "";

  const { flowProcess } = useGetFlowProcess(tenantId);
  const requestLoginProcessCode = AUTHENTICATION_FLOWS.find(
    (flow) => flow.value === "request-login"
  )?.flowCode;

  const requestLoginProcess = flowProcess?.find(
    (process) => process.flowCode === requestLoginProcessCode
  );

  const resetPasswordProcessCode = AUTHENTICATION_FLOWS.find(
    (flow) => flow.value === "reset-password"
  )?.flowCode;

  const resetPasswordProcess = flowProcess?.find(
    (process) => process.flowCode === resetPasswordProcessCode
  );

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const { tenants, tenantsLoading, tenantsRefetch, isTenantsRefetching } =
    useGetTenants({
      querykeySuffix: "signin",
    });

  const { signIn, signInloading } = useSigninService();
  const { signIn: authSignin, biometric } = useAuth();
  const { signInBiometric, signInBiometricloading } =
    useSigninByBiometricService();

  const { email, password, tenant } = formData;

  const corporationInfo = useMemo(() => {
    if (!tenant?.id || !tenants) return undefined;
    const selectedTenant = tenants.find((t) => t.name === tenant.id);
    if (!selectedTenant) return undefined;

    const policy = selectedTenant?.privacyPolicy;
    const validPolicy = policy && isValidHttpUrl(policy) ? policy : undefined;

    return {
      name: selectedTenant.displayName,
      value: selectedTenant.name,
      privacyPolicy: validPolicy,
    };
  }, [tenant, tenants]);

  useEffect(() => {
    (async () => {
      const supported =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      const isSupported =
        supported.includes(
          LocalAuthentication.AuthenticationType.FINGERPRINT
        ) ||
        supported.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        );
      setIsBiometricSupported(isSupported);
    })();
  }, []);

  const isSubmitting = signInloading || signInBiometricloading;

  const handleLogin = async () => {
    Keyboard.dismiss();

    if (!email && !password) {
      notifyToast({
        props: {
          type: "warning",
          message: "Vul je e-mailadres en wachtwoord in.",
        },
      });
      return;
    }
    if (!email) {
      notifyToast({
        props: { type: "warning", message: "Vul je e-mailadres in." },
      });
      return;
    }

    if (!password) {
      notifyToast({
        props: { type: "warning", message: "Vul je wachtwoord in." },
      });
      return;
    }

    if (!tenant?.id) {
      notifyToast({
        props: { type: "warning", message: "Selecteer een woningcorporatie." },
      });
      return;
    }

    try {
      const res = await signIn({
        loginName: email.trim(),
        password,
        corporationName: tenant.id,
      });

      if (res?.passCodeRequired) {
        router.push({
          pathname: "/(auth)/otp-verification-screen",
          params: {
            loginId: res.loginId,
            corporationName: res.corporationName,
            passCode: res.passCode,
          },
        });
        return;
      }

      const { access_token, refresh_token, user: userData } = res;

      const matchedTenant =
        tenants?.find((t) => t.name === tenant.id) ||
        tenants?.find((t) => t.displayName === userData?.corporationName) ||
        tenants?.find((t) => t.name === userData?.corporationName);

      const user = {
        id: userData.loginId,
        name: userData.fullName,
        email: userData.loginName,
        custId: userData.custId,
        corporationName: userData.corporationName,
        corporationKey: tenant.id,
        passCode: "",
        access_token,
        refresh_token,
        corporation: {
          displayName: matchedTenant?.displayName,
          logo: matchedTenant?.logo,
          logoAlt: matchedTenant?.logoAlt,
          assets: matchedTenant?.assets, // Include assets from tenant
          privacyPolicy: matchedTenant?.privacyPolicy,
        },
      };

      // Set corporation tracking BEFORE login event
      // Ensure tenant.id is valid before calling seedCorpTracking
      if (tenant?.id) {
        seedCorpTracking(
          tenant.id,
          DEPLOYMENT_ENVIRONMENT || "production",
          userData.loginId || userData.loginName || ""
        );
      }

      await authSignin(user);

      // Track login after corporation is set
      trackLogin("email", {
        corporation: tenant.id,
        environment: DEPLOYMENT_ENVIRONMENT || "production",
      });

      router.replace("/(tabs)");
    } catch (err: any) {
      notifyToast({
        props: {
          title: "Inloggen mislukt",
          message: formatErrorMessage(err, { context: "auth" }),
          type: "error",
        },
      });
    }
  };

  const loginWithBiometrics = async () => {
    if (!biometric || !Device.isDevice) {
      notifyToast({
        props: { type: "warning", message: "Binnenkort beschikbaar!!" },
      });
      return;
    }

    try {
      Keyboard.dismiss();

      let deviceId: string | null | undefined;
      if (Platform.OS === "android") deviceId = Application.getAndroidId();
      else deviceId = await Application.getIosIdForVendorAsync();

      if (!deviceId) return;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Inloggen met biometrie",
        cancelLabel: "Annuleren",
        disableDeviceFallback: false,
      });

      if (!result?.success) {
        notifyToast({
          props: {
            title: "Inloggen mislukt",
            message: result?.warning || "Biometrisch inloggen mislukt.",
            type: "error",
          },
        });
        return;
      }

      const payload = { exp: getUnixTime(add(new Date(), { minutes: 5 })) };
      const signature = await RSA.signWithAlgorithm(
        JSON.stringify(payload),
        biometric,
        "SHA256withRSA"
      );
      const backendPayload = { signature, payload, deviceId };

      await signInBiometric(backendPayload);

      await trackLogin("biometric", {
        device: Device.modelName,
        environment: DEPLOYMENT_ENVIRONMENT || "production",
      });
    } catch (err: any) {
      notifyToast({
        props: {
          title: "Inloggen mislukt",
          message: err?.message || "Biometrisch inloggen mislukt.",
          type: "error",
        },
      });
    }
  };

  return (
    <AuthLayout
      showBackButton={false}
      extraActions={
        <>
          <Button
            title={
              resetPasswordProcess?.settings?.translations?.["nl"]
                ?.Flow_Titel_Website ||
              resetPasswordProcess?.websiteLabel ||
              "Wachtwoord herstellen"
            }
            onPress={() => router.push("/forgot-password-screen")}
            variant="text"
            fontWeight="regular"
            textColor="gray"
          />
          <Button
            title={
              requestLoginProcess?.settings?.translations?.["nl"]
                ?.Flow_Titel_Website ||
              requestLoginProcess?.websiteLabel ||
              "Account aanmaken"
            }
            onPress={() => router.push("/account-request-screen")}
            variant="text"
            textColor="foreground"
          />
        </>
      }
      title="Welkom"
      subtitle={"Je kunt nu inloggen\nBeheer je woning en blijf op de hoogte."}
      corporation={corporationInfo}
    >
      <Select
        items={(tenants || []).map((t) => ({
          ...t,
          name: t.displayName,
          id: t.name,
        }))}
        emptyDataProps={{
          actionText: "Opnieuw proberen",
          actionPress() {
            tenantsRefetch();
          },
        }}
        loading={tenantsLoading || isTenantsRefetching}
        isMulti={false}
        value={tenant}
        onValueChange={(nextTenant) =>
          setFormData((prev) => ({ ...prev, tenant: nextTenant }))
        }
        placeholder="Selecteer jouw verhuurder"
        placeholderStyle={styles.placeholderText}
      />

      <Input
        ref={emailInputRef}
        nativeID="login-email"
        placeholder="Vul je e-mailadres in"
        style={styles.placeholderText}
        value={email}
        onChangeText={(nextEmail) =>
          setFormData((prev) => ({ ...prev, email: nextEmail }))
        }
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
        autoComplete="username"
        importantForAutofill="yes"
        returnKeyType="next"
        onSubmitEditing={() => passwordInputRef.current?.focus()}
        editable={!isSubmitting}
      />

      <Input
        ref={passwordInputRef}
        nativeID="login-password"
        placeholder="Vul je wachtwoord in"
        style={styles.placeholderText}
        value={password}
        onChangeText={(nextPassword) =>
          setFormData((prev) => ({ ...prev, password: nextPassword }))
        }
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        autoComplete="password"
        importantForAutofill="yes"
        returnKeyType="done"
        onSubmitEditing={handleLogin}
        editable={!isSubmitting}
      />

      <Button
        title="Inloggen"
        onPress={handleLogin}
        disabled={isSubmitting}
        loading={isSubmitting}
        variant="primary"
      />

      {biometric && isBiometricSupported && (
        <Container direction="horizontal" justify="center">
          <IconButton
            variant="outlined"
            size="lg"
            onPress={loginWithBiometrics}
            disabled={isSubmitting}
          >
            <Ionicons name="finger-print" size={24} />
          </IconButton>
        </Container>
      )}
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  placeholderText: {
    fontWeight: "500",
    fontSize: 16,
  },
});

export default Signin;
