import React from "react";
import { TouchableOpacity, View, StyleSheet, ActivityIndicator } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { SIZES } from "@/constants";

interface ChatFabProps {
  onPress?: () => void;
  disabled?: boolean; // only when config === null
  loading?: boolean;
}

export const ChatFab: React.FC<ChatFabProps> = ({ onPress, disabled, loading }) => {
  const { colors: { primary, white } } = useCorporateBranding();

  return (
    <View style={styles.wrapper} pointerEvents="auto">
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={!!disabled}
        style={[styles.fab, { backgroundColor: primary }, disabled && { opacity: 0.4 }]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={white} />
        ) : (
          <Ionicons name="chatbubble-ellipses" size={28} color={white} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    right: SIZES.padding,
    bottom: 34,
    zIndex: 9999,
    elevation: 9999,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
