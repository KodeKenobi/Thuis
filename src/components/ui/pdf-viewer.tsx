// Web fallback - PDF viewer not available on web
import React from "react";
import { View } from "react-native";

interface PdfViewerProps {
  source: { uri: string };
  style?: any;
  onPageChanged?: (page: number, numberOfPages: number) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = () => {
  return <View />;
};

