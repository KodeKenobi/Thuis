import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Platform,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { SIZES } from "@/constants";
import { useTextStyles, ThemedText } from "@/components/ui/themed-text";
import { Container } from "@/components/ui/container";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  runComprehensiveTest,
  generateComprehensiveReport,
} from "@/utils/stress-test-runner";
import { STRESS_TEST_CONFIG } from "@/config/stress-test-config";
import { ActivityIndicator } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import { Header } from "../ui/header";
import Avatar from "../ui/avatar";
import Card from "../ui/card";
import { Badge } from "../ui/badge";

export function StressTestIndicator() {
  // Only show in dev mode AND when EXPO_PUBLIC_TEST_MODE is enabled
  const testModeEnabled = process.env.EXPO_PUBLIC_TEST_MODE === "true";

  if (!__DEV__ || !testModeEnabled) {
    return null;
  }

  const textStyles = useTextStyles();
  const colors = useColors();
  const { background, text, primary, grayishColor } = colors;
  const { bottom } = useSafeAreaInsets();
  const [isRunning, setIsRunning] = useState(false);
  const cancelRef = React.useRef(false); // To track cancellation
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    target: "",
  });
  const [isResultsModalVisible, setIsResultsModalVisible] = useState(false);
  const [report, setReport] = useState<string>("");
  const [stressMode, setStressMode] = useState(true); // Default to stress mode

  const handleRunTest = useCallback(async () => {
    if (isRunning) return; // Prevent multiple runs
    setIsRunning(true);
    cancelRef.current = false;
    setReport("");
    setProgress({ current: 0, total: 0, target: "" });

    try {
      const testOptions = {
        enableStressMode: stressMode,
        shouldCancel: () => cancelRef.current, // Pass callback
        // All other options use defaults from STRESS_TEST_CONFIG
      };

      const results = await runComprehensiveTest((current, total, target) => {
        setProgress({ current, total, target });
      }, testOptions);

      const generatedReport = generateComprehensiveReport(results, testOptions);
      setReport(generatedReport);

      // Only show modal if not cancelled (or partial results if desired, but usually if cancelled we might not show full report immediately or show partial)
      // For now, let's show what we have even if cancelled
      setIsResultsModalVisible(true);
      console.log(generatedReport);
    } catch (error) {
      console.error("[StressTest] Error:", error);
      Alert.alert("Test Error", String(error));
    } finally {
      setIsRunning(false);
      setProgress({ current: 0, total: 0, target: "" });
    }
  }, [stressMode, isRunning]);

  const handleCancelTest = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const handleCopyToClipboard = async () => {
    if (!report) return;
    try {
      await Share.share({
        message: report,
        title: "Stress Test Report",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share report");
    }
  };

  const formatReportForUI = useCallback(
    (textReport: string) => {
      const lines = textReport.split("\n");
      const formattedLines: React.ReactNode[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip empty lines
        if (!trimmed) {
          formattedLines.push(<ThemedText key={i} style={{ height: 8 }} />);
          continue;
        }

        // Skip box drawing characters
        if (
          trimmed.includes("╔") ||
          trimmed.includes("║") ||
          trimmed.includes("╚") ||
          trimmed.match(/^━+$/)
        ) {
          continue;
        }

        // Section headers
        if (
          trimmed.includes("Test Configuration:") ||
          trimmed.includes("Test Summary:") ||
          trimmed.includes("Performance Standards:")
        ) {
          formattedLines.push(
            <ThemedText
              key={i}
              {...textStyles.subtitle}
              size="md"
              style={{ marginTop: 16, marginBottom: 8 }}
            >
              {trimmed.replace(":", "")}
            </ThemedText>
          );
          continue;
        }

        // Screen names (standalone lines, not indented, no colons)
        if (
          trimmed &&
          !trimmed.startsWith("  ") &&
          !trimmed.includes(":") &&
          trimmed.length > 0 &&
          !trimmed.match(/^[✅⚠️❌]/) &&
          !trimmed.includes("Status")
        ) {
          formattedLines.push(
            <ThemedText
              key={i}
              {...textStyles.subtitle}
              size="sm"
              style={{ marginTop: 12, marginBottom: 4 }}
            >
              {trimmed}
            </ThemedText>
          );
          continue;
        }

        // Status lines
        if (trimmed.startsWith("Status:")) {
          const statusMatch = trimmed.match(
            /Status:\s*([✅⚠️❌])\s*(PASSED|FAILED|WARNING|PASS|FAIL)/
          );
          if (statusMatch) {
            const status = statusMatch[2].toLowerCase();
            const variant =
              status === "passed" || status === "pass"
                ? "success"
                : status === "failed" || status === "fail"
                ? "error"
                : "warning";
            formattedLines.push(
              <Container
                key={i}
                direction="horizontal"
                align="center"
                gap={8}
                style={{ marginVertical: 4 }}
              >
                <Badge variant={variant as any}>{statusMatch[2]}</Badge>
              </Container>
            );
          } else {
            formattedLines.push(
              <ThemedText
                key={i}
                {...textStyles.body}
                style={{ marginVertical: 2 }}
              >
                {trimmed}
              </ThemedText>
            );
          }
          continue;
        }

        // Key-value pairs
        if (trimmed.includes(":")) {
          const [key, ...valueParts] = trimmed.split(":");
          const value = valueParts.join(":").trim();
          const isPass = value.includes("✅");
          const isFail = value.includes("❌");

          formattedLines.push(
            <Container
              key={i}
              direction="horizontal"
              style={{ marginVertical: 2 }}
            >
              <ThemedText {...textStyles.body} style={{ flex: 1 }}>
                {key}:
              </ThemedText>
              <ThemedText
                {...textStyles.body}
                weight={isPass || isFail ? "semiBold" : "regular"}
                style={{
                  flex: 1,
                  color: isPass
                    ? colors.successColor
                    : isFail
                    ? colors.errorColor
                    : colors.text,
                }}
              >
                {value}
              </ThemedText>
            </Container>
          );
          continue;
        }

        // Regular lines
        formattedLines.push(
          <ThemedText
            key={i}
            {...textStyles.body}
            style={{ marginVertical: 2 }}
          >
            {trimmed}
          </ThemedText>
        );
      }

      return formattedLines;
    },
    [colors]
  );

  const convertReportToHtml = useCallback((textReport: string): string => {
    // Escape HTML entities
    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    // Convert text report to structured HTML
    const lines = textReport.split("\n");
    let html = "";
    let inSection = false;
    let currentSection = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Header with box drawing
      if (line.includes("╔") || line.includes("║") || line.includes("╚")) {
        if (line.includes("COMPREHENSIVE")) {
          const titleMatch = line.match(/║\s+(.+?)\s+║/);
          if (titleMatch) {
            html += `<h1 class="main-title">${escapeHtml(titleMatch[1])}</h1>`;
          }
        }
        continue;
      }

      // Section headers with dashes
      if (line.match(/^━+$/)) {
        if (inSection && currentSection) {
          html += `</div>`;
          inSection = false;
          currentSection = "";
        }
        continue;
      }

      // Configuration section
      if (
        line.includes("Test Configuration:") ||
        line.includes("Test Summary:") ||
        line.includes("Performance Standards:")
      ) {
        html += `<h2 class="section-header">${escapeHtml(
          line.replace(":", "")
        )}</h2>`;
        continue;
      }

      // Test Type, Platform, Device, Model, and Date
      if (
        line.startsWith("Test Type:") ||
        line.startsWith("Platform:") ||
        line.startsWith("Device:") ||
        line.startsWith("Model:") ||
        line.startsWith("Test Date:")
      ) {
        html += `<div class="config-item"><strong>${escapeHtml(
          line.split(":")[0]
        )}:</strong> ${escapeHtml(line.split(":")[1]?.trim() || "")}</div>`;
        continue;
      }

      // Test Parameters
      if (line.match(/^\s+\w+:/)) {
        const match = line.match(/^\s+(\w+[\s\w]*?):\s*(.+)$/);
        if (match) {
          html += `<div class="param-item"><span class="param-label">${escapeHtml(
            match[1]
          )}:</span> <span class="param-value">${escapeHtml(
            match[2]
          )}</span></div>`;
        }
        continue;
      }

      // Screen section header
      if (line.match(/^[A-Z][a-zA-Z\s]+$/)) {
        if (inSection) {
          html += `</div>`;
        }
        inSection = true;
        currentSection = line;
        html += `<div class="screen-section">`;
        html += `<h3 class="screen-name">${escapeHtml(line)}</h3>`;
        continue;
      }

      // Status line
      if (line.startsWith("Status:")) {
        const statusMatch = line.match(
          /Status:\s*([✅⚠️❌])\s*(PASSED|FAILED|WARNING|PASS|FAIL)/
        );
        if (statusMatch) {
          const status = statusMatch[2].toLowerCase();
          html += `<div class="status status-${status}">${escapeHtml(
            line
          )}</div>`;
        } else {
          html += `<div class="status">${escapeHtml(line)}</div>`;
        }
        continue;
      }

      // Metrics and other content
      if (line && !line.match(/^━+$/)) {
        // Check if it's a metric line with checkmark
        if (line.match(/[✅❌]\s+/)) {
          html += `<div class="metric-item">${escapeHtml(line)}</div>`;
        } else if (line.startsWith("  ")) {
          // Indented content
          html += `<div class="indented">${escapeHtml(line.trim())}</div>`;
        } else {
          html += `<div class="content-line">${escapeHtml(line)}</div>`;
        }
      }
    }

    if (inSection) {
      html += `</div>`;
    }

    return html;
  }, []);

  const handleShareReport = async () => {
    if (!report) return;
    try {
      await Share.share({
        message: report,
        title: "Stress Test Report",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share report");
    }
  };

  const handleExportPdf = useCallback(async () => {
    if (!report) {
      Alert.alert("No Report", "Please run tests first.");
      return;
    }

    try {
      const reportHtml = convertReportToHtml(report);

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                font-size: 14px;
                line-height: 1.6;
                color: #333;
                padding: 50px 40px;
                background: #fff;
              }
              
              .main-title {
                font-size: 24px;
                font-weight: 700;
                text-align: center;
                margin-bottom: 30px;
                color: #1a1a1a;
                border-bottom: 3px solid #007AFF;
                padding-bottom: 15px;
              }
              
              .section-header {
                font-size: 18px;
                font-weight: 600;
                margin-top: 30px;
                margin-bottom: 15px;
                color: #007AFF;
                border-bottom: 2px solid #e0e0e0;
                padding-bottom: 8px;
              }
              
              .config-item {
                margin: 8px 0;
                padding: 6px 0;
                font-size: 14px;
              }
              
              .param-item {
                margin: 6px 0;
                padding-left: 20px;
                font-size: 13px;
              }
              
              .param-label {
                font-weight: 600;
                color: #555;
              }
              
              .param-value {
                color: #333;
              }
              
              .screen-section {
                margin: 25px 0;
                padding: 20px;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                background: #fafafa;
                page-break-inside: avoid;
              }
              
              .screen-name {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 12px;
                color: #1a1a1a;
                border-bottom: 1px solid #ddd;
                padding-bottom: 8px;
              }
              
              .status {
                font-size: 15px;
                font-weight: 600;
                margin: 10px 0;
                padding: 8px 12px;
                border-radius: 6px;
              }
              
              .status-passed, .status-pass {
                background: #d4edda;
                color: #155724;
                border-left: 4px solid #28a745;
              }
              
              .status-failed, .status-fail {
                background: #f8d7da;
                color: #721c24;
                border-left: 4px solid #dc3545;
              }
              
              .status-warning {
                background: #fff3cd;
                color: #856404;
                border-left: 4px solid #ffc107;
              }
              
              .metric-item {
                margin: 6px 0;
                padding: 4px 0;
                font-size: 13px;
                font-family: 'Courier New', monospace;
              }
              
              .indented {
                margin: 4px 0;
                padding-left: 30px;
                font-size: 13px;
                color: #666;
              }
              
              .content-line {
                margin: 4px 0;
                font-size: 13px;
              }
              
              @media print {
                body {
                  padding: 40px 30px;
                }
                
                .screen-section {
                  page-break-inside: avoid;
                  margin: 20px 0;
                }
              }
            </style>
          </head>
          <body>
            ${reportHtml}
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Export Stress Test Report",
        });
      } else {
        Alert.alert("Sharing not available", "PDF saved to: " + uri);
      }
    } catch (error) {
      Alert.alert("PDF Export Failed", String(error));
    }
  }, [report]);

  return (
    <>
      <Container
        justify="center"
        align="center"
        gap={8}
        direction="horizontal"
        style={[
          {
            backgroundColor: background,
            borderTopColor: grayishColor,
            borderTopWidth: StyleSheet.hairlineWidth,
            bottom: Platform.OS === "android" ? bottom : 0,
            paddingVertical: SIZES.padding / 2,
            paddingHorizontal: SIZES.padding,
            zIndex: 1000,
            position: "absolute",
            left: 0,
            right: 0,
          },
        ]}
      >
        {isRunning ? (
          <>
            <ActivityIndicator size="small" color={primary} />
            <ThemedText {...textStyles.gray} style={{ flex: 1 }}>
              Testing {progress.target} ({progress.current}/{progress.total})
            </ThemedText>
            <TouchableOpacity onPress={handleCancelTest} style={{ padding: 4 }}>
              <Ionicons
                name="stop-circle-outline"
                size={24}
                color={colors.errorColor}
              />
            </TouchableOpacity>
          </>
        ) : (
          <Container direction="horizontal" gap={8} align="center">
            <TouchableOpacity
              onPress={handleRunTest}
              disabled={isRunning}
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Ionicons name="speedometer-outline" size={20} color={primary} />
              <ThemedText {...textStyles.body} style={{ color: primary }}>
                Run {stressMode ? "Stress" : "Performance"} Test
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStressMode(!stressMode)}
              style={{
                padding: 4,
                borderRadius: 4,
                opacity: stressMode ? 1 : 0.5,
              }}
            >
              <Ionicons
                name={stressMode ? "flash" : "flash-outline"}
                size={18}
                color={stressMode ? primary : grayishColor}
              />
            </TouchableOpacity>
          </Container>
        )}
      </Container>

      <Modal
        visible={isResultsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsResultsModalVisible(false)}
        statusBarTranslucent
      >
        <Container
          flex={1}
          justify="center"
          align="center"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            padding: SIZES.padding,
          }}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsResultsModalVisible(false)}
          />
          <Container
            direction="vertical"
            flex={1}
            style={{
              width: "100%",
              maxWidth: 600,
              maxHeight: "90%",
              backgroundColor: background,
              borderRadius: 20,
              overflow: "hidden",
              ...Platform.select({
                ios: {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                },
                android: {
                  elevation: 10,
                },
              }),
            }}
          >
            {/* Header */}
            <Header
              addStatusBarPadding={false}
              showBackButton={false}
              left={
                <Container
                  direction="horizontal"
                  align="center"
                  gap={12}
                  style={{
                    flex: 1,
                    width: "100%",
                  }}
                >
                  <Avatar
                    icon={stressMode ? "flash" : "speedometer-outline"}
                    iconSize={0.5}
                    size={40}
                    shape="rounded"
                    backgroundColor={primary + "20"}
                    color={text}
                  />
                </Container>
              }
              center={
                <ThemedText {...textStyles.subtitle} size="lg">
                  {stressMode ? "Stress" : "Performance"} Test Report
                </ThemedText>
              }
              action={
                <IconButton
                  variant="secondary"
                  size="md"
                  onPress={() => setIsResultsModalVisible(false)}
                >
                  <Ionicons name="close" color={text} />
                </IconButton>
              }
              headerStyle={{
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: grayishColor,
              }}
            />

            {/* Content */}
            <Container flex={1}>
              <ScrollView
                contentContainerStyle={{
                  padding: SIZES.padding,
                  flexGrow: 1,
                }}
                showsVerticalScrollIndicator={true}
              >
                {report ? (
                  <Container gap={4}>{formatReportForUI(report)}</Container>
                ) : (
                  <ThemedText {...textStyles.gray}>
                    No report available
                  </ThemedText>
                )}
              </ScrollView>
            </Container>

            {/* Footer */}
            <Container
              direction="horizontal"
              gap={16}
              style={{
                padding: SIZES.padding,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: grayishColor,
                backgroundColor: grayishColor + "20",
              }}
            >
              <IconButton
                variant="secondary"
                size="md"
                onPress={handleCopyToClipboard}
              >
                <Ionicons name="copy-outline" size={20} color={text} />
              </IconButton>
              <Button
                title="Download PDF"
                onPress={handleExportPdf}
                style={{ flex: 1 }}
              />
            </Container>
          </Container>
        </Container>
      </Modal>
    </>
  );
}
