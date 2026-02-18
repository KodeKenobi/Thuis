import React, { ReactNode } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Link } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Header } from "@/components/ui/header";
import { FONTS } from "@/constants/fonts";
import { DEPLOYMENT_ENVIRONMENT, SIZES } from "@/constants";
import { useTextStyles, ThemedText } from "../ui/themed-text";
import {
  Dropdown,
  DropdownContent,
  DropdownRadioGroup,
  DropdownRadioItem,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { IconButton } from "@/components/ui/icon-button";
import { Container } from "../ui/container";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@/contexts/auth-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { isValidHttpUrl } from "@/utils";

export type CorporationInfo = {
  name: string;
  value: string;
  privacyPolicy?: string;
};

type AuthLayoutProps = {
  children: ReactNode;
  extraActions?: ReactNode;
  backDestination?: string | (() => void);
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  corporation?: CorporationInfo;
  privacyPolicyMessage?: string;
  showPolicy?: boolean;
};

const AuthLayout = ({
  children,
  extraActions,
  backDestination = "/(auth)/onboarding-screen",
  title,
  subtitle,
  showBackButton = true,
  corporation,
  privacyPolicyMessage = "Door in te loggen ga je akkoord met",
  showPolicy = true,
}: AuthLayoutProps) => {
  const textStyles = useTextStyles();
  const { bottom } = useSafeAreaInsets();
  const { environment, updateEnvironment } = useAuth();

  const handleOpenPrivacyPolicy = async (url: string) => {
    if (!url || !isValidHttpUrl(url)) {
      console.warn("Privacy policy URL is invalid:", url);
      return;
    }
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
      });
    } catch (error) {
      console.error("Error opening privacy policy:", error);
    }
  };
  return (
    <View style={styles.container}>
      <Header
        backDestination={backDestination}
        addStatusBarPadding
        showBackButton={showBackButton}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: bottom + 24,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {title && (
            <ThemedText {...textStyles.title} style={styles.title}>
              {title}
            </ThemedText>
          )}
          {subtitle && (
            <ThemedText {...textStyles.gray} style={styles.subtitle}>
              {subtitle}
            </ThemedText>
          )}
          <View style={styles.form}>
            {children}
            {extraActions ? (
              <Container gap={10}>{extraActions}</Container>
            ) : null}
          </View>
          {showPolicy ? (
            <Container
              style={{
                paddingHorizontal: SIZES.padding,
                paddingTop: 24,
                paddingBottom: DEPLOYMENT_ENVIRONMENT === "testing" ? 8 : 0,
                backgroundColor: "transparent",
              }}
              align="center"
              justify="center"
            >
              <ThemedText
                {...textStyles.gray}
                size="sm"
                style={{ textAlign: "center", lineHeight: 20 }}
              >
                {privacyPolicyMessage}{" "}
                {corporation?.privacyPolicy &&
                isValidHttpUrl(corporation.privacyPolicy) ? (
                  <>
                    de privacyverklaring van{" "}
                    <Link
                      href={corporation.privacyPolicy as any}
                      asChild
                      onPress={(e) => {
                        e.preventDefault();
                        handleOpenPrivacyPolicy(corporation.privacyPolicy!);
                      }}
                    >
                      <ThemedText {...textStyles.link} size="sm">
                        {corporation.name}
                      </ThemedText>
                    </Link>{" "}
                    en{" "}
                  </>
                ) : null}
                de privacyverklaring van{" "}
                <Link
                  href={"https://databalk.nu/privacy-policy" as any}
                  asChild
                  onPress={(e) => {
                    e.preventDefault();
                    handleOpenPrivacyPolicy(
                      "https://databalk.nu/privacy-policy",
                    );
                  }}
                >
                  <ThemedText {...textStyles.link} size="sm">
                    DataBalk
                  </ThemedText>
                </Link>
                .
              </ThemedText>
            </Container>
          ) : null}
          {DEPLOYMENT_ENVIRONMENT === "testing" ? (
            <Container
              style={{
                paddingHorizontal: SIZES.padding,
                paddingTop: 8,
                paddingBottom: 0,
                backgroundColor: "transparent",
              }}
              align="center"
              justify="center"
            >
              <ThemedText {...textStyles.gray} size="sm">
                Testversie v{Constants.expoConfig?.version || "N/A"}
              </ThemedText>
            </Container>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
      {DEPLOYMENT_ENVIRONMENT === "testing" ? (
        <Container
          style={{
            position: "absolute",
            bottom: bottom + 12,
            right: 0,
            paddingHorizontal: SIZES.padding,
            zIndex: 20,
          }}
          justify="flex-end"
          direction="horizontal"
        >
          <Dropdown>
            <DropdownTrigger>
              <IconButton
                variant="secondary"
                style={{
                  borderRadius: 20,
                }}
              >
                <Ionicons name="ellipsis-horizontal" />
              </IconButton>
            </DropdownTrigger>
            <DropdownContent
              style={{
                width: 200,
              }}
            >
              <ThemedText
                style={{
                  paddingHorizontal: SIZES.padding,
                  paddingVertical: SIZES.padding / 3,
                }}
              >
                Selecteer Omgeving
              </ThemedText>
              <DropdownRadioGroup
                value={environment}
                onValueChange={(env) => {
                  updateEnvironment(env as any);
                }}
              >
                <DropdownRadioItem value="production">
                  Productie
                </DropdownRadioItem>
                <DropdownRadioItem value="sandbox">Zandbak</DropdownRadioItem>
                <DropdownRadioItem value="develop">
                  Ontwikkelen
                </DropdownRadioItem>
              </DropdownRadioGroup>
            </DropdownContent>
          </Dropdown>
        </Container>
      ) : null}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SIZES.padding,
    paddingTop: 60,
    flexGrow: 1,
  },
  form: {
    marginTop: 24,
    gap: 26,
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "400",
    marginBottom: 10,
    fontFamily: FONTS.extraBold,
  },
  subtitle: {
    fontSize: 17,
    marginBottom: 20,
    fontFamily: FONTS.regular,
  },
});

export default AuthLayout;
