import InnerScreenTemplate from "@/components/templates/inner-screen-template";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { DEPLOYMENT_ENVIRONMENT, SIZES } from "@/constants";
import SectionTemplate from "@/components/templates/section-template";
import { DetailContentGroup } from "@/components/ui/detail-content";
import {
  Dropdown,
  DropdownContent,
  DropdownRadioGroup,
  DropdownRadioItem,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ThemedText, useTextStyles } from "@/components/ui/themed-text";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";

const themeOptions = [
  { label: "Systeem", value: "system" as const },
  { label: "Donker", value: "dark" as const },
  { label: "Licht", value: "light" as const },
];

const SettingsScreen = () => {
  const { signOut, user } = useAuth();
  const textStyles = useTextStyles();
  const {
    colors: { errorColor },
    corporateInfo,
  } = useCorporateBranding();
  const { themePreference, setThemePreference } = useTheme();

  // Get corporation privacy policy URL
  const corporationPrivacyPolicy = useMemo(() => {
    return corporateInfo?.privacyPolicy;
  }, [corporateInfo]);

  const handleOpenPrivacyPolicy = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
      });
    } catch (error) {
      console.error("Error opening privacy policy:", error);
    }
  };

  const corporationDisplayName = useMemo(() => {
    return corporateInfo?.displayName;
  }, [corporateInfo]);

  return (
    <InnerScreenTemplate
      header={{ title: "Instellingen", backDestination: () => router.back() }}
      contentStyle={{
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.padding / 2,
      }}
    >
      <SectionTemplate title="Algemeen">
        <DetailContentGroup
          showSeparator
          items={[
            {
              label: "Thema",
              content: (
                <Container
                  direction="horizontal"
                  flex={1}
                  justify="flex-end"
                  // how to height fit this?
                >
                  <Dropdown>
                    <DropdownTrigger>
                      <Button
                        title={
                          themeOptions?.find(
                            (option) => option?.value === themePreference,
                          )?.label || ""
                        }
                        variant="link"
                      />
                    </DropdownTrigger>

                    <DropdownContent style={{ minWidth: 200 }}>
                      <DropdownRadioGroup
                        value={themePreference}
                        // @ts-ignore
                        onValueChange={setThemePreference}
                      >
                        {themeOptions?.map((option) => (
                          <DropdownRadioItem
                            key={option?.value}
                            value={option?.value}
                          >
                            {option?.label}
                          </DropdownRadioItem>
                        ))}
                      </DropdownRadioGroup>
                    </DropdownContent>
                  </Dropdown>
                </Container>
              ),
            },
            ...(corporationPrivacyPolicy
              ? [
                  {
                    onPress: () => {
                      handleOpenPrivacyPolicy(corporationPrivacyPolicy);
                    },
                    pressable: true,
                    label: "Privacybeleid " + (corporationDisplayName || ""),
                    content: (
                      <Container
                        flex={1}
                        direction="horizontal"
                        justify="flex-end"
                      >
                        <ThemedText {...textStyles.gray}>{"\u203A"}</ThemedText>
                      </Container>
                    ),
                  },
                ]
              : []),
            {
              onPress: () => {
                handleOpenPrivacyPolicy("https://databalk.nu/privacy-policy");
              },
              pressable: true,
              label: "Privacybeleid DataBalk",
              content: (
                <Container flex={1} direction="horizontal" justify="flex-end">
                  <ThemedText {...textStyles.gray}>{"\u203A"}</ThemedText>
                </Container>
              ),
            },
            {
              onPress: () => {
                signOut();
              },
              pressable: true,
              label: <ThemedText {...textStyles.danger}>Uitloggen</ThemedText>,
              content: (
                <Container flex={1} direction="horizontal" justify="flex-end">
                  <Ionicons
                    name="log-out-outline"
                    color={errorColor}
                    size={20}
                  />
                </Container>
              ),
            },
          ]}
        />
      </SectionTemplate>

      <Container
        style={{
          marginTop: "auto",
          paddingTop: SIZES.padding * 2,
          paddingBottom: SIZES.padding * 2,
          alignItems: "center",
        }}
      >
        <ThemedText {...textStyles.gray} size="sm">
          {DEPLOYMENT_ENVIRONMENT === "production" ? "Versie" : "Testversie"} v
          {Constants.expoConfig?.version || "N/A"}
        </ThemedText>
      </Container>
    </InnerScreenTemplate>
  );
};

export default SettingsScreen;
