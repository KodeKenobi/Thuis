import React, { useState, forwardRef, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  StyleProp,
  ViewStyle,
} from "react-native";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import Label from "./label";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { BottomSheetTextInputProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetTextInput";
import { ThemedText } from "./themed-text";

export interface InputProps extends BottomSheetTextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  secureEntryToggle?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  required?: boolean;
  variant?: "background" | "outline";
}

export const CustomBottomSheetTextInput = forwardRef<
  React.ElementRef<typeof BottomSheetTextInput>,
  InputProps
>(
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
    ref,
  ) => {
    const { colors: { inputBg, text, grayishColor } } = useCorporateBranding();
    const { getCorpFont } = useCorporateBranding();
    const corpFont = useMemo(() => {
      return getCorpFont("body");
    }, [getCorpFont]);
    const [secureTextEntry, setSecureTextEntry] = useState(
      props.secureTextEntry,
    );

    const toggleSecureEntry = () => {
      setSecureTextEntry(!secureTextEntry);
    };

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
            props?.multiline ||
            (props?.numberOfLines && props?.numberOfLines > 1)
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
          <BottomSheetTextInput
            {...props}
            ref={ref}
            style={[
              styles.input,
              { color: text },
              corpFont ? { fontFamily: corpFont } : {},
              props?.multiline ||
              (props?.numberOfLines && props?.numberOfLines > 1)
                ? {
                    height: "auto",
                    minHeight: 44,
                    paddingTop: 12,
                    paddingBottom: 12,
                  }
                : undefined,
              style,
            ]}
            placeholderTextColor="#999"
            secureTextEntry={secureTextEntry}
            textAlignVertical={
              props?.multiline ||
              (props?.numberOfLines && props?.numberOfLines > 1)
                ? "top"
                : undefined
            }
            scrollEnabled={true}
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
  },
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
    fontSize: 15,
    height: 44,
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
