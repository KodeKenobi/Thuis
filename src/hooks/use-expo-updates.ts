import { useState, useCallback, useEffect, useRef } from "react";
import * as Updates from "expo-updates";
import { Alert, Platform, Linking, AppState } from "react-native";
import Constants from "expo-constants";
import { getAppInfoFromTheStore, shouldUpdateApp } from "@/utils/version-check";

interface UseExpoUpdatesReturn {
  isUpdateAvailable: boolean;
  isDownloading: boolean;
  checkForUpdates: () => Promise<void>;
  checkForStoreUpdate: () => Promise<void>;
  isNewStoreVersionAvailable: boolean;
  logs: Array<{
    timestamp: string;
    message: string;
    type: "info" | "error" | "success";
  }>;
}

export const useExpoUpdates = (): UseExpoUpdatesReturn => {
  // Use Updates.useUpdates() hook for real-time update state
  const { isUpdateAvailable: updateAvailableFromHook } = Updates.useUpdates();

  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isNewStoreVersionAvailable, setIsNewStoreVersionAvailable] =
    useState(false);
  const [hasShownUpdateAlert, setHasShownUpdateAlert] = useState(false);
  const appState = useRef(AppState.currentState);
  const lastStoreVersionCheck = useRef(0);
  const [logs, setLogs] = useState<
    Array<{
      timestamp: string;
      message: string;
      type: "info" | "error" | "success";
    }>
  >([]);

  const addLog = useCallback(
    (message: string, type: "info" | "error" | "success" = "info") => {
      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString(),
          message,
          type,
        },
      ]);
    },
    []
  );

  const openAppStore = useCallback(async () => {
    const iosAppId = "com.ThuisApp";
    const androidPackage = "com.Thuis.App";

    const getStoreUrl = () => {
      if (Platform.OS === "ios") {
        return `itms-apps://apps.apple.com/app/id${iosAppId}`;
      }
      return `market://details?id=${androidPackage}`;
    };

    const getWebUrl = () => {
      if (Platform.OS === "ios") {
        return `https://apps.apple.com/app/id${iosAppId}`;
      }
      return `https://play.google.com/store/apps/details?id=${androidPackage}`;
    };

    const tryOpenUrl = async (url: string) => {
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          return true;
        }
      } catch {
        // Fallback to web URL
      }
      return false;
    };

    const opened = await tryOpenUrl(getStoreUrl());
    if (!opened) {
      await Linking.openURL(getWebUrl());
    }
  }, []);

  const handleReload = useCallback(() => {
    if (!Updates.isEnabled) {
      console.warn("[Updates] Updates not enabled, cannot reload");
      Alert.alert(
        "Waarschuwing",
        "Updates zijn niet ingeschakeld in deze build."
      );
      return;
    }

    console.log("[Updates] Reloading app to apply update...");
    addLog("Reloading app to apply update...", "info");

    // Updates.reloadAsync() immediately reloads the app, so code after it won't execute
    // We need to call it without awaiting or chaining
    Updates.reloadAsync().catch((error) => {
      // This will only execute if reload fails (which is rare)
      console.error("[Updates] Reload failed:", error);
      addLog(`Reload failed: ${error?.message || String(error)}`, "error");
      Alert.alert(
        "Fout",
        "Kon de app niet herstarten. De update wordt toegepast bij de volgende keer dat u de app opent.",
        [{ text: "OK" }]
      );
    });
  }, [addLog]);

  const showUpdateAlert = useCallback(
    (updateMessage?: string) => {
      const defaultMessage =
        "We hebben nieuwe animaties of belangrijke updates toegevoegd die klaar zijn voor gebruik! De app heeft een snelle refresh nodig om deze updates te laden (geen download vereist).";

      const alertMessage = updateMessage
        ? `${updateMessage}\n\n${defaultMessage}`
        : defaultMessage;

      Alert.alert("Update beschikbaar", alertMessage, [
        {
          text: "Later",
          style: "cancel",
          onPress: () => {
            setIsUpdateAvailable(false);
          },
        },
        {
          text: "Vernieuwen",
          isPreferred: true,
          onPress: handleReload,
        },
      ]);
    },
    [handleReload]
  );

  const handleUpdate = useCallback(() => {
    // Don't show OTA update if store update is available (store updates take priority)
    if (isNewStoreVersionAvailable) {
      setIsDownloading(false);
      return;
    }

    // Reset downloading state if no update is available
    if (!updateAvailableFromHook) {
      setIsDownloading(false);
      return;
    }

    // Only process if update is available and we haven't shown it yet
    if (!hasShownUpdateAlert) {
      setIsUpdateAvailable(true);
      setIsDownloading(true);

      const downloadStart = "Update available, starting download...";
      console.log("[Updates]", downloadStart);
      addLog(downloadStart, "info");

      // Get update message from manifest if available
      const manifest = Updates.manifest as any;
      const updateMessage =
        manifest?.extra?.expoConfig?.updates?.message ||
        manifest?.message ||
        manifest?.metadata?.updateMessage;

      Updates.fetchUpdateAsync()
        .then((result) => {
          const downloadComplete = `Download complete: ${
            result.isNew ? "New update ready" : "No new update"
          }`;
          console.log("[Updates]", downloadComplete);
          addLog(downloadComplete, result.isNew ? "success" : "info");

          setIsDownloading(false);

          if (result.isNew) {
            setHasShownUpdateAlert(true);

            // Get update message from manifest after fetching (message is in the update metadata)
            const fetchedManifest = Updates.manifest as any;
            const fetchedMessage =
              fetchedManifest?.message ||
              fetchedManifest?.metadata?.updateMessage ||
              fetchedManifest?.extra?.expoConfig?.updates?.message ||
              updateMessage;

            showUpdateAlert(fetchedMessage);
          } else {
            // Update was already downloaded or not new
            setIsUpdateAvailable(false);
          }
        })
        .catch((downloadError: any) => {
          setIsDownloading(false);
          const errorMsg = `Error downloading update: ${
            downloadError?.message || String(downloadError)
          }`;
          console.error("[Updates]", errorMsg);
          addLog(errorMsg, "error");

          // Check if error indicates a new native version is required
          const errorMessage = downloadError?.message || "";
          const requiresNewVersion =
            errorMessage.includes("runtime version") ||
            errorMessage.includes("native") ||
            errorMessage.includes("NEW_UPDATE_AVAILABLE");

          if (requiresNewVersion) {
            Alert.alert(
              "App update vereist",
              "Er is een nieuwe versie van de app beschikbaar in de App Store/Play Store. Deze update bevat belangrijke verbeteringen en moet via de store worden geïnstalleerd.",
              [
                {
                  text: "Annuleren",
                  style: "cancel",
                  onPress: () => {
                    setIsUpdateAvailable(false);
                    setHasShownUpdateAlert(false);
                  },
                },
                {
                  text: "Naar store",
                  onPress: openAppStore,
                },
              ],
              { cancelable: false }
            );
          } else {
            Alert.alert(
              "Fout",
              "Er is een fout opgetreden bij het downloaden van de update. Probeer het later opnieuw."
            );
          }
        });
    }
  }, [
    updateAvailableFromHook,
    hasShownUpdateAlert,
    isNewStoreVersionAvailable,
    openAppStore,
    addLog,
    showUpdateAlert,
  ]);

  const checkForUpdates = useCallback(() => {
    if (__DEV__) {
      console.log("[Updates] Skipping update check in development");
      return Promise.resolve();
    }

    if (!Updates.isEnabled) {
      console.log("[Updates] Updates not enabled");
      return Promise.resolve();
    }

    const logMessage = `Checking for updates... Channel: ${Updates.channel}, Runtime: ${Updates.runtimeVersion}`;
    console.log("[Updates]", logMessage);
    addLog(logMessage, "info");

    return Updates.checkForUpdateAsync()
      .then(() => {
        const checkResult = "Update check completed";
        console.log("[Updates]", checkResult);
        addLog(checkResult, "info");
      })
      .catch((error: any) => {
        const errorMsg = `Error checking for updates: ${
          error?.message || String(error)
        }`;
        console.error("[Updates]", errorMsg);
        addLog(errorMsg, "error");

        // Check if error indicates a new native version is required
        const errorMessage = error?.message || "";
        const requiresNewVersion =
          errorMessage.includes("runtime version") ||
          errorMessage.includes("native") ||
          errorMessage.includes("NEW_UPDATE_AVAILABLE");

        if (requiresNewVersion) {
          Alert.alert(
            "App update vereist",
            "Er is een nieuwe versie van de app beschikbaar in de App Store/Play Store. Deze update bevat belangrijke verbeteringen en moet via de store worden geïnstalleerd.",
            [
              {
                text: "Annuleren",
                style: "cancel",
              },
              {
                text: "Naar store",
                onPress: openAppStore,
              },
            ],
            { cancelable: false }
          );
        }
      });
  }, [openAppStore, addLog]);

  const checkForStoreUpdate = useCallback(() => {
    if (__DEV__) {
      console.log("[Store Update] Skipping store version check in development");
      return Promise.resolve();
    }

    const logMessage = "Checking store for new version...";
    console.log("[Store Update]", logMessage);
    addLog(logMessage, "info");

    return getAppInfoFromTheStore()
      .then((result) => {
        const newestVersion = result?.version;
        const installedVersion = Constants.expoConfig?.version;

        if (installedVersion && newestVersion) {
          const needsUpdate = shouldUpdateApp(installedVersion, newestVersion);

          if (needsUpdate) {
            setIsNewStoreVersionAvailable(true);
            const updateMsg = `New store version available: ${newestVersion} (installed: ${installedVersion})`;
            console.log("[Store Update]", updateMsg);
            addLog(updateMsg, "success");

            Alert.alert(
              "Nieuwe app versie beschikbaar",
              `Er is een nieuwe versie van de app beschikbaar in de ${
                Platform.OS === "ios" ? "App Store" : "Play Store"
              }. Deze update bevat belangrijke verbeteringen en moet via de store worden geïnstalleerd.`,
              [
                {
                  text: "Annuleren",
                  style: "cancel",
                  onPress: () => setIsNewStoreVersionAvailable(false),
                },
                {
                  text: "Naar store",
                  onPress: openAppStore,
                },
              ],
              { cancelable: false }
            );
          } else {
            const noUpdateMsg = `App is up to date (${installedVersion})`;
            console.log("[Store Update]", noUpdateMsg);
            addLog(noUpdateMsg, "info");
          }
        } else {
          const errorMsg = `Could not check store version. Installed: ${installedVersion}, Store: ${newestVersion}`;
          console.log("[Store Update]", errorMsg);
          addLog(errorMsg, "error");
        }
      })
      .catch((error: any) => {
        const errorMsg = `Error checking store version: ${
          error?.message || String(error)
        }`;
        console.error("[Store Update]", errorMsg);
        addLog(errorMsg, "error");
      });
  }, [openAppStore, addLog]);

  // Handle update when updateAvailableFromHook changes
  useEffect(() => {
    if (__DEV__) return;
    handleUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateAvailableFromHook, hasShownUpdateAlert]);

  // Check for store updates on mount
  useEffect(() => {
    if (__DEV__) return;
    checkForStoreUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check for both OTA and store updates when app becomes active
  useEffect(() => {
    if (__DEV__) return;

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      // Reset alert flag when app comes back from background
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        setHasShownUpdateAlert(false);

        // Check for store updates first (they take priority)
        // Only check once per hour to avoid spam
        const now = Date.now();
        if (now - lastStoreVersionCheck.current > 1000 * 60 * 60) {
          checkForStoreUpdate();
          lastStoreVersionCheck.current = now;
        }

        // Then check for OTA updates
        checkForUpdates();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isUpdateAvailable,
    isDownloading,
    checkForUpdates,
    checkForStoreUpdate,
    isNewStoreVersionAvailable,
    logs,
  };
};
