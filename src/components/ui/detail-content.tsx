import React, { ReactNode } from "react";
import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";
import AmountDetail, { AmountDetailProps } from "./amount-detail";
import { Container, ContainerProps } from "./container";
import Divider from "./divider";
import Skeleton from "./skeleton";
import { useTextStyles, ThemedText } from "./themed-text";

type Direction = NonNullable<ContainerProps["direction"]>;

export type DetailContentProps = ContainerProps & {
  items: DetailContentItemProps[];
  showSeparator?: boolean;
  columns?: number;
  direction?: Direction;
  detailItemDirection?: Direction;
  gap?: number;
};

export type DetailContentItemProps = ContainerProps & {
  label: ReactNode;
  content: ReactNode | number;
  contentType?: "default" | "amount";
  amountProps?: AmountDetailProps;
  loading?: boolean;
  pressable?: boolean;
  onPress?: () => void;
};

export const DetailContentGroup = ({
  items,
  direction = "vertical",
  detailItemDirection = "horizontal",
  justify,
  align,
  wrap,
  showSeparator = false,
  columns,
  gap = 12,
  ...rest
}: Omit<DetailContentProps, "detailItemDirection"> & {
  detailItemDirection?: Direction;
}) => {
  const directionValue: Direction =
    direction === "horizontal" ? "horizontal" : "vertical";
  const itemDirectionValue: Direction = detailItemDirection;
  const effectiveColumns =
    directionValue === "horizontal" ? columns || 3 : undefined;

  // Grid logic: chunk items into rows, fill with null for empty cells
  let rows: Array<Array<DetailContentItemProps | null>> = [];
  if (
    directionValue === "horizontal" &&
    effectiveColumns &&
    effectiveColumns > 1
  ) {
    for (let i = 0; i < items.length; i += effectiveColumns) {
      const row: (DetailContentItemProps | null)[] = items.slice(
        i,
        i + effectiveColumns
      );
      while (row.length < effectiveColumns) {
        row.push(null);
      }
      rows.push(row);
    }
  } else {
    rows = [items.map((item) => item)];
  }

  if (
    directionValue === "horizontal" &&
    effectiveColumns &&
    effectiveColumns > 1
  ) {
    return (
      <Container direction="vertical" gap={gap} {...rest}>
        {rows.map((row, rowIdx) => (
          <Container
            key={rowIdx}
            direction="horizontal"
            gap={gap}
            align="stretch"
            style={{ width: "100%" }}
          >
            {row.map((item, colIdx) => {
              if (item !== null) {
                return (
                  <React.Fragment key={colIdx}>
                    <DetailContentItem
                      {...item}
                      direction={itemDirectionValue as Direction}
                      style={{
                        width: `${100 / effectiveColumns}%`,
                        minHeight: 48,
                        minWidth: 0,
                      }}
                    />
                    {colIdx < row.length - 1 && showSeparator && (
                      <Divider direction="vertical" />
                    )}
                  </React.Fragment>
                );
              } else {
                return (
                  <React.Fragment key={colIdx}>
                    <View
                      style={{
                        width: `${100 / effectiveColumns}%`,
                        minHeight: 48,
                        minWidth: 0,
                      }}
                    />
                    {colIdx < row.length - 1 && (
                      <Divider direction="vertical" />
                    )}
                  </React.Fragment>
                );
              }
            })}
          </Container>
        ))}
      </Container>
    );
  }

  // Fallback: vertical list
  return (
    <Container
      direction={directionValue}
      justify={directionValue === "horizontal" ? "space-between" : justify}
      align={align}
      wrap={directionValue === "horizontal"}
      gap={gap}
      {...rest}
    >
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <DetailContentItem
            {...item}
            direction={itemDirectionValue as Direction}
            style={{ width: "100%" }}
          />
          {showSeparator && idx < items.length - 1 && (
            <Divider direction="horizontal" />
          )}
        </React.Fragment>
      ))}
    </Container>
  );
};

export const DetailContentItem = ({
  label,
  content,
  contentType,
  amountProps,
  direction,
  gap = 6,
  loading = false,
  pressable = false,
  onPress,
  ...rest
}: Omit<DetailContentItemProps, "direction"> & {
  direction: Direction;
  pressable?: boolean;
  onPress?: () => void;
}) => {
  const textStyles = useTextStyles();
  const isHorizontal = direction === "horizontal";
  const directionValue: Direction = isHorizontal ? "horizontal" : "vertical";
  const contentNode = (
    <Container
      {...rest}
      direction={directionValue as Direction}
      align={isHorizontal ? "center" : "stretch"}
      gap={gap}
      style={{
        ...(direction === "vertical" ? { flex: 1 } : {}),
      }}
    >
      {loading ? (
        <>
          <Skeleton
            width={isHorizontal ? "60%" : "40%"}
            height={16}
            style={{ marginRight: isHorizontal ? 8 : 0 }}
          />
          <Skeleton
            width={isHorizontal ? "30%" : "80%"}
            height={20}
            style={isHorizontal ? { marginLeft: "auto" } : {}}
          />
        </>
      ) : (
        <>
          {typeof label === "string" ? (
            <ThemedText
              {...textStyles.gray}
              style={{
                flexShrink: 1,
                flexGrow: 0,
                maxWidth: isHorizontal ? "70%" : undefined,
                marginRight: isHorizontal ? 8 : 0,
              }}
            >
              {label}
            </ThemedText>
          ) : (
            label
          )}
          {contentType === "amount" && typeof content === "number" ? (
            <AmountDetail
              amount={content}
              weight="semiBold"
              {...amountProps}
              style={{
                flexShrink: 1,
                flexGrow: 1,
                minWidth: 0,
                textAlign: isHorizontal ? "right" : "left",
              }}
            />
          ) : ["number", "string"].includes(typeof content) ? (
            <ThemedText
              weight="semiBold"
              style={{
                flexShrink: 1,
                flexGrow: 1,
                minWidth: 0,
                textAlign: isHorizontal ? "right" : "left",
              }}
            >
              {content}
            </ThemedText>
          ) : (
            content
          )}
        </>
      )}
    </Container>
  );
  if (pressable) {
    const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
    return (
      <AnimatedPressable onPress={onPress}>{contentNode}</AnimatedPressable>
    );
  }
  return contentNode;
};
