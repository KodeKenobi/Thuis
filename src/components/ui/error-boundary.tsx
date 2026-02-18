import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { ThemedText, useTextStyles } from "./themed-text";
import { Container } from "./container";
import { Button } from "./button";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { SIZES } from "@/constants";
import * as Updates from "expo-updates";

interface Props {
  children: ReactNode;
  fallback?:
    | ReactNode
    | ((props: { resetError: () => void; error: Error | null }) => ReactNode);
  resetKeys?: Array<string | number | boolean | null | undefined>;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    // You can log to an error reporting service here
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error boundary when resetKeys change
    if (this.state.hasError && this.props.resetKeys) {
      const hasResetKeyChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );
      if (hasResetKeyChanged) {
        this.resetError();
      }
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  handleReset = async () => {
    // For root-level boundaries, restart the app
    if (Platform.OS === "web") {
      window.location.reload();
    } else {
      await Updates.reloadAsync();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === "function") {
          return this.props.fallback({
            resetError: this.resetError,
            error: this.state.error,
          });
        }
        return this.props.fallback;
      }

      return (
        <ErrorFallback error={this.state.error} onReset={this.handleReset} />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onReset }) => {
  const textStyles = useTextStyles();
  const { colors: { background, errorColor } } = useCorporateBranding();

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Container
        style={styles.content}
        gap={16}
        align="center"
        justify="center"
      >
        <ThemedText
          {...textStyles.subtitle}
          weight="bold"
          style={{ color: errorColor }}
        >
          Oeps! Er is iets misgegaan
        </ThemedText>
        <ThemedText {...textStyles.body} style={{ textAlign: "center" }}>
          De app heeft een onverwachte fout ondervonden. Probeer de app opnieuw
          te starten.
        </ThemedText>
        {/* {error && (
          <ThemedText
            {...textStyles.gray}
            size="sm"
            style={[styles.errorText, { color: text }]}
          >
            {error.message || "Onbekende fout"}
          </ThemedText>
        )} */}
        <Button
          title="App opnieuw laden"
          onPress={onReset}
          style={{ marginTop: SIZES.padding }}
        />
      </Container>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SIZES.padding * 2,
  },
  content: {
    maxWidth: 400,
    width: "100%",
  },
  errorText: {
    fontFamily: "monospace",
    fontSize: 12,
    marginTop: SIZES.padding,
    textAlign: "center",
  },
});
