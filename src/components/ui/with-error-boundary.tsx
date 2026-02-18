import React, { ReactNode } from "react";
import { ErrorBoundary } from "./error-boundary";
import { ComponentErrorFallback } from "./component-error-fallback";

interface WithErrorBoundaryProps {
  children: ReactNode;
  resetKeys?: Array<string | number | boolean | null | undefined>;
  title?: string;
  description?: string;
  actionText?: string;
}

export const WithErrorBoundary: React.FC<WithErrorBoundaryProps> = ({
  children,
  resetKeys,
  title,
  description,
  actionText,
}) => {
  return (
    <ErrorBoundary
      resetKeys={resetKeys}
      fallback={({ resetError, error }) => (
        <ComponentErrorFallback
          resetError={resetError}
          error={error}
          title={title}
          description={description}
          actionText={actionText}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
