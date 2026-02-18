import React, { useMemo, useRef, useState, useCallback } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
import { useRouter } from "expo-router";
import InnerScreenTemplate from "@/components/templates/inner-screen-template";
import ScreenLoader from "@/components/ui/screen-loader";
import { isValidHttpUrl } from "@/utils";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

export default function PolicyContainer() {
  const router = useRouter();

  const { corporateInfo } = useCorporateBranding();

  const privacyPolicy = useMemo(() => {
    return corporateInfo?.privacyPolicy;
  }, [corporateInfo]);

  const src = isValidHttpUrl(privacyPolicy) ? privacyPolicy! : null;

  const webRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);

  const onNavChange = useCallback((navState: any) => {
    setCanGoBack(Boolean(navState?.canGoBack));
  }, []);

  const onBack = () => {
    if (canGoBack) {
      webRef.current?.goBack();
    } else {
      router.back();
    }
  };

  return (
    <InnerScreenTemplate
      scrollable={false}
      header={{
        title: "Privacybeleid",
        backDestination: onBack,
      }}
    >
      {src ? (
        <View style={{ flex: 1 }}>
          <WebView
            ref={webRef}
            source={{ uri: src }}
            onNavigationStateChange={onNavChange}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => setLoading(false)}
            startInLoadingState
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            originWhitelist={["*"]}
            bounces={false}
            style={{ flex: 1 }}
          />

          {loading && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
              }}
            >
              <ScreenLoader />
            </View>
          )}
        </View>
      ) : (

        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        />
      )}
    </InnerScreenTemplate>
  );
}
