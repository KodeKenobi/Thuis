/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#00A7DB";
const tintColorDark = "#00A7DB";
const warningFadeColor = "#f9bb2140";
const successFadeColor = "#09C54940";
const errorFadeColor = "#e61e2540";
const successColor = "#09C549";
const warningColor = "#f9bb21";
const errorColor = "#e61e25";
const primary = "#2962ff";
const grayishColor = "#687076";

export const COLORS = {
  light: {
    text: "#11181C",
    background: "#fafafa",
    tint: tintColorLight,
    icon: "#00A7DB",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    toastSuccessColor: successFadeColor,
    toastWarningColor: warningFadeColor,
    toastErrorColor: errorFadeColor,
    errorColor,
    errorFadeColor,
    successColor,
    warningColor,
    alertText: "#0B1516",
    white: "#FFFFFF",
    black: "#000000",
    primary,
    grayishColor,
    inputBg: "#f9f9f9",
    secondary: "#f0f0f0",
    cardBg: "#FFFFFF",
    // Badge colors
    badgeDefaultBg: "#EEEEEE",
    badgeDefaultBorder: "#CCCCCC",
    badgeDefaultText: "#333333",
    badgeInfoBg: "#DBEAFE",
    badgeInfoBorder: "#60A5FA",
    badgeInfoText: "#1E40AF",
    badgeSuccessBg: "#DCFCE7",
    badgeSuccessBorder: "#22C55E",
    badgeSuccessText: "#065F46",
    badgeWarningBg: "#FEF3C7",
    badgeWarningBorder: "#F59E0B",
    badgeWarningText: "#92400E",
    badgeErrorBg: "#FEE2E2",
    badgeErrorBorder: "#EF4444",
    badgeErrorText: "#991B1B",
  },
  dark: {
    text: "#FFFFFF",
    background: "#121212",
    tint: tintColorDark,
    icon: "#E0E3E6",
    tabIconDefault: "#E0E3E6",
    tabIconSelected: tintColorDark,
    toastSuccessColor: "rgba(9, 197, 73, 0.2)",
    toastWarningColor: "rgba(249, 187, 33, 0.2)",
    toastErrorColor: "rgba(230, 30, 37, 0.2)",
    errorColor,
    errorFadeColor,
    successColor,
    warningColor,
    alertText: "#FFFFFF",
    white: "#FFFFFF",
    black: "#000000",
    primary: "#4C8BFF",
    grayishColor: "#9BA1A6",
    inputBg: "#1E1E1E",
    secondary: "#2A2A2A",
    cardBg: "#1A1A1A",
    // Badge colors
    badgeDefaultBg: "#2A2A2A",
    badgeDefaultBorder: "#404040",
    badgeDefaultText: "#E0E3E6",
    badgeInfoBg: "rgba(96, 165, 250, 0.2)",
    badgeInfoBorder: "#60A5FA",
    badgeInfoText: "#93C5FD",
    badgeSuccessBg: "rgba(34, 197, 94, 0.2)",
    badgeSuccessBorder: "#22C55E",
    badgeSuccessText: "#86EFAC",
    badgeWarningBg: "rgba(245, 158, 11, 0.2)",
    badgeWarningBorder: "#F59E0B",
    badgeWarningText: "#FCD34D",
    badgeErrorBg: "rgba(239, 68, 68, 0.2)",
    badgeErrorBorder: "#EF4444",
    badgeErrorText: "#FCA5A5",
  },
};

/**
 * Get organization-specific color based on organization name
 */
export const getOrgColor = (org: string): string => {
  switch (org.toUpperCase()) {
    case "IRIS":
      return "#00A7DB";
    case "BASTON":
      return "#FF69B4";
    case "HAVENSTEDER":
      return "#FF4444";
    case "VIVARE":
      return "#1A5276";
    case "WOONZORG":
      return "#FFA500";
    case "DEALLIANTIE":
    case "DE ALLIANTIE":
      return "#2962FF";
    case "WONINGCORPORATIE":
      return "#4CAF50";
    case "WONINGSTICHTING":
      return "#9C27B0";
    case "VOLKSHUISVESTING":
      return "#F44336";
    case "KNUSWONEN":
      return "#E91E63";
    default:
      return "#00A7DB";
  }
};
