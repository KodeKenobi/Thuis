import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Container } from "@/components/ui/container";
import { HeaderTemplate } from "@/components/templates/header-template";
import { IconButton } from "@/components/ui/icon-button";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AnimatedSearch } from "@/components/ui/animated-search";
import PostListContainer from "@/components/containers/posts/post-list-container";
import TabScreenTemplate from "@/components/templates/tab-screen-template";
import { WithErrorBoundary } from "@/components/ui/with-error-boundary";
import { ComponentProfiler } from "@/utils/component-profiler";

export default function PostScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((prev) => prev + 1);
    }, [])
  );

  const handleCancel = () => {
    setSearchQuery("");
    setIsSearchActive(false);
  };

  return (
    <TabScreenTemplate
      header={{
        title: "Post",
        action: (
          <Container direction="horizontal" gap={8}>
            <IconButton
              size="sm"
              variant="secondary"
              onPress={() => setIsSearchActive(true)}
            >
              <Ionicons name="search" />
            </IconButton>
          </Container>
        ),
      }}
      showHeaderAction={isSearchActive}
      headerAction={
        isSearchActive ? (
          <HeaderTemplate>
            <AnimatedSearch
              value={searchQuery}
              onChangeText={setSearchQuery}
              onCancel={handleCancel}
            />
          </HeaderTemplate>
        ) : null
      }
    >
      <WithErrorBoundary
        key={`posts-${refreshKey}`}
        resetKeys={[searchQuery]}
        title="Kan berichten niet laden"
        description="Er is een fout opgetreden bij het laden van de berichten. Probeer het opnieuw."
      >
        <ComponentProfiler componentName="PostListContainer">
          <PostListContainer searchQuery={searchQuery} />
        </ComponentProfiler>
      </WithErrorBoundary>
    </TabScreenTemplate>
  );
}
