import React, { useState } from "react";
import { router } from "expo-router";
import AuthLayout, { CorporationInfo } from "@/components/layouts/auth-layout";
import AuthenticationFlowContainer from "@/components/containers/authentication-flow/authentication-flow-container";
import { useGetFlowProcess } from "@/service/authentication-flows";
import { AUTHENTICATION_FLOWS } from "@/data/flows";
import { logEvent } from "@/config/analytics";
import { DEPLOYMENT_ENVIRONMENT } from "@/constants";

export default function ForgotPasswordScreen() {
  const [corporationInfo, setCorporationInfo] =
    useState<CorporationInfo | null>(null);

  const { flowProcess } = useGetFlowProcess(corporationInfo?.value || "");

  const processCode = AUTHENTICATION_FLOWS.find(
    (flow) => flow.value === "reset-password"
  )?.flowCode;

  const process = flowProcess?.find(
    (process) => process.flowCode === processCode
  );

  // Track password reset initiation
  React.useEffect(() => {
    if (corporationInfo?.value) {
      logEvent("password_reset_initiated", {
        corporation: corporationInfo.value,
        environment: DEPLOYMENT_ENVIRONMENT || "production",
      });
    }
  }, [corporationInfo?.value]);

  return (
    <AuthLayout
      backDestination={() => router.back()}
      title={
        process?.settings?.translations?.["nl"]?.Flow_Titel_Website ||
        process?.websiteLabel ||
        `Wachtwoord\nherstellen`
      }
      subtitle={
        (process?.description?.replace("Dialoog voor", "").trim() || "")
          .charAt(0)
          .toUpperCase() +
          (
            process?.description?.replace("Dialoog voor", "").trim() || ""
          ).slice(1) || ""
      }
      corporation={corporationInfo || undefined}
      showPolicy={false}
      privacyPolicyMessage="Door je wachtwoord te resetten ga je akkoord met"
    >
      <AuthenticationFlowContainer
        flowValue="reset-password"
        onFlowComplete={(response) => {
          // Track successful password reset completion
          logEvent("password_reset_completed", {
            corporation: corporationInfo?.value || "unknown",
            environment: DEPLOYMENT_ENVIRONMENT || "production",
            success: response?.status?.running === false,
          });
          router.back();
        }}
        setCorporationInfo={setCorporationInfo}
      />
    </AuthLayout>
  );
}
