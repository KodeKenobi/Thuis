/**
 * Font families and styles used throughout the app
 * Geist font family from Google FONTS - modern, clean typography
 */

export const FONTS = {
  regular: "Geist_400Regular", // 400
  medium: "Geist_500Medium", // 500
  semiBold: "Geist_600SemiBold", // 600
  bold: "Geist_700Bold", // 700
  extraBold: "Geist_800ExtraBold", // 800
};

export const FONTS_STYLES = {
  body: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySemiBold: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  heading1: {
    fontFamily: FONTS.extraBold,
    fontSize: 32,
    lineHeight: 40,
  },
  heading2: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    lineHeight: 32,
  },
  heading3: {
    fontFamily: FONTS.semiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  heading4: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  caption: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  buttonBold: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
  },
  buttonExtraBold: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    lineHeight: 24,
  },
  small: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  title: {
    fontFamily: FONTS.extraBold,
    fontSize: 28,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: FONTS.medium,
    fontSize: 18,
    lineHeight: 26,
  },
};
