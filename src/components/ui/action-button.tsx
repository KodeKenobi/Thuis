import {
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import { Container } from "./container";
import { ThemedText } from "./themed-text";
import { getBackgroundColor } from "@/utils";
import Skeleton from "./skeleton";
import { ThemedView } from "./themed-view";

interface ActionButtonProps extends TouchableOpacityProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  color?: string;
  loading?: boolean;
}

export const ActionButton = ({
  icon,
  label,
  count,
  style,
  color,
  loading,
  ...props
}: ActionButtonProps) => {
  // Determine badge content and size
  let badgeContent: string | number = "";
  let badgeWidth = 24;

  if (count !== undefined) {
    if (count > 99) {
      badgeContent = "99+";
      badgeWidth = 36; // Wider for 99+
    } else {
      badgeContent = count;
      badgeWidth = count > 9 ? 24 : 24; // Wider for double digits
    }
  }

  return (
    <TouchableOpacity
      {...props}
      style={[
        {
          flex: 1,
          paddingVertical: 16,
          paddingHorizontal: 20,
          borderRadius: 12,
          ...(color ? { backgroundColor: getBackgroundColor(color) } : {}),
        },
        style || {},
      ]}
    >
      <Container direction="horizontal" align="center" justify="space-between">
        <Container direction="horizontal" align="center" gap={12}>
          {icon}
          <ThemedText>{label}</ThemedText>
        </Container>

        {(count !== undefined || loading) && (
          <ThemedView
            style={{
              backgroundColor: color || "#e0e0e0",
              borderRadius: 12, // Fully rounded corners
              minWidth: badgeWidth,
              height: 24,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 2,
            }}
          >
            {loading ? (
              <Skeleton height={14} width={14} style={{ borderRadius: 7 }} />
            ) : (
              <ThemedText
                style={{
                  color: "white",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                {badgeContent}
              </ThemedText>
            )}
          </ThemedView>
        )}
      </Container>
    </TouchableOpacity>
  );
};
