import React, {
  ReactNode,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { registerScrollable } from "@/utils/scroll-helper";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useFetchLocalNews } from "@/service/news";
import { ThemedText, useTextStyles } from "@/components/ui/themed-text";
import { Container } from "@/components/ui/container";
import { EmptyData } from "@/components/ui/empty-data";
import AvatarCardTemplate, {
  AvatarCardTemplateProps,
} from "@/components/templates/avatar-card-template";
import AvatarCardTemplateSkeleton from "@/components/templates/avatar-card-template-skeleton";
import { SIZES } from "@/constants";
import AnimatedCardTemplate from "@/components/templates/animated-card-template";
import { ThemedView } from "@/components/ui/themed-view";
import Skeleton from "@/components/ui/skeleton";
import { formatErrorMessage } from "@/utils";

interface Props {
  cardProps?: AvatarCardTemplateProps;
  scrollable?: boolean;
  filter?: { search: string };
  n?: number;
  showLoaderPadding?: boolean;
  showLoaderBackground?: boolean;
  header?: ReactNode;
  hideIfEmpty?: boolean;
}

// Static styles moved outside component
const newsItemStyle = StyleSheet.create({
  touchable: { marginVertical: 8 },
});

// Static avatar props to avoid recreation
const newsItemAvatarProps = {
  size: 48,
  icon: "newspaper-outline" as const,
  bgAlpha: 0.15,
};

// Memoized NewsItem component
interface NewsItemProps {
  item: INewsItem;
  dateLabel: string;
  cardProps?: AvatarCardTemplateProps;
  onPress: (slug: string) => void;
}

const NewsItem = React.memo<NewsItemProps>(
  ({ item, dateLabel, cardProps, onPress }) => {
    const textStyles = useTextStyles();
    return (
      <TouchableOpacity
        style={newsItemStyle.touchable}
        onPress={() => onPress(item.slug)}
      >
        <AvatarCardTemplate
          variant="background"
          avatar={newsItemAvatarProps}
          {...cardProps}
        >
          <Container gap={4}>
            <ThemedText
              weight="semiBold"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.title}
            </ThemedText>
            <ThemedText
              {...textStyles.gray}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {dateLabel}
            </ThemedText>
          </Container>
        </AvatarCardTemplate>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render), false if different (re-render)
    // Only compare item properties and dateLabel - onPress and cardProps are typically stable
    return (
      prevProps.item.slug === nextProps.item.slug &&
      prevProps.dateLabel === nextProps.dateLabel &&
      prevProps.item.title === nextProps.item.title
    );
  }
);

NewsItem.displayName = "NewsItem";

