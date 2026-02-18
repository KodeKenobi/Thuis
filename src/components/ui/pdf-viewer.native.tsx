import React from "react";
import Pdf from "react-native-pdf";
import { Linking, StyleSheet, ViewStyle } from "react-native";

interface PdfViewerProps {
  source: { uri: string };
  style?: ViewStyle;
  onPageChanged?: (page: number, numberOfPages: number) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  source,
  style,
  onPageChanged,
}) => {
  return (
    <Pdf
      source={source}
      style={style}
      enableDoubleTapZoom
      enablePaging
      onPressLink={(link: string) => {
        Linking.openURL(link);
      }}
      onPageChanged={onPageChanged}
      fitPolicy={0}
      spacing={10}
    />
  );
};

