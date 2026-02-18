import React, { ReactNode } from "react";
import { Container } from "../ui/container";
import { useTextStyles, ThemedText } from "../ui/themed-text";
import { ThemedView } from "../ui/themed-view";
import { StyleProp, ViewStyle } from "react-native";
import { SIZES } from "@/constants";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

type SectionTemplateProps = {
  title?: string;
  action?: ReactNode;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const SectionTemplate = ({
  children,
  title,
  action,
  style,
}: SectionTemplateProps) => {
  const textStyles = useTextStyles();
  const { colors: { cardBg } } = useCorporateBranding();
  return (
    <Container
      style={[
        {
          paddingHorizontal: SIZES.padding / 1.5,
          paddingTop: SIZES.padding / 2,
          paddingBottom: SIZES.padding / 1.5,
          backgroundColor: cardBg,
          borderRadius: 12,
        },
        style,
      ]}
      gap={10}
    >
      <Container direction="horizontal" justify="space-between" align="center">
        {title ? (
          <ThemedText {...textStyles.subtitle} size="lg" fontType="display">
            {title}
          </ThemedText>
        ) : (
          <ThemedView />
        )}
        {action}
      </Container>
      {children}
    </Container>
  );
};

export default SectionTemplate;