const NewsListContainer = React.forwardRef<FlatList<any>, Props>(
  (
    {
      filter,
      cardProps,
      scrollable,
      showLoaderBackground,
      header,
      showLoaderPadding,
      n = 8,
      hideIfEmpty,
    },
    ref
  ) => {
    const textStyles = useTextStyles();
    const [isRefetching, setRefetching] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const { bottom } = useSafeAreaInsets();

    const { news, newsLoading, newsError, newsRefetch } = useFetchLocalNews({
      options: {},
    });

    // All hooks must be called before any conditional returns
    const listRef = React.useRef<FlatList<any>>(null);

    React.useImperativeHandle(ref, () => listRef.current as FlatList<any>);

    // Register scrollable ref
    useEffect(() => {
      if (scrollable) {
        registerScrollable("NewsListContainer", {
          scrollTo: (options: { y?: number; animated?: boolean }) => {
            listRef.current?.scrollToOffset({
              offset: options.y || 0,
              animated: options.animated !== false,
            });
          },
          scrollToEnd: (options?: { animated?: boolean | null }) => {
            listRef.current?.scrollToEnd({
              animated: options?.animated ?? true,
            });
          },
        });
      }
      return () => {
        if (scrollable) {
          registerScrollable("NewsListContainer", null);
        }
      };
    }, [scrollable]);

    // Memoize filtered news - optimize search filtering
    const filteredNews = useMemo(() => {
      if (!news || news.length === 0) return [];

      const searchTerm = (filter?.search || "").toLowerCase();
      if (!searchTerm) {
        const result = news;
        return n ? result.slice(0, n) : result;
      }

      const result = news.filter((item: INewsItem) =>
        item.title.toLowerCase().includes(searchTerm)
      );
      return n ? result.slice(0, n) : result;
    }, [news, filter?.search, n]);

    // Pre-compute date labels for all items
    const newsWithDates = useMemo(() => {
      return filteredNews.map((item: INewsItem) => {
        const baseDate =
          item.publishStart || item.publishedAt || item.updatedAt;
        const dateLabel = format(new Date(baseDate), "dd MMMM yyyy • HH:mm", {
          locale: nl,
        });
        return { item, dateLabel };
      });
    }, [filteredNews]);

    const isLoading = loading || newsLoading;

    const handleNewsPress = useCallback(
      (slug: string) => {
        router.push({
          pathname: "/news/[slug]",
          params: { slug },
        } as any);
      },
      [router]
    );

    const handleRefresh = useCallback(() => {
      setRefetching(true);
      newsRefetch().finally(() => setRefetching(false));
    }, [newsRefetch]);

    const handleRetry = useCallback(() => {
      setLoading(true);
      newsRefetch().finally(() => setLoading(false));
    }, [newsRefetch]);

    // Memoized keyExtractor
    const keyExtractor = useCallback(
      (item: { item: INewsItem; dateLabel: string }) => item.item.slug,
      []
    );

    // Memoized renderItem
    const renderItem = useCallback(
      ({
        item,
        index,
      }: {
        item: { item: INewsItem; dateLabel: string };
        index: number;
      }) => {
        return (
          <NewsItem
            item={item.item}
            dateLabel={item.dateLabel}
            cardProps={cardProps}
            onPress={handleNewsPress}
          />
        );
      },
      [cardProps, handleNewsPress]
    );

    // Platform-specific performance settings (Android needs more aggressive settings)
    const isAndroid = Platform.OS === "android";
    const performanceProps = useMemo(
      () => ({
        maxToRenderPerBatch: isAndroid ? 3 : 5,
        windowSize: isAndroid ? 4 : 6,
        initialNumToRender: isAndroid ? 3 : 6, // Reduced from 4 to 3 for Android
        updateCellsBatchingPeriod: isAndroid ? 350 : 150, // Increased from 300 to 350 for Android
      }),
      [isAndroid]
    );

    // Memoized contentContainerStyle
    const contentContainerStyle = useMemo(
      () => [
        { flexGrow: 1 },
        filteredNews.length === 0 && Platform.OS === "ios"
          ? { paddingBottom: (bottom || 0) + SIZES.padding / 2 }
          : null,
      ],
      [filteredNews.length, bottom]
    );

    // Memoized listStyle
    const listStyle = useMemo(
      () => ({
        flex: 1,
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.padding / 2,
      }),
      []
    );

    // Helper function (not a hook)
    const renderHeader = (h?: ReactNode) => {
      if (!h || typeof h === "boolean") return null;
      if (typeof h === "string" || typeof h === "number") {
        return (
          <ThemedText
            {...textStyles.subtitle}
            size="lg"
            style={{ paddingBottom: SIZES.padding / 8 }}
          >
            {h}
          </ThemedText>
        );
      }
      return h;
    };

    // Memoized ListHeaderComponent
    const listHeaderComponent = useMemo(
      () => <>{renderHeader(header)}</>,
      [header]
    );

    if (isLoading) {
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
          {Array.from({ length: n }).map((_, key) => (
            <AnimatedCardTemplate index={key} key={key}>
              <AvatarCardTemplateSkeleton
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
            </AnimatedCardTemplate>
          ))}
        </ThemedView>
      );
    }

    if ((!news?.length || newsError) && !newsLoading) {
      if (hideIfEmpty) return null;
      return (
        <ThemedView transparent style={{ justifyContent: "center", flex: 1 }}>
          {renderHeader(header)}
          <EmptyData
            description={
              newsError
                ? formatErrorMessage(newsError)
                : "Geen nieuws beschikbaar."
            }
            actionText="Opnieuw"
            actionPress={handleRetry}
          />
        </ThemedView>
      );
    }

    if (!scrollable) {
      return (
        <Container>
          {renderHeader(header)}
          {newsWithDates.map(({ item, dateLabel }, idx) => (
            <NewsItem
              key={item.slug}
              item={item}
              dateLabel={dateLabel}
              cardProps={cardProps}
              onPress={handleNewsPress}
            />
          ))}
        </Container>
      );
    }

    return (
      <FlatList
        ref={listRef}
        data={newsWithDates}
        refreshControl={
          <RefreshControl onRefresh={handleRefresh} refreshing={isRefetching} />
        }
        style={listStyle}
        contentContainerStyle={contentContainerStyle}
        ListEmptyComponent={
          <Container flex={1} justify="center">
            <EmptyData
              description="Geen resultaten voor je zoekopdracht."
              actionText="Opnieuw"
              actionPress={handleRetry}
            />
          </Container>
        }
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        scrollEventThrottle={16}
        ListHeaderComponent={listHeaderComponent}
        // Performance optimizations - Platform-specific
        removeClippedSubviews={true}
        maxToRenderPerBatch={performanceProps.maxToRenderPerBatch}
        windowSize={performanceProps.windowSize}
        initialNumToRender={performanceProps.initialNumToRender}
        updateCellsBatchingPeriod={performanceProps.updateCellsBatchingPeriod}
      />
    );
  }
);

NewsListContainer.displayName = "NewsListContainer";

export default NewsListContainer;
