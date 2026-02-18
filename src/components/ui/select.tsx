import React, { useState, ReactNode, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { EmptyData, EmptyDataProps } from "./empty-data";
import Label from "./label";
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTrigger,
} from "./bottom-sheet";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { CustomBottomSheetTextInput } from "./bottom-sheet-text-input";
import { SIZES } from "@/constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Skeleton from "./skeleton";
import { ThemedText } from "./themed-text";
import Input from "./input";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

export interface SelectorItem {
  id: string;
  label?: ReactNode;
  name?: string;
  [key: string]: any;
}

interface BaseSelectorProps {
  items: SelectorItem[];
  placeholder?: string;
  loading?: boolean;
  searchPlaceholder?: string;
  maxDisplayItems?: number;
  triggerStyle?: ViewStyle;
  textStyle?: TextStyle;
  placeholderStyle?: TextStyle;
  label?: string;
  error?: string;
  icon?: ReactNode;
  required?: boolean;
  emptyDataProps?: EmptyDataProps;
  variant?: "background" | "outline";
}

interface SingleSelectProps extends BaseSelectorProps {
  isMulti?: false;
  value: SelectorItem | null;
  onValueChange: (value: SelectorItem | null) => void;
}

interface MultiSelectProps extends BaseSelectorProps {
  isMulti: true;
  value: SelectorItem[] | null;
  onValueChange: (value: SelectorItem[] | null) => void;
}

type SelectorProps = SingleSelectProps | MultiSelectProps;

const SelectItem = React.memo(
  ({
    item,
    isMulti,
    handleSelect,
    getItemLabel,
    isSelected,
    borderColor,
    textColor,
    rowBgColor,
  }: {
    item: SelectorItem;
    isMulti: boolean;
    handleSelect: (item: SelectorItem) => void;
    getItemLabel: (item: SelectorItem) => string | ReactNode;
    isSelected: (item: SelectorItem) => boolean;
    borderColor: string;
    textColor: string;
    rowBgColor: string;
  }) => {
    const labelNode = getItemLabel(item);
    const content = (
      <View
        style={[
          styles.listItem,
          {
            borderBottomColor: borderColor,
            backgroundColor: rowBgColor,
          },
        ]}
      >
        {typeof labelNode === "string" ? (
          <ThemedText style={[styles.listText, { color: textColor }]}>
            {labelNode}
          </ThemedText>
        ) : (
          labelNode
        )}
        {isSelected(item) && (
          <Ionicons name="checkmark" size={20} color="#2962ff" />
        )}
      </View>
    );

    if (isMulti) {
      return (
        <TouchableOpacity
          onPress={() => handleSelect(item)}
          activeOpacity={0.7}
        >
          {content}
        </TouchableOpacity>
      );
    } else {
      return (
        <BottomSheetClose asChild>
          <TouchableOpacity
            onPress={() => handleSelect(item)}
            activeOpacity={0.7}
          >
            {content}
          </TouchableOpacity>
        </BottomSheetClose>
      );
    }
  },
);

