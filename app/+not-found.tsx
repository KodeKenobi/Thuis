import React from "react";
import { Stack, router } from "expo-router";
import { StyleSheet } from "react-native";
import { useRouteInfo } from "expo-router/build/hooks";
import { ThemedView } from "@/components/ui/themed-view";
import { useTextStyles, ThemedText } from "@/components/ui/themed-text";

export default function NotFoundScreen() {
  const textStyles = useTextStyles();
  const route = useRouteInfo();
  console.log(route, "not found route");

  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <ThemedView style={styles.container}>
        <ThemedText {...textStyles.title}>
          This screen doesn't exist.
        </ThemedText>
        <ThemedText
          onPress={() => {
            router.back();
          }}
          {...textStyles.link}
        >
          Go Back!
        </ThemedText>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
