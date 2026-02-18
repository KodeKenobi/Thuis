// app/news/news-screen.tsx
import React, { useState } from "react";
import { Platform } from "react-native";
import { Container } from "@/components/ui/container";
import { Header } from "@/components/ui/header";
import { HeaderTemplate } from "@/components/templates/header-template";
import { IconButton } from "@/components/ui/icon-button";
import { ThemedView } from "@/components/ui/themed-view";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack } from "expo-router";
import { AnimatedSearch } from "@/components/ui/animated-search";
import NewsListContainer from "@/components/containers/news/news-list-container";
import { ComponentProfiler } from "@/utils/component-profiler";
import { WithErrorBoundary } from "@/components/ui/with-error-boundary";

export default function NewsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  const handleCancel = () => {
    setSearchQuery("");
    setIsSearchActive(false);
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />

      {isSearchActive ? (
        <HeaderTemplate minHeight={Platform.select({ ios: 106, android: 97 })}>
          <AnimatedSearch
            value={searchQuery}
            onChangeText={setSearchQuery}
            onCancel={handleCancel}
          />
        </HeaderTemplate>
      ) : (
        <Header
          title="Nieuws"
          backDestination={() => router.back()}
          action={
            <IconButton
              size="sm"
              variant="secondary"
              onPress={() => setIsSearchActive(true)}
            >
              <Ionicons name="search" />
            </IconButton>
          }
        />
      )}

      <WithErrorBoundary
        resetKeys={[searchQuery]}
        title="Kan nieuws niet laden"
        description="Er is een fout opgetreden bij het laden van het nieuws. Probeer het opnieuw."
      >
        <ComponentProfiler componentName="NewsListContainer">
          <NewsListContainer
            filter={{
              search: searchQuery,
            }}
            scrollable
          />
        </ComponentProfiler>
      </WithErrorBoundary>
    </ThemedView>
  );
}