export const Select: React.FC<SelectorProps> = (props) => {
  const listRef = useRef(null);

  const {
    items,
    value,
    onValueChange,
    placeholder = "Selecteer een item",
    loading = false,
    searchPlaceholder = "Typ hier om te zoeken",
    isMulti = false,
    maxDisplayItems = 2,
    triggerStyle,
    textStyle,
    placeholderStyle,
    label,
    error,
    icon,
    required,
    emptyDataProps,
    variant = "background",
  } = props;

  const {
    colors: { inputBg, grayishColor, secondary, text, background, theme },
  } = useCorporateBranding();
  const [search, setSearch] = useState<string>("");
  const { bottom } = useSafeAreaInsets();

  const selectedItems: SelectorItem[] = isMulti
    ? Array.isArray(value)
      ? (value as SelectorItem[])
      : []
    : value
      ? [value as SelectorItem]
      : [];

  const isSelected = (item: SelectorItem) =>
    selectedItems.some((s) => s.id === item.id);

  const normalized = (v: ReactNode) =>
    typeof v === "string" ? v : typeof v === "number" ? String(v) : "";

  const filteredItems = items.filter((item) => {
    const n = search.toLowerCase();
    const name = (item.name ?? "").toLowerCase();
    const lbl = normalized(item.label).toLowerCase();
    return name.includes(n) || lbl.includes(n);
  });

  const getItemLabel = (item: SelectorItem) => item.label ?? item.name ?? "";

  const handleSelect = (item: SelectorItem) => {
    if (isMulti) {
      const current = Array.isArray(value) ? (value as SelectorItem[]) : [];
      const newArr = isSelected(item)
        ? current.filter((v) => v.id !== item.id)
        : [...current, item];
      (onValueChange as (v: SelectorItem[] | null) => void)(newArr);
      return;
    }
    (onValueChange as (v: SelectorItem | null) => void)(item);
  };

  const handleClear = (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (!isMulti) {
      (onValueChange as (v: SelectorItem | null) => void)(null);
    } else {
      (onValueChange as (v: SelectorItem[] | null) => void)(null);
    }
  };

  const getDisplayText = () => {
    if (selectedItems.length === 0) return placeholder;

    if (isMulti) {
      if (selectedItems.length === 1) {
        const lbl = getItemLabel(selectedItems[0]);
        return typeof lbl === "string" ? lbl : "1 selected";
      }
      if (selectedItems.length > maxDisplayItems) {
        return `${selectedItems.length} selected`;
      }
      return selectedItems
        .map((i) =>
          typeof getItemLabel(i) === "string"
            ? (getItemLabel(i) as string)
            : "[custom]",
        )
        .join(", ");
    }

    const lbl = getItemLabel(selectedItems[0]);
    return typeof lbl === "string" ? (lbl as string) : "";
  };

  const hasSelection = selectedItems.length > 0;

  const placeholderColor =
    theme === "dark" ? "rgba(255,255,255,0.5)" : "#B3B3B3";
  const valueColor = text;

  const listBgColor = theme === "dark" ? background : "#fff";
  const rowBgColor = theme === "dark" ? background : inputBg;

  return (
    <>
      <BottomSheet snapPoints={["70%", "90%"]}>
        {label && <Label required={required}>{label}</Label>}

        <BottomSheetTrigger asChild>
          <TouchableOpacity
            style={[
              styles.selector,
              variant === "background" && { backgroundColor: inputBg },
              variant === "outline" && {
                ...styles.outlineContainer,
                borderColor: grayishColor,
              },
              error && styles.errorContainer,
              triggerStyle,
            ]}
            activeOpacity={0.7}
          >
            {icon && <View style={styles.icon}>{icon}</View>}

            <ThemedText
              numberOfLines={1}
              ellipsizeMode="tail"
              weight="medium"
              style={[
                styles.selectorTextBase,
                hasSelection ? styles.valueText : styles.placeholderText,
                hasSelection ? textStyle : placeholderStyle,
                {
                  color: hasSelection ? valueColor : placeholderColor,
                  // Match Input placeholder styling - single line height matches fontSize
                  lineHeight: 16,
                },
              ]}
            >
              {getDisplayText()}
            </ThemedText>

            <View style={styles.selectorIcons}>
              {hasSelection && !isMulti && (
                <TouchableOpacity
                  onPress={handleClear}
                  style={styles.clearButton}
                >
                  <Ionicons name="close" size={18} color="#999" />
                </TouchableOpacity>
              )}
              {isMulti && hasSelection && (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>
                    {selectedItems.length}
                  </ThemedText>
                </View>
              )}
              <Ionicons name="chevron-down-outline" size={24} color="#999" />
            </View>
          </TouchableOpacity>
        </BottomSheetTrigger>

        <BottomSheetContent>
          <BottomSheetHeader title={label || placeholder}>
            {Platform.OS === "web" ? (
              <Input
                placeholder={searchPlaceholder}
                value={search}
                variant="outline"
                onChangeText={setSearch}
              />
            ) : (
              <CustomBottomSheetTextInput
                placeholder={searchPlaceholder}
                value={search}
                variant="outline"
                onChangeText={setSearch}
              />
            )}
          </BottomSheetHeader>

          <BottomSheetFlatList
            ref={listRef}
            enableFooterMarginAdjustment={isMulti}
            data={loading ? Array.from({ length: 5 }) : filteredItems}
            keyExtractor={(item: SelectorItem | undefined, index: number) =>
              item?.id || `skeleton-${index}`
            }
            renderItem={({
              item,
              index,
            }: {
              item: SelectorItem | undefined;
              index: number;
            }) => {
              if (loading && !item) {
                return (
                  <View
                    style={[
                      styles.listItem,
                      {
                        borderBottomColor: secondary,
                        backgroundColor: rowBgColor,
                      },
                    ]}
                  >
                    <Skeleton width="70%" height={16} />
                  </View>
                );
              }

              if (!item) return null;

              return (
                <SelectItem
                  item={item}
                  isMulti={!!isMulti}
                  handleSelect={handleSelect}
                  getItemLabel={getItemLabel}
                  isSelected={isSelected}
                  borderColor={secondary}
                  textColor={text}
                  rowBgColor={rowBgColor}
                />
              );
            }}
            ListEmptyComponent={() => (
              <View style={styles.emptyStateContainer}>
                {!loading && <EmptyData {...emptyDataProps} />}
              </View>
            )}
            ListFooterComponent={
              !isMulti
                ? () => <View style={{ height: bottom + 20 }} />
                : undefined
            }
            style={[{ marginTop: 100, backgroundColor: listBgColor }]}
            contentContainerStyle={[
              {
                backgroundColor: listBgColor,
              },
              loading
                ? {
                    flexGrow: 0,
                  }
                : {},
            ]}
          />
        </BottomSheetContent>
      </BottomSheet>

      {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 30,
    paddingHorizontal: 15,
    height: 44,
  },
  selectorTextBase: {
    flex: 1,
    fontSize: 16,
    fontWeight: 500,
  },

  valueText: {
    fontWeight: 500,
    fontSize: 16,
  },
  placeholderText: {
    fontWeight: 500,
    fontSize: 16,
  },
  icon: { marginRight: 10 },
  selectorIcons: { flexDirection: "row", alignItems: "center" },
  errorContainer: { borderWidth: 1, borderColor: "#ff0000" },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SIZES.padding / 1.5,
    paddingHorizontal: SIZES.padding,
    borderBottomWidth: 1,
  },

  listText: {
    fontSize: 16,
    flex: 1,
  },

  emptyStateContainer: {
    justifyContent: "flex-start",
    alignItems: "center",
    paddingVertical: 40,
    width: "100%",
  },
  outlineContainer: { borderWidth: 1, backgroundColor: "transparent" },
  errorText: { marginTop: 4, fontSize: 12, color: "#ff0000" },

  clearButton: {
    marginRight: 4,
    padding: 4,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2962ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default Select;
