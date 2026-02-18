import React from "react";
import { ThemedText, useTextStyles } from "./themed-text";

interface LabelProps {
  children: React.ReactNode;
  required?: boolean;
}

const Label: React.FC<LabelProps> = ({ children, required }) => {
  const textStyles = useTextStyles();
  return (
    <ThemedText style={{ marginBottom: 8 }}>
      {children}
      {required && (
        <ThemedText {...textStyles.danger} weight="bold">
          {" *"}
        </ThemedText>
      )}
    </ThemedText>
  );
};

export default Label;
