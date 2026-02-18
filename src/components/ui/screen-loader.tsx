import React from "react";
import { ThemedView } from "./themed-view";
import { ActivityIndicator } from "react-native";

const ScreenLoader = () => {
  return (
    <ThemedView
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
      }}
    >
      <ActivityIndicator />
    </ThemedView>
  );
};

export default ScreenLoader;
