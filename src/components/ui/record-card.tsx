import React, { useMemo } from "react";
import { TouchableOpacity, StyleProp, ViewStyle } from "react-native";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

import { Container } from "@/components/ui/container";
import { ThemedText, useTextStyles } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import Card from "./card";

type StatusVariant = "open" | "closed" | "resolved" | "default" | "info";

export interface RecordCardProps {
  title: string;
  idLabel?: string;
  date?: string;
  status?: { variant: StatusVariant; label: string };
  onPress?: () => void;
  rightElement?: React.ReactNode;
  extraElement?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const variantToBadge: Record<
  StatusVariant,
  "warning" | "success" | "default" | "error" | "info"
> = {
  open: "warning",
  resolved: "success",
  closed: "default",
  default: "default",
  info: "info",
};

// Memoize static style objects
const recordCardStyle = { marginVertical: 8 };
const titleStyle = { flex: 1, paddingRight: 8 };

const RecordCard: React.FC<RecordCardProps> = React.memo(
  ({
    title,
    idLabel,
    date,
    status,
    onPress,
    rightElement,
    style,
    extraElement,
  }) => {
    const textStyles = useTextStyles();
    // Memoize date formatting to avoid recalculation on every render
    const formattedDate = useMemo(() => {
      if (!date) return undefined;
      try {
        return format(new Date(date), "dd MMMM yyyy HH:mm", { locale: nl });
      } catch {
        return undefined;
      }
    }, [date]);

    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <Card gap={8} variant="background" style={[recordCardStyle, style]}>
          <Container
            direction="horizontal"
            justify="space-between"
            align="flex-start"
          >
            {title ? (
              <ThemedText
                {...textStyles.body}
                weight="semiBold"
                numberOfLines={2}
                ellipsizeMode="tail"
                style={titleStyle}
              >
                {title}
              </ThemedText>
            ) : (
              <>
                {idLabel && (
                  <ThemedText {...textStyles.gray}>{idLabel}</ThemedText>
                )}
              </>
            )}

            {rightElement ??
              (status && (
                <Badge variant={variantToBadge[status.variant]}>
                  {status.label}
                </Badge>
              ))}
          </Container>

          {idLabel && title && (
            <ThemedText {...textStyles.gray}>{idLabel}</ThemedText>
          )}
          {formattedDate && (
            <ThemedText {...textStyles.gray}>{formattedDate}</ThemedText>
          )}
          {extraElement}
        </Card>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if props actually change (don't compare functions/elements as they're recreated)
    return (
      prevProps.title === nextProps.title &&
      prevProps.idLabel === nextProps.idLabel &&
      prevProps.date === nextProps.date &&
      prevProps.status?.variant === nextProps.status?.variant &&
      prevProps.status?.label === nextProps.status?.label
      // Don't compare onPress, rightElement, extraElement, style as they may be recreated
    );
  }
);

RecordCard.displayName = "RecordCard";

export default RecordCard;
