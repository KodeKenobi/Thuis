import React from "react";
import { router, Stack, useLocalSearchParams } from "expo-router";

import { ThemedView } from "@/components/ui/themed-view";
import { Header } from "@/components/ui/header";
import NewsDetailContainer from "@/components/containers/news/news-detail-container";
import InnerScreenTemplate from "@/components/templates/inner-screen-template";
import { WithErrorBoundary } from "@/components/ui/with-error-boundary";
import { ComponentProfiler } from "@/utils/component-profiler";

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <InnerScreenTemplate
      header={{
        title: "Nieuws",
        backDestination: () => router.back(),
      }}
    >
      {id && (
        <WithErrorBoundary
          resetKeys={[id]}
          title="Kan nieuwsbericht niet laden"
          description="Er is een fout opgetreden bij het laden van het nieuwsbericht. Probeer het opnieuw."
        >
          <ComponentProfiler componentName="NewsDetailContainer">
            <NewsDetailContainer id={id} />
          </ComponentProfiler>
        </WithErrorBoundary>
      )}
    </InnerScreenTemplate>
  );
}
