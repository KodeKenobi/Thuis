import React, { useState, useEffect } from "react";
import {
  Platform,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetContent,
  BottomSheetHeader,
} from "./bottom-sheet";
import { format } from "date-fns";
import { Container } from "./container";
import { Button } from "./button";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Label from "./label";
import { ThemedText } from "./themed-text";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
  mode?: "date" | "time" | "datetime";
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  variant?: "background" | "outline";
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  mode = "date",
  label,
  placeholder = "Kies een datum",
  error,
  required,
  variant = "background",
}) => {
  const { colors: { theme, inputBg, grayishColor } } = useCorporateBranding();
  const { bottom } = useSafeAreaInsets();
  const [show, setShow] = useState(
    Platform.OS === "android" ? false : undefined
  );

  // Initialize tempDate with a valid date, not undefined
  const getInitialDate = () => {
    // Always start with current date as base
    const now = new Date();

    // If we have a valid value prop, use it
    if (value && !isNaN(value.getTime()) && value.getTime() > 0) {
      return new Date(value);
    }

    // Otherwise use current date, but respect constraints
    if (minDate && now < minDate) {
      return new Date(minDate);
    }
    if (maxDate && now > maxDate) {
      return new Date(maxDate);
    }

    return now;
  };

  const [tempDate, setTempDate] = useState<Date>(() => {
    const initialDate = getInitialDate();
    return initialDate;
  });
  const [androidMode, setAndroidMode] = useState<"date" | "time">("date");
  const [pendingDate, setPendingDate] = useState<Date | undefined>(undefined);

  // Update tempDate when value prop changes
  useEffect(() => {
    if (value && !isNaN(value.getTime()) && value.getTime() > 0) {
      setTempDate(new Date(value));
    }
  }, [value]);

  // Safety check: ensure tempDate is always valid
  useEffect(() => {
    if (isNaN(tempDate.getTime()) || tempDate.getTime() <= 0) {
      setTempDate(new Date());
    }
  }, [tempDate]);

  const displayValue = value
    ? mode === "time"
      ? format(value, "HH:mm")
      : mode === "datetime"
      ? format(value, "dd-MM-yyyy HH:mm")
      : format(value, "dd-MM-yyyy")
    : "";

  // Android: handle date and datetime
  const handleAndroidChange = (event: any, selectedDate?: Date) => {
    if (event?.type === "dismissed") {
      setShow(false);
      setAndroidMode("date");
      setPendingDate(undefined);
      return;
    }
    if (mode === "datetime") {
      if (androidMode === "date" && selectedDate) {
        // Save date, show time picker
        setPendingDate(selectedDate);
        setAndroidMode("time");
        setShow(true);
      } else if (androidMode === "time" && selectedDate) {
        // Combine date and time
        const date = pendingDate || getInitialDate();
        const combined = new Date(date);
        combined.setHours(selectedDate.getHours());
        combined.setMinutes(selectedDate.getMinutes());
        combined.setSeconds(0);
        combined.setMilliseconds(0);
        onChange?.(combined);
        setTempDate(combined);
        setShow(false);
        setAndroidMode("date");
        setPendingDate(undefined);
      }
    } else {
      setShow(false);
      if (selectedDate) {
        onChange?.(selectedDate);
        setTempDate(selectedDate);
      }
    }
  };

  // Android: use dialog
  if (Platform.OS === "android") {
    return (
      <View style={styles.container}>
        {label && <Label required={required}>{label}</Label>}
        <TouchableOpacity
          style={[
            styles.input,
            variant === "background" && { backgroundColor: inputBg },
            variant === "outline" && {
              ...styles.outlineInput,
              borderColor: grayishColor,
            },
            error && styles.errorInput,
          ]}
          onPress={() => {
            if (mode === "datetime") {
              setAndroidMode("date");
              setPendingDate(undefined);
            }
            setShow(true);
          }}
        >
          <ThemedText style={displayValue ? styles.value : styles.placeholder}>
            {displayValue || placeholder}
          </ThemedText>
        </TouchableOpacity>
        {show && (
          <DateTimePicker
            value={
              mode === "datetime"
                ? androidMode === "date"
                  ? value || getInitialDate()
                  : pendingDate || value || getInitialDate()
                : value || getInitialDate()
            }
            mode={mode === "datetime" ? androidMode : mode}
            display="default"
            maximumDate={maxDate ? new Date(maxDate) : undefined}
            minimumDate={minDate ? new Date(minDate) : undefined}
            onChange={handleAndroidChange}
          />
        )}
        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
      </View>
    );
  }

  // web
  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        {label && <Label required={required}>{label}</Label>}
        <input
          type="date"
          value={value ? format(value, "yyyy-MM-dd") : ""}
          onChange={(e) => onChange?.(new Date(e.target.value))}
        />
        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
      </View>
    );
  }

  // iOS: use bottom sheet (no show state needed)
  return (
    <View style={styles.container}>
      {label && <Label required={required}>{label}</Label>}
      <BottomSheet
        footer={({ close }) => (
          <Container
            justify="center"
            gap={12}
            style={{
              padding: 20,
            }}
          >
            <Button
              title="Klaar"
              onPress={() => {
                // Clamp to bounds before committing
                let next = tempDate;
                if (minDate && next < minDate) next = new Date(minDate);
                if (maxDate && next > maxDate) next = new Date(maxDate);
                onChange?.(next);
                close();
              }}
            />
          </Container>
        )}
      >
        <BottomSheetTrigger asChild>
          <TouchableOpacity
            style={[
              styles.input,
              variant === "background" && { backgroundColor: inputBg },
              variant === "outline" && {
                ...styles.outlineInput,
                borderColor: grayishColor,
              },
              error && styles.errorInput,
            ]}
          >
            <ThemedText
              style={displayValue ? styles.value : styles.placeholder}
            >
              {displayValue || placeholder}
            </ThemedText>
          </TouchableOpacity>
        </BottomSheetTrigger>
        <BottomSheetContent>
          <BottomSheetHeader title={label || placeholder} />
          <BottomSheetView style={{ flex: 1 }}>
            <Container
              justify="center"
              direction="horizontal"
              style={{
                paddingTop: 20,
                paddingBottom: 20 + 60 + bottom, // Footer padding (20) + Button height (~60) + Safe area
              }}
            >
              <DateTimePicker
                themeVariant={theme}
                value={tempDate}
                mode={mode}
                display="spinner"
                {...(() => {
                  const hasMin =
                    minDate &&
                    !isNaN(minDate.getTime()) &&
                    minDate.getTime() > 0;
                  const hasMax =
                    maxDate &&
                    !isNaN(maxDate.getTime()) &&
                    maxDate.getTime() > 0;

                  const props: any = {};

                  // Maximum date: only pass if valid
                  if (hasMax) {
                    props.maximumDate = new Date(maxDate!);
                  }

                  // Minimum date:
                  // - If minDate is valid, use it
                  // - If both are undefined, use 1980 workaround
                  // - If only maxDate exists (minDate undefined), also use 1980 workaround to prevent 1970 bug
                  if (hasMin) {
                    props.minimumDate = new Date(minDate!);
                  } else if (!hasMin && !hasMax) {
                    // Both undefined - use 1980 workaround
                    props.minimumDate = new Date(1971, 0, 1);
                  } else if (!hasMin && hasMax) {
                    // Only maxDate exists, minDate undefined - use 1980 workaround to prevent 1970
                    props.minimumDate = new Date(1980, 0, 1);
                  }

                  return props;
                })()}
                onChange={(_, selectedDate) => {
                  if (selectedDate && !isNaN(selectedDate.getTime())) {
                    setTempDate(selectedDate);
                  }
                }}
                style={{ width: "100%" }}
              />
            </Container>
          </BottomSheetView>
        </BottomSheetContent>
      </BottomSheet>
      {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  label: {
    marginBottom: 8,
    fontSize: 14,
    color: "#333",
  },
  required: {
    color: "#ff0000",
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderRadius: 30,
    paddingHorizontal: 15,
    height: 44,
    justifyContent: "center",
  },
  outlineInput: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  value: {
    fontSize: 15,
  },
  placeholder: {
    color: "#999",
    fontSize: 15,
  },
  errorInput: {
    borderWidth: 1,
    borderColor: "#ff0000",
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: "#ff0000",
  },
  confirmButton: {
    backgroundColor: "#2563eb",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  confirmText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
