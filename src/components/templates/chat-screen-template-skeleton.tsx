import React, { useMemo } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Skeleton from "@/components/ui/skeleton";
import { SIZES } from "@/constants";

type PercentString = `${number}%`;

type ChatScreenTemplateSkeletonProps = {
  rows?: number;
  showHeader?: boolean;
  showComposer?: boolean;
  style?: ViewStyle;
};

const ChatScreenTemplateSkeleton: React.FC<ChatScreenTemplateSkeletonProps> = ({
  rows = 8,
  showHeader = true,
  showComposer = true,
  style,
}) => {

  const widths = useMemo<PercentString[]>(
    () => ["72%", "58%", "80%", "64%", "70%", "54%", "76%", "62%", "68%", "60%"].slice(
      0,
      Math.max(2, rows)
    ) as PercentString[],
    [rows]
  );

  return (
    <View style={[styles.container, style]}>
      {showHeader && (
        <View style={styles.header}>
          <Skeleton width={36} height={36} style={styles.headerBack} />
          <Skeleton width={"40%"} height={18} style={styles.headerTitle} />
          <Skeleton width={28} height={28} style={styles.headerRight} />
        </View>
      )}

      <View style={styles.body}>
        {Array.from({ length: rows }).map((_, i) => {
          const w = widths[i % widths.length];
          const isLeft = i % 2 === 0;

          return (
            <View
              key={i}
              style={[
                styles.row,
                { justifyContent: isLeft ? "flex-start" : "flex-end" },
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  isLeft ? styles.left : styles.right,
                  { width: w }, 
                ]}
              >
            
                <Skeleton width={"86%"} height={12} style={{ borderRadius: 6 }} />
                <Skeleton
                  width={"62%"}
                  height={12}
                  style={{ borderRadius: 6, marginTop: 8 }}
                />
              </View>
            </View>
          );
        })}
      </View>

      {showComposer && (
        <View style={styles.composer}>
          <Skeleton width={"84%"} height={44} style={{ borderRadius: 12 }} />
          <Skeleton width={44} height={44} style={{ borderRadius: 12 }} />
        </View>
      )}
    </View>
  );
};

const P = SIZES.padding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: P,
    paddingBottom: P / 2,
    paddingHorizontal: P,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerBack: {
    borderRadius: 18,
  },
  headerTitle: {
    borderRadius: 6,
    flexGrow: 0,
  },
  headerRight: {
    marginLeft: "auto",
    borderRadius: 8,
  },

  body: {
    flex: 1,
    paddingHorizontal: P,
    paddingTop: P / 2,
    gap: 10,
  },
  row: {
    width: "100%",
    paddingVertical: 4,
    flexDirection: "row",
  },
  bubble: {
    padding: 10,
    borderRadius: 14,
    flexShrink: 1,
  },
  left: {
    alignSelf: "flex-start",
  },
  right: {
    alignSelf: "flex-end",
  },

  composer: {
    paddingHorizontal: P,
    paddingVertical: P,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});

export default ChatScreenTemplateSkeleton;
