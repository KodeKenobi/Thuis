import React, { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import AuthLayout from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { OTPInput } from "@/components/ui/otp-input";
import { useVerifyOTPService } from "@/service/auth";
import { ThemedText, useTextStyles } from "@/components/ui/themed-text";
import { useAuth } from "@/contexts/auth-context";
import { useGetTenants } from "@/service/tenants";

export default function OTPverificationScreen() {
  const textStyles = useTextStyles();
  const router = useRouter();
  const { signIn } = useAuth();
  const {
    loginId,
    corporationName,
    passCode: authPassCode,
  } = useLocalSearchParams();
  const [formData, setFormData] = useState<{
    passCode: string;
  }>({
    passCode: "",
  });

  const { tenants } = useGetTenants({});

  const { passCode } = formData;

  const { verifyOTP, verifyOTPloading } = useVerifyOTPService();

  return (
    <AuthLayout
      backDestination={() => router.back()}
      title={`Voltooi\nverificatie.`}
      showPolicy={false}
      subtitle="Voer de eenmalige toegangscode in die we je hebben gestuurd."
    >
      {__DEV__ && authPassCode ? (
        <ThemedText {...textStyles.danger}>Dev OTP: {authPassCode}</ThemedText>
      ) : null}
      <OTPInput
        onFinish={(passCode) => {
          setFormData({
            passCode,
          });
          verifyOTP({
            loginId: loginId as string,
            corporationName: corporationName as string,
            passCode,
          }).then(async (res) => {
            const { access_token, refresh_token, user: userData } = res;
            const matchedTenant = tenants?.find(
              (tenant) => tenant?.name === userData?.corporationName,
            );
            const user = {
              id: userData.loginId,
              name: userData.fullName,
              email: userData.loginName,
              custId: userData.custId,
              corporationName: userData.corporationName,
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
            await signIn(user);
            router.push("/(tabs)");
          });
        }}
      />
      <Button
        title="Volgende"
        loading={verifyOTPloading}
        disabled={passCode?.length < 6 || verifyOTPloading}
      />
    </AuthLayout>
  );
}
