import React, { useState, useMemo } from "react";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFetchMessageById } from "@/service/message";
import { usePdfShare } from "@/hooks/use-pdf-share";
import ScreenLoader from "@/components/ui/screen-loader";
import { IconButton } from "@/components/ui/icon-button";
import { EmptyData } from "@/components/ui/empty-data";
import {
  Platform,
  View,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import InnerScreenTemplate from "@/components/templates/inner-screen-template";
import { WebView } from "react-native-webview";
import { Container } from "@/components/ui/container";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PdfViewer } from "@/components/ui/pdf-viewer";
import { ThemedText } from "@/components/ui/themed-text";

export interface PostDetailContainerProps {
  id: string;
  subject?: string;
}

const PostDetailContainer: React.FC<PostDetailContainerProps> = ({
  id,
  subject,
}) => {
  const [loading, setLoading] = useState(false);
  const [isRefetching, setRefetching] = useState(false);

  const {
    data: base64,
    isLoading: isMessageLoading,
    isError: isMessageError,
    refetch: messageRefetch,
  } = useFetchMessageById({ id: id ?? "", options: { enabled: !!id } });

  const { colors: { background } } = useCorporateBranding();
  const { bottom } = useSafeAreaInsets();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  const {
    fileUri,
    handleShare,
    isLoading: isPdfLoading,
  } = usePdfShare(base64 ?? undefined, subject ?? id);

  const isLoading = loading || isMessageLoading || isPdfLoading;

  
  const pdfHtml = useMemo(() => {
    if (!base64) return null;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=2.0, user-scalable=yes">
          <style>
            html, body { margin: 0; padding: 0; background: ${background}; -webkit-overflow-scrolling: touch; }
            #pdf-container { 
              width: 100%; 
              min-height: 100vh; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              padding: 20px 0;
            }
            .page-container { 
              margin-bottom: 15px; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.08);
              background-color: white;
              overflow: hidden;
              width: 94%; 
              border-radius: 4px;
            }
            canvas { 
              width: 100% !important; 
              height: auto !important; 
              display: block;
            }
            #loading { 
              padding: 40px; 
              text-align: center; 
              color: #666; 
              font-family: -apple-system, system-ui; 
              font-size: 16px;
            }
          </style>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
        </head>
        <body>
          <div id="pdf-container">
            <div id="loading">Bericht wordt geladen...</div>
          </div>
          <script>
            const pdfData = '${base64}';
            const container = document.getElementById('pdf-container');
            const loadingEl = document.getElementById('loading');
            
            // --- QUALITY CONFIGURATION ---
            // 1. Get base device ratio (e.g., 2 for old iPhones, 3 for new ones)
            const deviceRatio = window.devicePixelRatio || 1;
            
            // 2. SUPERSAMPLING FACTOR
            // Multiplies the resolution by 1.5x or 2.0x for crisp text.
            // 1.5 is a sweet spot for quality vs memory.
            const qualityMultiplier = 1.5; 
            
            // 3. Cap total scale to prevent crashing on large pages (max 5.0x zoom equivalent)
            const finalScaleFactor = Math.min(deviceRatio * qualityMultiplier, 5.0);

            pdfjsLib.getDocument({data: atob(pdfData)}).promise.then(function(pdf) {
              loadingEl.style.display = 'none';
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'totalPages',
                totalPages: pdf.numPages
              }));
              
              for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                pdf.getPage(pageNum).then(function(page) {
                  
                  // Calculate width to fit screen (accounting for 94% CSS width)
                  const unscaledViewport = page.getViewport({scale: 1});
                  const containerWidth = window.innerWidth * 0.94; 
                  const layoutScale = containerWidth / unscaledViewport.width;

                  // Render Viewport at High Resolution
                  const viewport = page.getViewport({ scale: layoutScale * finalScaleFactor });
                  
                  const pageContainer = document.createElement('div');
                  pageContainer.className = 'page-container';
                  
                  const canvas = document.createElement('canvas');
                  canvas.height = viewport.height;
                  canvas.width = viewport.width;
                  
                  // IMPORTANT: Force white background to allow 'alpha: false' optimization
                  const ctx = canvas.getContext('2d', { alpha: false });
                  ctx.fillStyle = 'white';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  
                  // Enable High Quality Image Smoothing
                  ctx.imageSmoothingEnabled = true;
                  ctx.imageSmoothingQuality = 'high';

                  page.render({
                    canvasContext: ctx,
                    viewport: viewport
                  }).promise.then(function() {
                    pageContainer.appendChild(canvas);
                    container.appendChild(pageContainer);
                    
                    const observer = new IntersectionObserver(function(entries) {
                      entries.forEach(function(entry) {
                        if (entry.isIntersecting) {
                          window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'currentPage',
                            currentPage: pageNum
                          }));
                        }
                      });
                    }, { threshold: 0.15 });
                    
                    observer.observe(pageContainer);
                  });
                });
              }
            }).catch(function(error) {
              console.error(error);
              loadingEl.textContent = 'Fout bij laden PDF';
            });
          </script>
        </body>
      </html>
    `;
  }, [base64, background]);

  return (
    <InnerScreenTemplate
      header={{
        title: subject || "Bericht",
        backDestination: () => router.back(),
        action: (
          <IconButton size="sm" variant="secondary" onPress={handleShare}>
            <Ionicons name="download-outline" />
          </IconButton>
        ),
      }}
      scrollable={false}
    >
      {isLoading && (
        <Container flex={1} justify="center">
          <ScreenLoader />
        </Container>
      )}

      {isMessageError && !isLoading && (
        <Container flex={1} justify="center">
          <EmptyData
            title="Kan het bericht niet laden"
            description="Probeer het later opnieuw"
          />
        </Container>
      )}

      {!isLoading && !isMessageError && (
        <>
          {Platform.OS === "ios" && pdfHtml ? (
            <WebView
              source={{ html: pdfHtml }}
              style={{ flex: 1, backgroundColor: background }}
              javaScriptEnabled={true}
              // Increased memory limit for iOS WebView
              contentMode="mobile"
              showsVerticalScrollIndicator={true}
              bounces={true}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={() => {
                    setRefetching(true);
                    messageRefetch().finally(() => setRefetching(false));
                  }}
                />
              }
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === "totalPages") {
                    setTotalPages(data.totalPages);
                  } else if (data.type === "currentPage") {
                    setCurrentPage(data.currentPage);
                  }
                } catch (e) {}
              }}
            />
          ) : fileUri && Platform.OS !== "web" ? (
            <PdfViewer
              source={{ uri: fileUri }}
              style={{ flex: 1 }}
              onPageChanged={(page: number, numberOfPages: number) => {
                setCurrentPage(page);
                setTotalPages(page);
              }}
            />
          ) : (
            <Container flex={1} justify="center">
              <EmptyData title="PDF niet beschikbaar" />
            </Container>
          )}
        </>
      )}

      {totalPages > 0 && (
        <View style={[styles.pageCounter, { bottom: bottom + 20 }]}>
          <ThemedText style={styles.pageCounterText}>
            {currentPage} / {totalPages}
          </ThemedText>
        </View>
      )}
    </InnerScreenTemplate>
  );
};

const styles = StyleSheet.create({
  pageCounter: {
    position: "absolute",
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 1000,
  },
  pageCounterText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default PostDetailContainer;