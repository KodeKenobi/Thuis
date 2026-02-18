import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  runComprehensiveTest,
  generateComprehensiveReport,
  exportReport,
} from "@/utils/stress-test-runner";
import { Alert } from "react-native";
import { ThemedText } from "../ui/themed-text";

export function StressTestFloatingButton() {
  if (!__DEV__) {
    return null;
  }

  const { primary, background, text } = useColors();
  const [isRunning, setIsRunning] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    target: "",
  });
  const [report, setReport] = useState<string>("");

  const handleRunTest = async () => {
    setIsRunning(true);
    setIsModalVisible(true);
    setReport("");
    setProgress({ current: 0, total: 0, target: "" });

    try {
      const results = await runComprehensiveTest((current, total, target) => {
        setProgress({ current, total, target });
      });

      const generatedReport = generateComprehensiveReport(results);
      setReport(generatedReport);
      console.log(generatedReport);
    } catch (error) {
      console.error("[StressTest] Error:", error);
      Alert.alert("Test Error", String(error));
    } finally {
      setIsRunning(false);
    }
  };

  const handleExport = async () => {
    if (!report) {
      Alert.alert("No Report", "Please run tests first.");
      return;
    }

    try {
      await exportReport(report);
      Alert.alert("Success", "Report exported successfully!");
    } catch (error) {
      Alert.alert("Export Failed", String(error));
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: primary }]}
        onPress={handleRunTest}
        disabled={isRunning}
      >
        <Ionicons name="speedometer" size={24} color="white" />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          // Don't allow closing during test
          if (!isRunning) {
            setIsModalVisible(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: text }]}>
                Stress Test Runner
              </ThemedText>
              {!isRunning && (
                <TouchableOpacity
                  onPress={() => setIsModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={text} />
                </TouchableOpacity>
              )}
            </View>

            {isRunning ? (
              <View style={styles.progressContainer}>
                <ActivityIndicator size="large" color={primary} />
                <ThemedText style={[styles.progressText, { color: text }]}>
                  Testing {progress.target}...
                </ThemedText>
                <ThemedText style={[styles.progressSubtext, { color: text }]}>
                  {progress.current} / {progress.total}
                </ThemedText>
              </View>
            ) : report ? (
              <View style={styles.reportContainer}>
                <ScrollView style={styles.reportScroll}>
                  <ThemedText style={[styles.reportText, { color: text }]}>
                    {report}
                  </ThemedText>
                </ScrollView>
                <TouchableOpacity
                  style={[styles.exportButton, { backgroundColor: primary }]}
                  onPress={handleExport}
                >
                  <ThemedText style={styles.exportButtonText}>📄 Export Report</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <ThemedText style={[styles.emptyText, { color: text }]}>
                  Click "Run Tests" to start
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 9999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  progressContainer: {
    alignItems: "center",
    padding: 40,
  },
  progressText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  progressSubtext: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.7,
  },
  reportContainer: {
    flex: 1,
  },
  reportScroll: {
    maxHeight: 400,
    marginBottom: 16,
  },
  reportText: {
    fontSize: 11,
    fontFamily: "monospace",
    lineHeight: 16,
  },
  exportButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  exportButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
  },
});
