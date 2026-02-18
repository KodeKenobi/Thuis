import InnerScreenTemplate from "@/components/templates/inner-screen-template";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyData } from "@/components/ui/empty-data";
import ScreenLoader from "@/components/ui/screen-loader";
import { SIZES } from "@/constants";
import { useFlow } from "@/hooks/use-flow";
import { ContentContainer } from "@/components/containers/flow/content-container";
import { Platform } from "react-native";
import { IconButton } from "@/components/ui/icon-button";
import Ionicons from "@expo/vector-icons/Ionicons";
import AnimatedReveal, {
  AnimatedStepTransition,
} from "@/components/ui/animated-reveal";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import { TitleContainer } from "@/components/containers/flow/title-container";
import { formatErrorMessage } from "@/utils";
import { router, useFocusEffect } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as StatusBar from "expo-status-bar";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { WithErrorBoundary } from "@/components/ui/with-error-boundary";
import { ComponentProfiler } from "@/utils/component-profiler";

const FlowScreen = () => {
  const handleFlowComplete = () => router.back();

  const [transitionDirection, setTransitionDirection] = useState<
    "left" | "right"
  >("right");
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const flow = useFlow(handleFlowComplete, {
    onAction: (action) => {
      setTransitionDirection(
        action === "back" || action === "restore" ? "left" : "right",
      );
      setShouldAnimate(true);
    },
  });

  const {
    currentDefinition,
    currentInstance,
    handleBack,
    refetch,
    isLoading,
    isContinueLoading,
    isBackLoading,
    definitionError,
    initiateFlowError,
    existingLabel,
    flowName,
    currentStep,
    formData,
    showLabel,
    formErrors,
    handleElementChange,
    renderFields,
    selectField,
    hasOneSelectField,
    continueDisabled,
    handleContinueWithValidation,
    isRedirecting,
  } = flow;

  const {
    colors: { theme },
  } = useCorporateBranding();

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "ios") {
        StatusBar.setStatusBarStyle("light");
        return () => {
          StatusBar.setStatusBarStyle(theme === "dark" ? "light" : "dark");
        };
      }
    }, [theme]),
  );

  const hasOnlyALink =
    currentInstance?.elements?.length === 1 &&
    currentInstance?.elements?.find((element) => element?.type === "link");

  const renderFooter = () => {
    if (!currentDefinition || !currentInstance) return null;
    if (!currentInstance.status?.running) return null;

    return (
      <Container direction="horizontal" gap={12}>
        {currentInstance.status?.backEnabled ? (
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
  };

  const [showLoader, setShowLoader] = useState(true);
  const [closeFlow, setCloseFlow] = useState(false);
  const [initialSnapshotKey, setInitialSnapshotKey] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    if (isLoading || !currentDefinition || !currentInstance || isRedirecting) {
      setShowLoader(true);
      setShouldAnimate(false);
      setInitialSnapshotKey(undefined);
    } else {
      setShowLoader(false);
      setInitialSnapshotKey((prev) =>
        prev === undefined ? currentInstance.snapshotKey : prev,
      );
    }
  }, [isLoading, currentDefinition, currentInstance, isRedirecting]);

  if (showLoader) {
    return (
      <>
        <InnerScreenTemplate
          hasModalToast
          header={{
            title: flowName || existingLabel || "Regelen",
            showBackButton: false,
            addStatusBarPadding: Platform.OS === "android",
            action: (
              <IconButton
                variant="secondary"
                size="sm"
                onPress={() => {
                  if (currentStep > 1) setCloseFlow(true);
                  else router.back();
                }}
              >
                <Ionicons name="close" />
              </IconButton>
            ),
          }}
          contentStyle={{ padding: SIZES.padding }}
        >
          <ScreenLoader />
          <ConfirmationModal
            visible={closeFlow}
            onClose={() => setCloseFlow(false)}
            allowOutsideClose
            content="Je aanvraag wordt niet bewaard. Wil je doorgaan met afsluiten?"
            confirm={{ onPress: () => router.back(), title: "Doorgaan" }}
            cancel={{ onPress: () => setCloseFlow(false), title: "Terug" }}
          />
        </InnerScreenTemplate>
      </>
    );
  }

  const [introElement] = currentInstance?.elements || [];

  return (
    <BottomSheetModalProvider>
      <InnerScreenTemplate
        header={{
          title: flowName || existingLabel || "Regelen",
          showBackButton: false,
          addStatusBarPadding: Platform.OS === "android",
          action: (
            <IconButton
              variant="secondary"
              size="sm"
              onPress={() => {
                if (currentStep > 1) setCloseFlow(true);
                else router.back();
              }}
            >
              <Ionicons name="close" />
            </IconButton>
          ),
        }}
        footer={renderFooter()}
        contentStyle={{ padding: SIZES.padding }}
        stickyHeaderIndices={[0]}
        hasModalToast
      >
        {introElement?.type === "title" &&
        introElement?.data?.text?.trim()?.length ? (
          <TitleContainer
            element={introElement}
            currentStep={currentStep}
            key={introElement.type + "-intro"}
          />
        ) : null}

        <ConfirmationModal
          visible={closeFlow}
          onClose={() => setCloseFlow(false)}
          allowOutsideClose
          content="Je aanvraag wordt niet bewaard. Wil je doorgaan met afsluiten?"
          confirm={{ onPress: () => router.back(), title: "Doorgaan" }}
          cancel={{ onPress: () => setCloseFlow(false), title: "Terug" }}
        />

        {(definitionError || !currentDefinition) && !isLoading ? (
          <Container flex={1} justify="center">
            <EmptyData
              description={
                definitionError
                  ? formatErrorMessage(definitionError)
                  : undefined
              }
              variant={definitionError ? "red" : undefined}
              actionPress={refetch}
            />
          </Container>
        ) : null}

        {initiateFlowError && !isLoading && currentDefinition?.code ? (
          <EmptyData
            description={
              initiateFlowError
                ? formatErrorMessage(initiateFlowError)
                : undefined
            }
            variant={initiateFlowError ? "red" : undefined}
            actionPress={refetch}
          />
        ) : null}

        {initialSnapshotKey === flow.currentInstance?.snapshotKey ? (
          <AnimatedReveal delay={100}>
            <WithErrorBoundary
              resetKeys={[flow.currentInstance?.snapshotKey]}
              title="Kan proces niet laden"
              description="Er is een fout opgetreden bij het laden van het proces. Probeer het opnieuw."
            >
              <ComponentProfiler componentName="FlowDetailContainer">
                <ContentContainer
                  elements={flow.currentInstance?.elements || []}
                  formData={formData}
                  formErrors={formErrors}
                  onElementChange={handleElementChange}
                  showLabel={showLabel}
                  renderFields={renderFields}
                />
              </ComponentProfiler>
            </WithErrorBoundary>
          </AnimatedReveal>
        ) : shouldAnimate ? (
          <AnimatedStepTransition
            direction={transitionDirection}
            key={flow.currentInstance?.snapshotKey}
          >
            <WithErrorBoundary
              resetKeys={[flow.currentInstance?.snapshotKey]}
              title="Kan proces niet laden"
              description="Er is een fout opgetreden bij het laden van het proces. Probeer het opnieuw."
            >
              <ComponentProfiler componentName="FlowDetailContainer">
                <ContentContainer
                  elements={flow.currentInstance?.elements || []}
                  formData={formData}
                  formErrors={formErrors}
                  onElementChange={handleElementChange}
                  showLabel={showLabel}
                  renderFields={renderFields}
                />
              </ComponentProfiler>
            </WithErrorBoundary>
          </AnimatedStepTransition>
        ) : (
          <WithErrorBoundary
            resetKeys={[flow.currentInstance?.snapshotKey]}
            title="Kan proces niet laden"
            description="Er is een fout opgetreden bij het laden van het proces. Probeer het opnieuw."
          >
            <ComponentProfiler componentName="FlowDetailContainer">
              <ContentContainer
                elements={flow.currentInstance?.elements || []}
                formData={formData}
                formErrors={formErrors}
                onElementChange={handleElementChange}
                showLabel={showLabel}
                renderFields={renderFields}
              />
            </ComponentProfiler>
          </WithErrorBoundary>
        )}
      </InnerScreenTemplate>
    </BottomSheetModalProvider>
  );
};

export default FlowScreen;
