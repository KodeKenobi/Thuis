import AvatarCardTemplate, {
  AvatarCardTemplateProps,
} from "@/components/templates/avatar-card-template";
import AvatarCardTemplateSkeleton from "@/components/templates/avatar-card-template-skeleton";
import { Container } from "@/components/ui/container";
import { EmptyData } from "@/components/ui/empty-data";
import Skeleton from "@/components/ui/skeleton";
import { useTextStyles, ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { SIZES } from "@/constants";
import { useFetchContracts } from "@/service/contracts";
import { useGetFlowProcess } from "@/service/flows";
import {
  formatErrorMessage,
  getActiveContracts,
  isFlowDisabled,
} from "@/utils";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React, {
  ReactNode,
  useEffect,
  useMemo,
  useState,
  memo,
  useCallback,
} from "react";
import { registerScrollable } from "@/utils/scroll-helper";
import { FlatList, RefreshControl, Platform } from "react-native";

type Props = {
  cardProps?: AvatarCardTemplateProps;
  scrollable?: boolean;
  filter?: { search?: string };
  group?: TFlowGroups[];
  categoryId?: string;
  includeStartsWith?: string[];
  includeCodes?: string[];
  excludeIds?: string[];
  onDataIds?: (ids: string[]) => void;
  reportNonce?: number;

  nSkeletons?: number;
  showLoaderPadding?: boolean;
  showLoaderBackground?: boolean;
  header?: ReactNode;
  hideIfEmpty?: boolean;
};

// Memoize static style objects
const flowItemStyle = { marginVertical: 8 };
const flowItemStyleDisabled = { marginVertical: 8, opacity: 0.5 };

// Memoize avatar icon creation outside component to avoid recreation
const createAvatarIcon = (iconName: string, color: string) => (
  <Ionicons size={20} name={iconName as any} color={color} />
);

const FlowItem = memo(
  ({
    flow,
    cardProps,
    onPress,
  }: {
    flow: TFlowProcess & { _disabled?: boolean };
    cardProps?: AvatarCardTemplateProps;
    onPress: (flow: TFlowProcess) => void;
  }) => {
    const textStyles = useTextStyles();
    // Use pre-computed disabled state if available
    const disabled = flow._disabled ?? false;

    // Memoize avatar props to avoid recreation - use stable icon reference
    const avatarProps = useMemo(() => {
      if (flow?.defaultIcon) {
        return {
          icon: createAvatarIcon(flow.defaultIcon, flow?.color || "#000"),
          size: 48,
          color: flow?.color,
          bgAlpha: 0.15,
        };
      }
      return {
        source: { uri: flow?.iconURL },
        size: 48,
        color: flow?.color,
        bgAlpha: 0.15,
      };
    }, [flow?.defaultIcon, flow?.iconURL, flow?.color]);

    // Pre-compute text content (no need for useMemo, just compute once)
    const title =
      flow?.flowName || flow?.websiteLabel || flow?.defaultLabel || flow.label;
    const description =
      flow?.description?.replace("Dialoog voor", "").trim() ||
      flow?.defaultDescription?.replace("Dialoog voor", "").trim();

    // Use stable style reference to avoid unnecessary re-renders
    const itemStyle = disabled ? flowItemStyleDisabled : flowItemStyle;

    return (
      <AvatarCardTemplate
        variant="background"
        onPress={() => onPress(flow)}
        disabled={disabled}
        style={itemStyle}
        avatar={avatarProps}
        {...cardProps}
      >
        <Container gap={4}>
          <ThemedText weight="semiBold" numberOfLines={1} ellipsizeMode="tail">
            {title}
          </ThemedText>
          {description ? (
            <ThemedText
              {...textStyles.gray}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {/* capitalize first letter */}
              {description?.charAt(0).toUpperCase() + description?.slice(1)}
            </ThemedText>
          ) : null}
        </Container>
      </AvatarCardTemplate>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if flow properties change
    // Compare by reference first for performance
    if (prevProps.flow === nextProps.flow) return true;

    return (
      prevProps.flow.id === nextProps.flow.id &&
      prevProps.flow.flowCode === nextProps.flow.flowCode &&
      prevProps.flow.code === nextProps.flow.code &&
      prevProps.flow.websiteLabel === nextProps.flow.websiteLabel &&
      prevProps.flow.defaultLabel === nextProps.flow.defaultLabel &&
      prevProps.flow.label === nextProps.flow.label &&
      prevProps.flow.defaultDescription === nextProps.flow.defaultDescription &&
      prevProps.flow.description === nextProps.flow.description &&
      prevProps.flow.defaultIcon === nextProps.flow.defaultIcon &&
      prevProps.flow.iconURL === nextProps.flow.iconURL &&
      prevProps.flow.color === nextProps.flow.color &&
      prevProps.flow._disabled === nextProps.flow._disabled
      // Don't compare onPress, cardProps as they may be recreated
    );
  }
);

FlowItem.displayName = "FlowItem";

const FlowsListContainer = React.forwardRef<any, Props>(
  (
    {
      cardProps,
      scrollable,
      filter,
      group,
      categoryId,
      includeStartsWith,
      includeCodes,
      excludeIds,
      onDataIds,
      reportNonce,
      nSkeletons = 8,
      showLoaderBackground,
      showLoaderPadding,
      header,
      hideIfEmpty = true,
    },
    ref
  ) => {
    const textStyles = useTextStyles();
    const [isRefetching, setRefetching] = useState(false);
    const [loading, setLoading] = useState(false);

    const { contracts, contractsLoading, contractsRefetch } = useFetchContracts(
      {
        params: { subset: "ACTIEF" },
      }
    );

    // Memoize activeContracts to prevent recalculation on every render
    const activeContracts = useMemo(
      () => getActiveContracts(contracts || []),
      [contracts]
    );

    const {
      flowProcess,
      flowProcessLoading,
      flowProcessRefetch,
      flowProcessError,
    } = useGetFlowProcess();

    const data = useMemo(() => {
      if (!flowProcess?.length) return [];

      let items = flowProcess;

      // Filter by categoryId if provided
      if (categoryId) {
        items = items.filter(
          (f) =>
            f.processCategoryId === categoryId ||
            f.processCategory?.id === categoryId
        );
      }

      // Filter by group if provided (for backward compatibility)
      if (group?.length) {
        items = items.filter(
          (f) =>
            Array.isArray(f.groups) && f.groups.some((g) => group.includes(g))
        );
      }
      if (includeStartsWith?.length) {
        items = items.filter((f) =>
          includeStartsWith.some((p) => (f.code || "").startsWith(p))
        );
      }

      if (includeCodes?.length) {
        const wanted = new Set(includeCodes);
        items = items.filter((f) => wanted.has(f.code));
      }

      // Text search
      const q = (filter?.search || "").trim().toLowerCase();
      if (q) {
        items = items.filter((f) => {
          const label = (
            f.flowName ||
            f.defaultLabel ||
            f.websiteLabel ||
            f.label ||
            ""
          ).toLowerCase();
          const desc = (
            f.defaultDescription ||
            f.description ||
            ""
          ).toLowerCase();
          const codeS = (f.code || f.flowCode || "").toLowerCase();
          return label.includes(q) || desc.includes(q) || codeS.includes(q);
        });
      }

      // Filter by excludeIds first (cheaper check)
      if (excludeIds?.length) {
        const ex = new Set(excludeIds);
        items = items.filter((f) => !ex.has(f.id));
      }

      // Availability rules - filter disabled flows and pre-compute disabled state in one pass
      // Use a single pass with a result array to avoid intermediate arrays
      const result: (TFlowProcess & { _disabled: boolean })[] = [];
      for (const item of items) {
        const disabled = isFlowDisabled(item, activeContracts);
        if (!disabled) {
          result.push({ ...item, _disabled: disabled });
        }
      }
      return result;
    }, [
      flowProcess,
      categoryId,
      group,
      includeStartsWith,
      includeCodes,
      filter?.search,
      activeContracts,
      excludeIds,
    ]);

    useEffect(() => {
      if (onDataIds && data.length > 0) {
        onDataIds(data.map((d) => d.id));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reportNonce, data?.length]);

    const renderHeader = (hdr?: ReactNode) => {
      if (!hdr || typeof hdr === "boolean") return null;
      if (typeof hdr === "string" || typeof hdr === "number") {
        return (
          <ThemedText
            {...textStyles.subtitle}
            size="lg"
            fontType="display"
            style={{ paddingBottom: SIZES.padding / 8, textTransform: "none" }}
          >
            {hdr}
          </ThemedText>
        );
      }
      return hdr;
    };

    const handleFlowPress = useCallback(
      (flow: TFlowProcess) => {
        const disabled = isFlowDisabled(flow, activeContracts);
        if (!disabled) {
          router.push({
            pathname: "/flows/[id]",
            params: {
              id: flow?.id,
              flowCode: flow?.flowCode,
              code: flow?.code,
              defaultLabel: flow?.defaultLabel,
              flowName: flow?.flowName,
            },
          });
        }
      },
      [activeContracts]
    );

    // Memoize renderItem - remove AnimatedCardTemplate completely for better performance
    // Note: activeContracts is no longer passed as it's pre-computed in data
    const renderItem = useCallback(
      ({ item }: { item: TFlowProcess & { _disabled?: boolean } }) => {
        return (
          <FlowItem
            flow={item}
            cardProps={cardProps}
            onPress={handleFlowPress}
          />
        );
      },
      [cardProps, handleFlowPress]
    );

    // Memoize keyExtractor to avoid recreation
    const keyExtractor = useCallback(
      (item: TFlowProcess & { _disabled?: boolean }) => item?.id,
      []
    );

    // Loading
    if (flowProcessLoading || loading) {
      return (
        <ThemedView
          style={{
            flex: 1,
            ...(showLoaderPadding
              ? {
                  paddingHorizontal: SIZES.padding,
                  paddingVertical: SIZES.padding / 2,
                }
              : {}),
          }}
          transparent={!showLoaderBackground}
        >
          {renderHeader(header)}
          {Array.from({ length: nSkeletons }).map((_, key) => (
            <AvatarCardTemplateSkeleton
              key={key}
              avatar={{ size: 48 }}
              style={{ marginVertical: 8 }}
              variant="background"
              {...cardProps}
            >
              <Container gap={8}>
                <Skeleton height={12} width={100} />
                <Skeleton height={10} width={130} />
              </Container>
            </AvatarCardTemplateSkeleton>
          ))}
        </ThemedView>
      );
    }

    // Error / Empty
    if (!flowProcessLoading) {
      if (flowProcessError) {
        if (hideIfEmpty) return null;
        return (
          <ThemedView transparent style={{ justifyContent: "center" }}>
            {renderHeader(header)}
            <EmptyData
              description={formatErrorMessage(flowProcessError)}
              variant="red"
              actionPress={async () => {
                setLoading(true);
                try {
                  await Promise.all([flowProcessRefetch(), contractsRefetch()]);
                } finally {
                  setLoading(false);
                }
              }}
            />
          </ThemedView>
        );
      }

      if (!flowProcess?.length || !data.length) {
        if (hideIfEmpty) return null;
        return (
          <ThemedView transparent style={{ justifyContent: "center" }}>
            {renderHeader(header)}
            <EmptyData />
          </ThemedView>
        );
      }
    }

    if (!scrollable) {
      return (
        <Container>
          {renderHeader(header)}
          {data.map((flow) => (
            <FlowItem
              key={flow.id}
              flow={flow}
              cardProps={cardProps}
              onPress={handleFlowPress}
            />
          ))}
        </Container>
      );
    }

    const listRef = React.useRef<FlatList<any>>(null);

    // Platform-specific performance settings (balanced for Android)
    const isAndroid = Platform.OS === "android";
    const performanceProps = useMemo(
      () => ({
        maxToRenderPerBatch: isAndroid ? 5 : 6,
        windowSize: isAndroid ? 6 : 7,
        initialNumToRender: isAndroid ? 5 : 7,
        updateCellsBatchingPeriod: isAndroid ? 150 : 100,
      }),
      [isAndroid]
    );

    React.useImperativeHandle(ref, () => ({
      scrollTo: (options: { y?: number; animated?: boolean }) => {
        listRef.current?.scrollToOffset({
          offset: options.y || 0,
          animated: options.animated !== false,
        });
      },
      scrollToEnd: (options?: { animated?: boolean }) => {
        listRef.current?.scrollToEnd({ animated: options?.animated !== false });
      },
    }));

    // Register scrollable ref
    useEffect(() => {
      registerScrollable("FlowsListContainer", {
        scrollTo: (options: { y?: number; animated?: boolean }) => {
          listRef.current?.scrollToOffset({
            offset: options.y || 0,
            animated: options.animated !== false,
          });
        },
        scrollToEnd: (options?: { animated?: boolean }) => {
          listRef.current?.scrollToEnd({
            animated: options?.animated !== false,
          });
        },
      });
      return () => {
        registerScrollable("FlowsListContainer", null);
      };
    }, []);

    return (
      <FlatList
        ref={listRef}
        data={data}
        refreshControl={
          <RefreshControl
            onRefresh={async () => {
              setRefetching(true);
              try {
                await Promise.all([flowProcessRefetch(), contractsRefetch()]);
              } finally {
                setRefetching(false);
              }
            }}
            refreshing={isRefetching || flowProcessLoading || contractsLoading}
          />
        }
        style={{
          flex: 1,
          paddingHorizontal: SIZES.padding,
          paddingVertical: SIZES.padding / 2,
        }}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={<>{renderHeader(header)}</>}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        // Performance optimizations - Platform-specific (Android needs balanced aggressive settings)
        removeClippedSubviews={true}
        maxToRenderPerBatch={performanceProps.maxToRenderPerBatch}
        windowSize={performanceProps.windowSize}
        initialNumToRender={performanceProps.initialNumToRender}
        updateCellsBatchingPeriod={performanceProps.updateCellsBatchingPeriod}
      />
    );
  }
);

FlowsListContainer.displayName = "FlowsListContainer";

export default FlowsListContainer;
