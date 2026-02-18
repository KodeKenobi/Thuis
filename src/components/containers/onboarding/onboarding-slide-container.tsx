import React from "react";
import { ImageSourcePropType } from "react-native";
import { useTextStyles, ThemedText } from "@/components/ui/themed-text";
import { Container } from "@/components/ui/container";
import { Image } from "expo-image";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { ThemedTextProps } from "@/components/ui/themed-text";

interface SlideProps {
  image: ImageSourcePropType;
  title: string;
  description: string;
  imageSize?: number;

  titleTextStyle?: ThemedTextProps;
  descriptionTextStyle?: ThemedTextProps;
}

export function OnboardingSlideContainer({
  image,
  title,
  description,
  imageSize = 250,
  titleTextStyle,
  descriptionTextStyle,
}: SlideProps) {
  const textStyles = useTextStyles();
  const { colors: { cardBg } } = useCorporateBranding();
  const hasImage = image && (image as any).uri !== "";

  return (
    <Container
      direction="vertical"
      justify="center"
      align="center"
      gap={hasImage ? 40 : 24}
      flex={1}
      style={{
        paddingHorizontal: 20,
        width: "100%",
      }}
    >
      {hasImage && (
        <Container
          direction="vertical"
          justify="center"
          align="center"
          style={{
            width: imageSize,
            height: imageSize,
            backgroundColor: cardBg,
            borderRadius: 12,
          }}
        >
          <Image
            source={image}
            style={{ width: imageSize * 0.6, height: imageSize * 0.6 }}
            contentFit="contain"
          />
        </Container>
      )}

      {title && (
        <ThemedText
          weight="bold"
          align="center"
          size={hasImage ? "xl" : "4xl"}
          {...titleTextStyle}
        >
          {title}
        </ThemedText>
      )}

      {description && (
        <ThemedText
          align="center"
          style={{
            paddingHorizontal: 10,
            lineHeight: hasImage ? 24 : 28,
            width: "100%",
          }}
          {...textStyles.gray}
          size={hasImage ? "md" : "xxl"}
          {...descriptionTextStyle}
        >
          {description}
        </ThemedText>
      )}
    </Container>
  );
}
