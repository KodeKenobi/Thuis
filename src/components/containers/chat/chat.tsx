import React, { useMemo } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { WebView } from "react-native-webview";

interface ChatWebViewContainerProps {
  config: IChatConfig;
  onLcwEvent?: (evt: "minimized" | "closed") => void;
  style?: ViewStyle;
  userName?: string;
  contract?: any;
}

const buildHtml = (cfg: IChatConfig, userName?: string, contract?: any) => `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover"/>
<title>livechat-ondersteuning</title>
<style>html,body,#root{height:100%;margin:0;background:#fff;}</style>
</head>
<body>
<div id="root"></div>
<script>
(function(){
  var s = document.createElement('script');
  s.src = 'https://ocprodpubliceurgs.blob.core.windows.net/livechatwidget/scripts/LiveChatBootstrapper.js';
  s.id = 'Microsoft_Omnichannel_LCWidget';

  s.dataset.orgId = '${cfg.LIVECHAT_ORG_ID}';
  s.dataset.orgUrl = '${cfg.LIVECHAT_ORG_URL}';
  s.dataset.appId = '${cfg.LIVECHAT_APP_ID}';
  s.dataset.lcwVersion = 'prod';
  s.dataset.renderMobile = 'true';
  s.dataset.hideChatButton = 'true';

  document.body.appendChild(s);

  window.addEventListener('lcw:ready', function(){
    try{
      var w = window.Microsoft?.Omnichannel?.LiveChatWidget;
      if (w?.SDK?.setCustomerContext) {
        w.SDK.setCustomerContext({
          name: "${userName ?? ""}",
          contract: "${contract?.address ?? ""}",
          zipcode: "${contract?.zipcode ?? ""}",
          residence: "${contract?.residence ?? ""}"
        });
      }
      if (w?.SDK?.startChat) { w.SDK.startChat(); }
      else if (w?.API?.open) { w.API.open(); }
    }catch(e){}
  });

  function post(m){ try{ window.ReactNativeWebView.postMessage(m); }catch(e){} }
  window.addEventListener('lcw:minimized', () => post('lcw:minimized'));
  window.addEventListener('lcw:closed',    () => post('lcw:closed'));
})();
</script>
</body>
</html>`;

export const ChatWebViewContainer: React.FC<ChatWebViewContainerProps> = ({
  config,
  onLcwEvent,
  style,
  userName,
  contract,
}) => {
  const html = useMemo(
    () => buildHtml(config, userName, contract),
    [config, userName, contract]
  );

  return (
    <View style={[styles.root, style]}>
      <WebView
        originWhitelist={["*"]}
        source={{
          html,
          baseUrl: "https://ocprodpubliceurgs.blob.core.windows.net",
        }}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        allowFileAccess={false}
        allowsInlineMediaPlayback
        startInLoadingState
        androidLayerType="software"
        mixedContentMode="always"
        allowUniversalAccessFromFileURLs
        onMessage={(e) => {
          const msg = e.nativeEvent.data;
          if (msg === "lcw:minimized") onLcwEvent?.("minimized");
          if (msg === "lcw:closed") onLcwEvent?.("closed");
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 420,
  },
});
