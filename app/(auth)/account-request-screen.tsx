import React, { useState } from "react";
import { router } from "expo-router";
import AuthLayout, { CorporationInfo } from "@/components/layouts/auth-layout";
import AuthenticationFlowContainer from "@/components/containers/authentication-flow/authentication-flow-container";
import { useGetFlowProcess } from "@/service/authentication-flows";
import { AUTHENTICATION_FLOWS } from "@/data/flows";
import { logEvent } from "@/config/analytics";
import { DEPLOYMENT_ENVIRONMENT } from "@/constants";

export default function AccountRequestScreen() {
  const [corporationInfo, setCorporationInfo] =
    useState<CorporationInfo | null>(null);

  const { flowProcess } = useGetFlowProcess(corporationInfo?.value || "");

  const processCode = AUTHENTICATION_FLOWS.find(
    (flow) => flow.value === "request-login"
  )?.flowCode;

  const process = flowProcess?.find(
    (process) => process.flowCode === processCode
  );

  // Track account creation initiation
  React.useEffect(() => {
    if (corporationInfo?.value) {
      logEvent("account_creation_initiated", {
        corporation: corporationInfo.value,
        environment: DEPLOYMENT_ENVIRONMENT || "production",
      });
    }
  }, [corporationInfo?.value]);

  return (
    <AuthLayout
      title={
        process?.settings?.translations?.["nl"]?.Flow_Titel_Website ||
        process?.websiteLabel ||
        `Account\naanmaken`
      }
      subtitle={
        (process?.description?.replace("Dialoog voor", "").trim() || "")
          .charAt(0)
          .toUpperCase() +
          (
            process?.description?.replace("Dialoog voor", "").trim() || ""
          ).slice(1) || ""
      }
      backDestination={() => router.back()}
      corporation={corporationInfo || undefined}
      privacyPolicyMessage="Door een account aan te maken, ga je akkoord met"
    >
      <AuthenticationFlowContainer
        flowValue="request-login"
        onFlowComplete={(response) => {
          // Track successful account creation completion
          logEvent("account_creation_completed", {
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
