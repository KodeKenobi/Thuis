import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { useFetchContracts } from "@/service/contracts";
import { ChatFullScreenContainer } from "@/components/containers/chat/chat-fullscreen-container";
import { ComponentProfiler } from "@/utils/component-profiler";
import { WithErrorBoundary } from "@/components/ui/with-error-boundary";

export default function ChatScreen() {
  const { user } = useAuth();
  const { contracts } = useFetchContracts({ params: { subset: "ALL" } });

  const primaryContract = contracts?.[0];

  return (
    <WithErrorBoundary
      resetKeys={[primaryContract?.id, user?.name]}
      title="Kan chat niet laden"
      description="Er is een fout opgetreden bij het laden van de chat. Probeer het opnieuw."
    >
      <ComponentProfiler componentName="ChatFullScreenContainer">
        <ChatFullScreenContainer
          selectedContract={primaryContract}
          username={user?.name}
        />
      </ComponentProfiler>
    </WithErrorBoundary>
  );
}
