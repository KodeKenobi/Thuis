import React from "react";
import { Container } from "./container";
import { EmptyData } from "./empty-data";
import { Button } from "./button";

interface ComponentErrorFallbackProps {
  resetError: () => void;
  error: Error | null;
  title?: string;
  description?: string;
  actionText?: string;
}

/**
 * Generic error fallback component for component-level error boundaries.
 * Can be reused across all components that need error boundary protection.
 */
export const ComponentErrorFallback: React.FC<ComponentErrorFallbackProps> = ({
  resetError,
  error,
  title = "Er is iets misgegaan",
  description = "Er is een fout opgetreden bij het laden van deze component. Probeer het opnieuw.",
  actionText = "Opnieuw proberen",
}) => {
  return (
    <Container flex={1} justify="center" style={{ padding: 20 }}>
      <EmptyData
        variant="red"
        title={title}
        description={description}
        actionText={actionText}
        actionPress={resetError}
      />
    </Container>
  );
};
