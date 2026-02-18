import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Skeleton from "./skeleton";
import { getBackgroundColor } from "@/utils";
import { Image } from "expo-image";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { ThemedText } from "@/components/ui/themed-text";

export type AvatarVariant =
  | "blue"
  | "gray"
  | "green"
  | "red"
  | "yellow"
  | "custom";
export type AvatarShape = "rounded" | "square";

export interface AvatarProps {
  variant?: AvatarVariant;
  shape?: AvatarShape;
  size?: number;
  fallback?: string;
  source?: ImageSourcePropType;
  icon?: React.ReactNode | string;
  iconSize?: number;
  color?: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  retryDelay?: number;
  maxRetries?: number;
  bgAlpha?: number;
}

const Avatar: React.FC<AvatarProps> = ({
  variant = "gray",
  shape = "rounded",
  size = 40,
  fallback = "",
  source,
  icon,
  iconSize = 0.5,
  color,
  backgroundColor,
  style,
  retryDelay = 1000,
  maxRetries = 5,
  bgAlpha,
}) => {
  const { colors: { theme, grayishColor, text } } = useCorporateBranding(); 
  const VARIANT_COLORS = {
    blue: { background: "#e3f2fd", text: "#0d47a1" },
    gray: {
      background: theme === "dark" ? grayishColor : "#f5f5f5",
      text: theme === "dark" ? text : "#424242",
    },
    green: { background: "#e8f5e9", text: "#1b5e20" },
    red: { background: "#ffebee", text: "#b71c1c" },
    yellow: { background: "#fffde7", text: "#f57f17" },
    custom: { background: "#e0e0e0", text: "#757575" },
  };
  const [loading, setLoading] = useState(!!source);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const variantColors = VARIANT_COLORS[variant];
  const textColor = color || variantColors.text;
  const bgColor =
    backgroundColor ||
    (color ? getBackgroundColor(color, bgAlpha) : variantColors.background);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: shape === "rounded" ? size / 2 : size * 0.2,
    backgroundColor: bgColor,
  };

  const textStyle = {
    fontSize: size * 0.4,
    color: textColor,
  };

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setRetryCount(0);
    setError(false);
    if (source) setLoading(true);
    else setLoading(false);

    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, [source]);

  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
    setRetryCount(0);
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const handleImageError = () => {
    if (retryCount < maxRetries) {
      retryTimerRef.current = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
      }, retryDelay * (retryCount + 1)); // exponential-ish backoff
    } else {
      setLoading(false);
      setError(true);
      setRetryCount(0);
    }
  };

  const getInitials = () => {
    if (!fallback) return "";
    const parts = fallback.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
    return `${parts[0][0]?.toUpperCase()}${parts[
      parts.length - 1
    ][0]?.toUpperCase()}`;
  };

  const renderFallback = () => {
    if (icon) {
      return typeof icon === "string" ? (
        <Ionicons name={icon as any} size={size * iconSize} color={textColor} />
      ) : React.isValidElement(icon) ? (
        React.cloneElement(icon, {
          // @ts-ignore
          size: size * iconSize,
          color: textColor,
        })
      ) : (
        icon
      );
    }

    if (fallback) {
      return <ThemedText style={[styles.text, textStyle]}>{getInitials()}</ThemedText>;
    }

    return (
      <Ionicons
        name="image-outline"
        size={size * iconSize}
        color={textColor}
        style={{ opacity: 0.5 }}
      />
    );
  };

  return (
    <View style={[styles.container, containerStyle, style]}>
      {source && !error && (
        <Image
          source={source}
          style={[
            styles.image,
            {
              borderRadius: shape === "rounded" ? size / 2 : size * 0.2,
              width: size * iconSize,
              height: size * iconSize,
            },
          ]}
          contentFit="cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
          key={`avatar-img-${retryCount}`} // force re-mount on retry
        />
      )}

      {loading && (
        <AvatarSkeleton
          shape={shape}
          size={size}
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: containerStyle.borderRadius },
          ]}
        />
      )}

      {(error || !source) && !loading && (
        <View style={styles.fallbackContainer}>{renderFallback()}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  text: {
    fontWeight: "bold",
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  fallbackContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});

export type AvatarSkeletonProps = {
  shape?: "rounded" | "square";
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export const AvatarSkeleton: React.FC<AvatarSkeletonProps> = ({
  shape = "rounded",
  size = 40,
  style,
}) => {
  const borderRadius = shape === "rounded" ? size / 2 : size * 0.2;
  return (
    <Skeleton
      width={size}
      height={size}
      style={[
        {
          borderRadius,
        },
        style,
      ]}
    />
  );
};

export default Avatar;
