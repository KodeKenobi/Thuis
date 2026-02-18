import { Container } from "@/components/ui/container";
import { Select } from "@/components/ui/select";
import { useGetTenants } from "@/service/tenants";
import React, { useEffect, useState } from "react";
import { ContentContainer } from "../flow/content-container";
import { useAuthenticationFlow } from "@/hooks/use-authentication-flow";
import { Button } from "@/components/ui/button";
import ScreenLoader from "@/components/ui/screen-loader";
import { EmptyData } from "@/components/ui/empty-data";
import { formatErrorMessage, isValidHttpUrl } from "@/utils";
import AnimatedReveal, {
  AnimatedStepTransition,
} from "@/components/ui/animated-reveal";
import { Image } from "expo-image";
import { API_URL } from "@/constants";
import { CorporationInfo } from "@/components/layouts/auth-layout";
import { useTheme } from "@/contexts/theme-context";

interface AuthenticationFlowContainerProps {
  flowValue: TAuthenticationFlow;
  onFlowComplete?: (response: IFlowInitializationResponse) => void;
  setCorporationInfo?: (corporationInfo: CorporationInfo | null) => void;
}

const AuthenticationFlowContainer = ({
  flowValue,
  onFlowComplete,
  setCorporationInfo,
}: AuthenticationFlowContainerProps) => {
  const [selectedTenant, setSelectedTenant] = useState<{
    id: string;
    name?: string;
  } | null>(null);
  const { tenants, tenantsRefetch, tenantsLoading, isTenantsRefetching } =
    useGetTenants({
      querykeySuffix: "signin",
    });

  const { theme } = useTheme();

  const [transitionDirection, setTransitionDirection] = useState<
    "left" | "right"
  >("right");
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const [initialSnapshotKey, setInitialSnapshotKey] = useState<
    string | undefined
  >(undefined);

  const {
    selectedTenant: tenant,
    updateSelectedTenant,
    currentInstance,
    formData,
    formErrors,
    handleElementChange,
    isLoading,
    initiateFlowError,
    refetch,
    flow,
    handleBack,
    continueDisabled,
    isContinueLoading,
    isBackLoading,
    hasOneSelectField,
    renderFields,
    selectField,
    handleContinueWithValidation,
    showLabel,
  } = useAuthenticationFlow(flowValue, onFlowComplete, {
    onAction(action) {
      if (action === "back" || action === "restore") {
        setTransitionDirection("left");
      } else {
        setTransitionDirection("right");
      }
      setShouldAnimate(true);
    },
  });

  useEffect(() => {
    if (currentInstance && !isLoading) {
      setInitialSnapshotKey((prev) =>
        prev === undefined ? currentInstance.snapshotKey : prev
      );
    } else {
      setShouldAnimate(false);
      setInitialSnapshotKey(undefined);
    }
  }, [isLoading, currentInstance]);

  if (!tenant?.id) {
    return (
      <AnimatedReveal delay={100}>
        <Container gap={24}>
          <Select
            items={(tenants || [])?.map((tenant) => ({
              ...tenant,
              name: tenant?.displayName,
              id: tenant?.name,
            }))}
            emptyDataProps={{
              actionText: "Opnieuw proberen",
              actionPress() {
                tenantsRefetch();
              },
            }}
            loading={tenantsLoading || isTenantsRefetching}
            isMulti={false}
            value={selectedTenant}
            onValueChange={(tenant) => {
              setSelectedTenant(tenant);
              if (tenant && setCorporationInfo) {
                if (!tenant?.id || !tenants) {
                  setCorporationInfo(null);
                  return;
                }
                const selectedTenant = tenants.find(
                  (t) => t.name === tenant.id
                );
                if (!selectedTenant) {
                  setCorporationInfo(null);
                  return;
                }
                const policy = selectedTenant?.privacyPolicy;
                const validPolicy =
                  policy && isValidHttpUrl(policy) ? policy : undefined;
                setCorporationInfo({
                  value: selectedTenant?.name || "",
                  name: selectedTenant?.displayName || tenant.name || "",
                  privacyPolicy: validPolicy,
                });
              }
            }}
            placeholder="Selecteer jouw verhuurder"
            label="Selecteer jouw verhuurder"
          />
          <Button
            title="Volgende"
            disabled={!selectedTenant?.id}
            onPress={() => {
              if (selectedTenant) {
                updateSelectedTenant(selectedTenant);
              }
            }}
          />
        </Container>
      </AnimatedReveal>
    );
  }

  if (isLoading) {
    return (
      <AnimatedReveal delay={100}>
        <Container justify="center">
          <ScreenLoader />
        </Container>
      </AnimatedReveal>
    );
  }

  if (initiateFlowError) {
    return (
      <Container justify="center">
        {initiateFlowError && !isLoading && flow?.flowCode ? (
          <EmptyData
            description={
              initiateFlowError
                ? formatErrorMessage(initiateFlowError)
                : undefined
            }
            variant={initiateFlowError ? "red" : undefined}
            // actionPress={refetch}
            renderAction={
              <Container>
                <Button
                  title="Opnieuw proberen"
                  variant="link"
                  onPress={refetch}
                />
                <Button
                  title="Verander verhuurder"
                  variant="secondary"
                  onPress={() => {
                    setSelectedTenant(null);
                    updateSelectedTenant(null);
                    setCorporationInfo?.(null);
                  }}
                />
              </Container>
            }
          />
        ) : null}
      </Container>
    );
  }

  const renderFooter = () => {
    if (currentInstance?.status?.running) {
      return (
        <Container direction="horizontal" gap={12}>
          {currentInstance?.status?.backEnabled ? (
            <Button
              title="Vorige"
              variant="outlined"
              loading={isBackLoading}
              disabled={isBackLoading || isContinueLoading}
              onPress={handleBack}
            />
          ) : null}
          <Container flex={1}>
            <Button
              title={
                !renderFields && hasOneSelectField
                  ? selectField?.data?.list?.[0]?.text || "Volgende"
                  : "Volgende"
              }
              disabled={continueDisabled}
              loading={isContinueLoading}
              onPress={handleContinueWithValidation}
            />
          </Container>
        </Container>
      );
    }
    return null;
  };

  const renderContent = (
    <Container gap={24}>
      <ContentContainer
        elements={currentInstance?.elements || []}
        formData={formData}
        formErrors={formErrors}
        onElementChange={handleElementChange}
        isAuthFlow
        showLabel={showLabel}
        renderFields={renderFields}
      />
      {renderFooter()}
      <Button
        title="Verander verhuurder"
        variant="link"
        onPress={() => {
          setSelectedTenant(null);
          updateSelectedTenant(null);
          setCorporationInfo?.(null);
        }}
      />
    </Container>
  );

  const foundTenant = tenants?.find(
    (tenant) => tenant?.name === selectedTenant?.id
  );

  let logo = foundTenant?.logo;

  if (theme === "dark") {
    logo = foundTenant?.logoAlt || logo;
  }

  logo = `${API_URL?.replace("/api/v1", "")}${logo}`;

  return (
    <>
      <AnimatedReveal delay={100}>
        <Container
          justify="flex-start"
          direction="horizontal"
          style={{
            height: 32,
          }}
        >
          <Image
            source={{
              uri: logo,
            }}
            style={{
              height: "100%",
              alignSelf: "flex-start",
              overflow: "visible",
              resizeMode: "contain",
              objectFit: "contain",
              flexShrink: 1,
              flexGrow: 1,
            }}
            contentFit="contain"
            cachePolicy={"memory-disk"}
            contentPosition={"left center"}
          />
        </Container>
      </AnimatedReveal>
      {currentInstance?.elements ? (
        <>
          {initialSnapshotKey === currentInstance?.snapshotKey ? (
            <AnimatedReveal delay={100}>{renderContent}</AnimatedReveal>
          ) : shouldAnimate ? (
            <AnimatedStepTransition
              direction={transitionDirection}
              key={currentInstance?.snapshotKey}
            >
              {renderContent}
            </AnimatedStepTransition>
          ) : null}
        </>
      ) : null}
    </>
  );
};

export default AuthenticationFlowContainer;
