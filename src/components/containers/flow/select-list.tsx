import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Container } from "@/components/ui/container";
import { useTextStyles, ThemedText } from "@/components/ui/themed-text";
import { DetailContentGroup } from "@/components/ui/detail-content";
import { formatAmount, formatDate, getBackgroundColor } from "@/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Radio } from "@/components/ui/radio";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { SIZES } from "@/constants";

export const SelectList: React.FC<IFlowSelectListProps> = ({
  items,
  columns,
  selected,
  onSelectionChange,
  error,
  multiSelect = false,
  disabled = false,
}) => {
  const textStyles = useTextStyles();
  const { colors: { primary, grayishColor } } = useCorporateBranding();
  const getKey = (obj: any) =>
    (obj && (obj.id ?? obj.code ?? obj.value)) as string | number | undefined;
  const containsItem = (arr: any[], item: any) => {
    const key = getKey(item);
    if (key === undefined) return arr.includes(item);
    return arr?.some((x: any) => getKey(x) === key);
  };
  const removeItem = (arr: any[], item: any) => {
    const key = getKey(item);
    if (key === undefined) return arr.filter((x) => x !== item);
    return arr.filter((x: any) => getKey(x) !== key);
  };
  const toggleSelection = (item: any): void => {
    if (disabled) return;
    if (multiSelect) {
      if (containsItem(selected, item)) {
        onSelectionChange(removeItem(selected, item));
      } else {
        onSelectionChange([...selected, item]);
      }
    } else {
      // Always collect as array, even for single select
      onSelectionChange([item]);
    }
  };

  const renderItem = (item: IFlowListItem) => {
    const isSelected = multiSelect
      ? containsItem(selected, item)
      : Array.isArray(selected)
      ? containsItem(selected, item)
      : selected && getKey(selected) !== undefined
      ? getKey(selected) === getKey(item)
      : selected === item;

    const primaryBackground = getBackgroundColor(primary, 0.1);

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => toggleSelection(item)}
        style={[
          styles.row,
          isSelected
            ? {
                backgroundColor: primaryBackground,
                borderColor: primary,
              }
            : {
                borderColor: grayishColor,
              },
        ]}
        disabled={disabled}
      >
        {!disabled &&
          (multiSelect ? (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleSelection(item)}
              style={{ margin: 0 }}
            />
          ) : (
            <Radio
              selected={isSelected}
              onSelectedChange={() => toggleSelection(item)}
              style={{ margin: 0 }}
            />
          ))}

        <Container flex={1}>
          <DetailContentGroup
            direction="horizontal"
            detailItemDirection="vertical"
            columns={2}
            flex={1}
            gap={8}
            items={columns.map((col) => ({
              label: col.label,
              content:
                col.displayFormat === "currency"
                  ? formatAmount(Number(item[col.value]), { currency: "EUR" })
                  : col.displayFormat === "date" && item[col.value]
                  ? formatDate(String(item[col.value]))
                  : col?.displayFormat === "datetime"
                  ? formatDate(String(item[col.value]), {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : String(item[col.value]),
              contentType:
                col.displayFormat === "currency" ? "amount" : "default",
            }))}
          />
        </Container>
      </TouchableOpacity>
    );
  };

  return (
    <Container gap={16}>
      <View style={styles.table}>{items.map(renderItem)}</View>
      {error && (
        <ThemedText {...textStyles.danger} style={styles.error}>
          {error}
        </ThemedText>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  table: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    flex: 1,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: SIZES.radius,
  },
  checkboxCell: {
    alignItems: "center",
  },
  error: {
    marginTop: 8,
  },
});

export default SelectList;
