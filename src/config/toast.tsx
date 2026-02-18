import ToastAlert from "@/components/ui/toaster";
import { GestureResponderEvent } from "react-native";
import Toast from "react-native-toast-message";

interface ToastProps {
  type: "success" | "error" | "warning" | "custom";
  message: string;
  title?: string;
  toastId?: string;
  onPress?: (event: GestureResponderEvent) => void;
}

interface ToastConfigProps {
  props: ToastProps;
}

interface NotifyDynamicToastProps {
  props: ToastProps;
}

export const toastConfig = {
  toast: ({ props }: ToastConfigProps) => {
    return <ToastAlert key={props?.toastId} toast={props} />;
  },
};

export const notifyToast = ({ props }: NotifyDynamicToastProps) => {
  Toast.hide(); // hide any existing toast

  setTimeout(() => {
    Toast.show({
      type: "toast",
      props: { ...props, toastId: Date.now().toString() },
      position: "top",
      topOffset: 0,
      visibilityTime: 5000,
      autoHide: true,
    });
  }, 50); // short delay ensures the hide is processed
};

export const toastModalConfig = {
  toast: ({ props }: ToastConfigProps) => {
    return <ToastAlert key={props?.toastId} toast={props} />;
  },
};

export const notifyModalToast = ({ props }: NotifyDynamicToastProps) => {
  Toast.hide(); // hide any existing toast

  setTimeout(() => {
    Toast.show({
      type: "toast",
      props: { ...props, toastId: Date.now().toString() },
      position: "top",
      topOffset: -150,
      visibilityTime: 5000,
      autoHide: true,
    });
  }, 50); // short delay ensures the hide is processed
};
