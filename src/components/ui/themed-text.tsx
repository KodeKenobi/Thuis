import { Text, type TextProps, StyleSheet } from "react-native";
import { useMemo } from "react";
import { FONTS } from "@/constants/fonts";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { hyphenateDutch } from "@/utils";
import { getFontWeight } from "@/utils/font-preloader";
import * as Font from "expo-font";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  size?:
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "xxl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl";
  weight?: "regular" | "medium" | "semiBold" | "bold";
  align?: "left" | "center" | "right";
  hyphenate?: boolean;
  wrap?: "wrap" | "nowrap";
  extraBreaks?: boolean;
  fontType?: "body" | "display";
};

function insertExtraBreaks(s: string) {
  const ZWSP = "\u200B";
  return s.replace(/&/g, `${ZWSP}&${ZWSP}`).replace(/\//g, `${ZWSP}/${ZWSP}`);
}

export function ThemedText({
  style,
  lightColor,
  darkColor,
  size = "md",
  weight = "regular",
  align = "left",
  hyphenate = true,
  wrap = "wrap",
  extraBreaks = true,
  fontType = "body",
  children,
  numberOfLines,
  ...rest
}: ThemedTextProps) {
  const {
    colors: { text, theme },
  } = useCorporateBranding();
  const { getCorpFont } = useCorporateBranding();
  const corpFont = useMemo(() => {
    return getCorpFont(fontType);
  }, [getCorpFont, fontType]);

  const color =
    theme === "light" && lightColor
      ? lightColor
      : theme === "dark" && darkColor
        ? darkColor
        : text;

  let content = children;
  if (typeof content === "string") {
    let s = content;
    if (hyphenate) s = hyphenateDutch(s);
    if (extraBreaks) s = insertExtraBreaks(s);
    content = s;
  }

  const computedNumberOfLines =
    wrap === "nowrap" ? (numberOfLines ?? 1) : numberOfLines;

  // If corporate font is available, use it
  // Use useMemo to prevent infinite re-renders
  const { fontFamily, fontWeight: finalFontWeight } = useMemo(() => {
    if (!corpFont) {
      return {
        fontFamily: FONTS[weight as keyof typeof FONTS] || FONTS.regular,
        fontWeight: undefined,
      };
    }

    // corpFont is a registration key (e.g., "Poppins-400") or font name (e.g., "Overlock")
    // Check if it's a registration key (contains "-400", "-500", etc.)
    if (corpFont.match(/-\d+$/)) {
      // It's a registration key - extract base name and select correct weight key
      const baseName = corpFont.split("-")[0]; // "Poppins" from "Poppins-400"
      const weightValue = getFontWeight(weight);

      // Fallback chain: try requested weight, then fallback weights
      const WEIGHT_FALLBACKS: Record<number, number[]> = {
        700: [700, 600, 500, 400], // bold -> semibold -> medium -> regular
        600: [600, 500, 400], // semibold -> medium -> regular
        500: [500, 400], // medium -> regular
        400: [400], // regular
      };

      const fallbacks = WEIGHT_FALLBACKS[weightValue] || [weightValue, 400];
      let fontFamilyToUse = corpFont; // Default to original key

      // Try each weight in fallback chain
      for (const fallbackWeight of fallbacks) {
        const testKey = `${baseName}-${fallbackWeight}`;
        if (Font.isLoaded(testKey)) {
          fontFamilyToUse = testKey;
          break;
        }
      }

      return {
        fontFamily: fontFamilyToUse,
        fontWeight: undefined, // Don't use fontWeight with registration keys
      };
    } else {
      // It's a font name (like "Overlock") - use with fontWeight
      const weightValue = getFontWeight(weight);
      const validWeight = weightValue as 400 | 500 | 600 | 700;
      return {
        fontFamily: corpFont,
        fontWeight: validWeight,
      };
    }
  }, [corpFont, weight]);

  return (
    <Text
      style={[
        { color, textAlign: align },
        styles.base,
        sizeStyles[size],
        { fontFamily },
        finalFontWeight !== undefined ? { fontWeight: finalFontWeight } : {},
        wrap === "wrap" ? styles.wrapHelpers : null,
        style,
      ]}
      ellipsizeMode={wrap === "nowrap" ? "tail" : rest.ellipsizeMode}
      numberOfLines={computedNumberOfLines}
      {...rest}
    >
      {content}
    </Text>
  );
}

// Base styles that apply to all text
const styles = StyleSheet.create({
  base: {
    fontFamily: FONTS.regular,
  },
  wrapHelpers: {
    flexShrink: 1,
    minWidth: 0,
  },
});

// Size variations
const sizeStyles = StyleSheet.create({
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  md: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 18, lineHeight: 28 },
  xl: { fontSize: 20, lineHeight: 28 },
  xxl: { fontSize: 24, lineHeight: 32 },
  "2xl": { fontSize: 28, lineHeight: 36 },
  "3xl": { fontSize: 32, lineHeight: 40 },
  "4xl": { fontSize: 36, lineHeight: 44 },
  "5xl": { fontSize: 40, lineHeight: 48 },
});

// Weight variations
const weightStyles = StyleSheet.create({
  regular: { fontFamily: FONTS.regular },
  medium: { fontFamily: FONTS.medium },
  semiBold: { fontFamily: FONTS.semiBold },
  bold: { fontFamily: FONTS.bold },
});

// Hook version that includes colors from useColors
// All text styles now use corporate colors dynamically
export const useTextStyles = () => {
  const {
    colors: { primary, grayishColor, errorColor, successColor },
  } = useCorporateBranding();
  return {
    title: { size: "xxl" as const, weight: "bold" as const },
    subtitle: { size: "xl" as const, weight: "semiBold" as const },
    body: { size: "md" as const, weight: "regular" as const },
    caption: { size: "sm" as const, weight: "regular" as const },
    link: {
      size: "md" as const,
      weight: "regular" as const,
      lightColor: primary,
      darkColor: primary,
    },
    gray: {
      size: "md" as const,
      weight: "regular" as const,
      lightColor: grayishColor,
      darkColor: grayishColor,
    },
    danger: {
      size: "md" as const,
      weight: "regular" as const,
      lightColor: errorColor,
      darkColor: errorColor,
    },
    onboardingTitle: {
      size: "xl" as const,
      weight: "bold" as const,
      align: "center" as const,
    },
    onboardingDescription: {
      size: "md" as const,
      weight: "regular" as const,
      align: "center" as const,
    },
    success: {
      size: "md" as const,
      weight: "regular" as const,
      lightColor: successColor,
      darkColor: successColor,
    },
  };
};
