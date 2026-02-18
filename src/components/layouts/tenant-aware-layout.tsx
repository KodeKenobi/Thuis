import React, { useMemo } from "react";
import { useChatService } from "@/service/chat";
import { ChatBottomSheetContainer } from "@/components/containers/chat/chat-details";
import { useAuth } from "@/contexts/auth-context";

/** Mount this once (e.g., Tabs layout) to show the FAB + sheet everywhere */
export const TenantAwareChat: React.FC<{ corporationName?: string }> = ({ corporationName }) => {
  const { user, environment } = useAuth();

  const corpRaw = useMemo(
    () => user?.corporationKey ?? corporationName ?? user?.corporationName,
    [user?.corporationKey, corporationName, user?.corporationName]
  );

  if (!corpRaw) return null;

  const { data: config, isLoading, isFetching, error } = useChatService(corpRaw, { __env: environment } as any);

  return (
    <ChatBottomSheetContainer
      config={config}
      loading={isLoading || isFetching}
      error={error ? (error.message || "Onbekende fout") : null}
    />
  );
};
