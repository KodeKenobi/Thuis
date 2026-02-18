import React from "react";
import { useLocalSearchParams } from "expo-router";
import PostDetailContainer from "@/components/containers/posts/post-detail-container";
import { WithErrorBoundary } from "@/components/ui/with-error-boundary";
import { ComponentProfiler } from "@/utils/component-profiler";

export default function PostDetailScreen() {
  const { id, subject } = useLocalSearchParams<{
    id: string;
    subject?: string;
  }>();

  return (
    <WithErrorBoundary
      resetKeys={[id, subject]}
      title="Kan bericht niet laden"
      description="Er is een fout opgetreden bij het laden van het bericht. Probeer het opnieuw."
    >
      <ComponentProfiler componentName="PostDetailContainer">
        <PostDetailContainer
          id={id as string}
          subject={subject as string | undefined}
        />
      </ComponentProfiler>
    </WithErrorBoundary>
  );
}
