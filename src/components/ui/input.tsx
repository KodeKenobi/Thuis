import React, { useState, forwardRef, useMemo } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Text,
  StyleProp,
  ViewStyle,
} from "react-native";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import Label from "./label";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { ThemedText } from "./themed-text";
import { FONTS } from "@/constants/fonts";
import { getFontWeight } from "@/utils/font-preloader";
import * as Font from "expo-font";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  secureEntryToggle?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  required?: boolean;
  variant?: "background" | "outline";
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      icon,
      secureEntryToggle = true,
      style,
      containerStyle,
      variant = "background",
      inputStyle,
      ...props
    }: InputProps,
    ref
  ) => {
    const { colors: { inputBg, text, grayishColor, theme } } = useCorporateBranding();
    const { getCorpFont } = useCorporateBranding();
    const corpFont = useMemo(() => {
      return getCorpFont("body");
    }, [getCorpFont]);
    const [secureTextEntry, setSecureTextEntry] = useState(
      props.secureTextEntry
    );

    const toggleSecureEntry = () => {
      setSecureTextEntry(!secureTextEntry);
    };

    const placeholderColor =
      theme === "dark" ? "rgba(255,255,255,0.5)" : "#B3B3B3";

      let weight = "medium" as const

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
      <View style={[styles.container, containerStyle]}>
        {label && <Label required={props.required}>{label}</Label>}
        <View
          style={[
            styles.inputContainer,
            variant === "background" && { backgroundColor: inputBg },
            variant === "outline" && {
              ...styles.outlineContainer,
              borderColor: grayishColor,
            },
            props?.numberOfLines && props?.numberOfLines > 1
              ? {
                  alignItems: "flex-start",
                  borderRadius: 15,
                }
              : {},
            error && styles.errorContainer,
            inputStyle,
          ]}
        >
          {icon && <View style={styles.icon}>{icon}</View>}
          <TextInput
            {...props}
            ref={ref}
            style={[
              styles.input,
              { color: text },
              { fontFamily },
              style, 
            ]}
            placeholderTextColor={placeholderColor}
            secureTextEntry={secureTextEntry}
            textAlignVertical={
              props?.numberOfLines && props?.numberOfLines > 1
                ? "top"
                : undefined
            }
            scrollEnabled={false}
          />
          {secureEntryToggle && props?.secureTextEntry && (
            <TouchableOpacity
              onPress={toggleSecureEntry}
              style={styles.visibilityToggle}
            >
              <MaterialIcon
                name={secureTextEntry ? "visibility-off" : "visibility"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          )}
        </View>
        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {},
  label: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 30,
    paddingHorizontal: 15,
    height: 44,
  },
  outlineContainer: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  errorContainer: {
    borderWidth: 1,
    borderColor: "#ff0000",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: 44,
    fontWeight: 500,
  },
  visibilityToggle: {
    padding: 8,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: "#ff0000",
  },
});

export default Input;
