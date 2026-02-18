import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
  ScrollView,
  View,
  useWindowDimensions,
  LayoutChangeEvent,
} from "react-native";
import { Button, ButtonProps } from "./button";
import { Container } from "./container";
import { ThemedText } from "./themed-text";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

interface IConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  header?: React.ReactNode;
  content: string | React.ReactNode;
  footer?: React.ReactNode;
  cancel?: ButtonProps;
  confirm?: ButtonProps;
  allowOutsideClose?: boolean;
  style?: StyleProp<ViewStyle>;
}

const ConfirmationModal: React.FC<IConfirmationModalProps> = ({
  visible,
  onClose,
  header,
  content,
  footer,
  cancel,
  confirm,
  allowOutsideClose = true,
  style,
}) => {
  const { colors: { cardBg } } = useCorporateBranding();
  const { height: windowHeight } = useWindowDimensions();
  const [internalVisible, setInternalVisible] = useState(visible);
  const [contentHeight, setContentHeight] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxHeight = useMemo(() => windowHeight * 0.8, [windowHeight]);

  useEffect(() => {
    if (visible) {
      timeoutRef.current = setTimeout(() => {
        setInternalVisible(true);
      }, 30);
    } else {
      setInternalVisible(false);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [visible]);

  // useEffect(() => {
  //   return () => {
  //     if (internalVisible) {
  //       onClose?.();
  //     }
  //   };
  // }, [internalVisible, onClose]);

  const handleCancel = useCallback(() => {
    cancel?.onPress?.();
    onClose();
  }, [cancel, onClose]);

  const handleConfirm = useCallback(() => {
    confirm?.onPress?.();
    onClose();
  }, [confirm, onClose]);

  const shouldShowFooter = useMemo(() => {
    return footer || cancel || confirm;
  }, [footer, cancel, confirm]);

  const renderContent = useCallback(() => {
    if (typeof content === "string") {
      return (
        <ThemedText
          style={{
            width: "100%",
            textAlign: "center",
          }}
        >
          {content}
        </ThemedText>
      );
    }
    return content;
  }, [content]);

  const renderFooter = useCallback(() => {
    if (footer) {
      return footer;
    }

    if (cancel || confirm) {
      return (
        <Container direction="horizontal" justify="center" align="center" gap={30}>
          {cancel && (
            <Button
              variant="link"
              title={cancel?.title || "Cancel"}
              onPress={handleCancel}
              loading={cancel.loading}
              style={{
                height: "auto",
                minHeight: "auto",
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            />
          )}
          {confirm && (
            <Button
              variant="link"
              title={confirm?.title || "Confirm"}
              onPress={handleConfirm}
              loading={confirm.loading}
              style={{
                height: "auto",
                minHeight: "auto",
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            />
          )}
        </Container>
      );
    }

    return null;
  }, [footer, cancel, confirm, handleCancel, handleConfirm]);

  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setContentHeight(height);
  }, []);

  const containerHeight = useMemo(() => {
    return Math.min(contentHeight, maxHeight);
  }, [contentHeight, maxHeight]);

  if (!internalVisible) return null;

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <Container
        justify="center"
        align="center"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0, 0, 0, 0.5)" },
        ]}
      >
        {allowOutsideClose && (
          <Pressable
            style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
            onPress={onClose}
          />
        )}
        <Container
          direction="vertical"
          style={{
            backgroundColor: cardBg,
            borderRadius: 12,
            maxWidth: 400,
            width: 275,
            maxHeight: maxHeight,
            height: containerHeight,
            zIndex: 2,
            ...(StyleSheet.flatten(style) || {}),
          }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            <Container
              onLayout={handleContentLayout}
              style={{ paddingVertical: 20 }}
              gap={12}
            >
              {header && (
                <Container
                  direction="vertical"
                  style={{
                    paddingBottom: 10,
                  }}
                >
                  {typeof header === "string" ? (
                    <ThemedText
                      style={{
                        fontSize: 18,
                        fontWeight: "600",
                        textAlign: "center",
                      }}
                    >
                      {header}
                    </ThemedText>
                  ) : (
                    header
                  )}
                </Container>
              )}

              <Container
                direction="vertical"
                style={{
                  paddingHorizontal: 20,
                }}
              >
                {renderContent()}
              </Container>

              {shouldShowFooter && (
                <Container
                  direction="vertical"
                  justify="center"
                  style={{
                    paddingHorizontal: 20,
                  }}
                >
                  {renderFooter()}
                </Container>
              )}
            </Container>
          </ScrollView>
        </Container>
      </Container>
    </Modal>
  );
};

export default ConfirmationModal;
