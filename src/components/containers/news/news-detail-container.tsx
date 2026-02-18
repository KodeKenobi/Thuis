import React, { useMemo, useState } from "react";
import {
  ScrollView,
  Image,
  Linking,
  View,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from "react-native";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useFetchNewsById } from "@/service/news";
import { EmptyData } from "@/components/ui/empty-data";
import { Container } from "@/components/ui/container";
import { ThemedText, useTextStyles } from "@/components/ui/themed-text";
import Skeleton from "@/components/ui/skeleton";
import AnimatedReveal from "@/components/ui/animated-reveal";
import Card from "@/components/ui/card";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

interface Props {
  id: string;
}

const stamp = (iso: string) =>
  format(new Date(iso), "dd MMMM yyyy • HH:mm", { locale: nl });

function extractDatabalkMediaId(url?: string): string | undefined {
  if (!url) return;
  const m = url.match(/\/download\/media\/([A-Za-z0-9-]+)/);
  return m?.[1];
}

function normalizeUrl(url?: string): string | undefined {
  if (!url) return;
  if (/^(https?:\/\/)?(localhost|127\.0\.0\.1)/i.test(url)) return;
  if (/^http:\/\//i.test(url) && /databalk\.app/i.test(url)) {
    return url.replace(/^http:\/\//i, "https://");
  }
  if (/^http:\/\//i.test(url)) {
    return Platform.OS === "android" ? url : undefined;
  }
  return url;
}

function buildCandidates(url?: string): string[] {
  const n = normalizeUrl(url);
  if (!n) return [];

  const u = new URL(n);
  const id = extractDatabalkMediaId(n);
  const isDatabalk = /databalk\.app$/i.test(u.hostname);
  const out = [n];

  if (isDatabalk && id) {
    out.push(`https://api.iris-ontwikkel.databalk.app/download/media/${id}`);
    out.push(`https://api.iris.databalk.app/download/media/${id}`);
  }

  return Array.from(new Set(out));
}

const aspect = (w?: number, h?: number) =>
  w && h && w > 0 && h > 0 ? w / h : 16 / 9;

function renderRichText(
  doc?: IDocContent,
  textStyles?: ReturnType<typeof useTextStyles>
) {
  if (!doc?.content?.length) return null;
  const nodes: React.ReactNode[] = [];
  const walk = (node: IContentNode, key: string) => {
    switch (node.type) {
      case "heading": {
        const level = node.attrs?.level ?? 2;
        const text =
          (node.content ?? []).map((t) => t.text ?? "").join("") || "";
        nodes.push(
          <ThemedText
            key={key}
            weight="semiBold"
            style={{
              fontSize: Math.max(24 - (level - 1) * 2, 16),
              marginTop: 12,
              marginBottom: 6,
              lineHeight: 28,
            }}
          >
            {text}
          </ThemedText>
        );
        break;
      }
      case "paragraph": {
        const text =
          (node.content ?? []).map((t) => t.text ?? "").join("") || "";
        nodes.push(
          text.trim().length ? (
            <ThemedText
              key={key}
              {...(textStyles?.body || {})}
              style={{ lineHeight: 26 }}
            >
              {text}
            </ThemedText>
          ) : (
            <View key={key} style={{ height: 8 }} />
          )
        );
        break;
      }
      case "bulletList": {
        (node.content ?? []).forEach((li, i) => {
          const inner =
            (li.content ?? [])
              .map((p) => (p.content ?? []).map((t) => t.text ?? "").join(""))
              .join(" ") || "";
          nodes.push(
            <Container
              key={`${key}-${i}`}
              direction="horizontal"
              gap={8}
              align="flex-start"
              style={{ marginVertical: 2 }}
            >
              <ThemedText>•</ThemedText>
              <ThemedText
                {...(textStyles?.body || {})}
                style={{ flex: 1, lineHeight: 24 }}
              >
                {inner}
              </ThemedText>
            </Container>
          );
        });
        break;
      }
      default:
        break;
    }
  };
  doc.content.forEach((n, idx) => walk(n, `rt-${idx}`));
  return nodes;
}

async function openUrl(url?: string) {
  if (!url) return;
  try {
    await Linking.openURL(url);
  } catch {}
}

const NewsDetailContainer: React.FC<Props> = ({ id }) => {
  const textStyles = useTextStyles();
  const [isRefetching, setRefetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const { newsItem, newsItemLoading, newsItemError, newsItemRefetch } =
    useFetchNewsById({ id });
  const { colors: { grayishColor, background, primary } } = useCorporateBranding();

  const coverMeta = useMemo(() => {
    const candidates: Array<{ url?: string; width?: number; height?: number }> =
      [];
    if (Array.isArray(newsItem?.image)) {
      newsItem.image.forEach((img) =>
        candidates.push({
          url: img?.url,
          width: img?.width,
          height: img?.height,
        })
      );
    }
    if (Array.isArray(newsItem?.content)) {
      (newsItem?.content ?? []).forEach((b: any) => {
        if (b?.$component === "album") {
          const imgs = (b.images ?? []).flatMap((m: any) => m?.image ?? []);
          imgs.forEach((img: any) =>
            candidates.push({
              url: img?.url,
              width: img?.width,
              height: img?.height,
            })
          );
        }
      });
    }

    return candidates.find((c) => normalizeUrl(c.url));
  }, [newsItem?.image, newsItem?.content]);

  const candidateUrls = useMemo(
    () => buildCandidates(coverMeta?.url),
    [coverMeta?.url]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const blocks = useMemo(() => {
    if (!newsItem?.content) return [];
    if (Array.isArray(newsItem.content)) {
      return newsItem.content;
    }

    if ((newsItem.content as any).type === "doc") {
      return [
        {
          $component: "richText",
          content: newsItem.content as IDocContent,
        },
      ];
    }

    return [];
  }, [newsItem?.content]);

  const isLoading = loading || newsItemLoading;

  if (isLoading) {
    return (
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: background }}
      >
        <Card
          gap={16}
          variant="background"
          style={{ borderRadius: 16, padding: 20 }}
        >
          <Container direction="horizontal" align="center" gap={6}>
            <Skeleton width={16} height={16} />
            <Skeleton width={120} height={10} />
          </Container>
          <Skeleton width="100%" height={20} />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={12} />
          ))}
        </Card>
      </ScrollView>
    );
  }

  if (newsItemError || !newsItem) {
    return (
      <EmptyData
        title="Nieuwsbericht niet gevonden"
        description={(newsItemError as any)?.message ?? ""}
        actionText="Opnieuw"
        actionPress={() => {
          setLoading(true);
          newsItemRefetch().finally(() => setLoading(false));
        }}
      />
    );
  }

  const dateToShow =
    newsItem.publishStart || newsItem.publishedAt || newsItem.updatedAt;

  const renderBlock = (block: any, i: number) => {
    const comp = block?.$component;

    if (comp === "richText")
      return (
        <View key={`b-${i}`}>{renderRichText(block?.content, textStyles)}</View>
      );

    if (comp === "quote") {
      return (
        <View key={`b-${i}`} style={{ paddingVertical: 8 }}>
          <ThemedText style={{ fontStyle: "italic" }}>
            "{block?.content}"
          </ThemedText>
          {block?.caption ? (
            <ThemedText {...textStyles.gray} style={{ marginTop: 4 }}>
              — {block.caption}
            </ThemedText>
          ) : null}
        </View>
      );
    }

    if (comp === "informationBanner") {
      return (
        <View
          key={`b-${i}`}
          style={{
            padding: 12,
            borderRadius: 12,
            backgroundColor: `${primary}22`,
            borderLeftWidth: 4,
            borderLeftColor: primary,
            marginVertical: 8,
          }}
        >
          {block?.title?.value ? (
            <ThemedText weight="semiBold" style={{ marginBottom: 4 }}>
              {block.title.value}
            </ThemedText>
          ) : null}
          {typeof block?.content === "string" ? (
            <ThemedText {...textStyles.body}>{block.content}</ThemedText>
          ) : null}
        </View>
      );
    }

    if (comp === "linkOverview") {
      return (
        <View key={`b-${i}`} style={{ gap: 8, marginTop: 8 }}>
          {block?.title ? (
            <ThemedText weight="semiBold" style={{ marginBottom: 4 }}>
              {block.title}
            </ThemedText>
          ) : null}
          {(block?.links ?? []).map((lnk: any, idx: number) => {
            if (lnk?.$component === "link") {
              const label = lnk?.title || lnk?.url?.label || "Link";
              const external =
                lnk?.url?.type === "external"
                  ? (lnk?.url?.value as string)
                  : undefined;
              return (
                <TouchableOpacity
                  key={`lk-${i}-${idx}`}
                  onPress={() => openUrl(external)}
                >
                  <ThemedText
                    style={{
                      textDecorationLine: external ? "underline" : "none",
                    }}
                  >
                    {label}
                  </ThemedText>
                </TouchableOpacity>
              );
            }
            if (lnk?.$component === "richText") {
              return (
                <View key={`lk-rt-${i}-${idx}`}>
                  {renderRichText(lnk?.content, textStyles)}
                </View>
              );
            }
            return null;
          })}
        </View>
      );
    }

    if (comp === "buttonOverview") {
      return (
        <Container key={`b-${i}`} gap={8} style={{ marginTop: 8 }}>
          {(block?.buttons ?? []).map((btn: any, bi: number) => {
            const label = btn?.url?.label || "Open";
            const external =
              btn?.url?.type === "external"
                ? (btn?.url?.value as string)
                : undefined;
            const disabled = !external;
            return (
              <TouchableOpacity
                key={`btn-${i}-${bi}`}
                onPress={() => openUrl(external)}
                disabled={disabled}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: disabled ? "#00000011" : `${primary}22`,
                }}
              >
                <ThemedText weight="semiBold" style={{ textAlign: "center" }}>
                  {label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </Container>
      );
    }

    if (comp === "album") {
      const images: any[] = (block?.images ?? []).flatMap(
        (m: any) => m?.image ?? []
      );
      const safe = images
        .map((img) => ({ ...img, url: normalizeUrl(img?.url) }))
        .filter((img) => !!img.url);
      if (!safe.length) return null;
      return (
        <View
          key={`b-${i}`}
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 8,
          }}
        >
          {safe.map((img: any, ii: number) => (
            <Image
              key={`alb-${i}-${ii}`}
              source={{ uri: img.url }}
              style={{
                width: "48%",
                aspectRatio: aspect(img?.width, img?.height),
                borderRadius: 10,
              }}
              resizeMode="cover"
            />
          ))}
        </View>
      );
    }

    return null;
  };

  const activeUrl = candidateUrls[activeIndex];

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: background }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            setRefetching(true);
            newsItemRefetch().finally(() => setRefetching(false));
          }}
        />
      }
    >
      <AnimatedReveal>
        <Card
          gap={16}
          variant="background"
          style={{ borderRadius: 16, padding: 20 }}
        >
          <Container direction="horizontal" align="center" gap={6}>
            <Ionicons name="time-outline" size={16} color={grayishColor} />
            {dateToShow ? (
              <ThemedText {...textStyles.caption}>
                {stamp(dateToShow)}
              </ThemedText>
            ) : null}
          </Container>

          <ThemedText weight="bold" style={{ fontSize: 24, lineHeight: 30 }}>
            {newsItem.title}
          </ThemedText>

          {!!activeUrl && (
            <Image
              source={{ uri: activeUrl }}
              style={{
                width: "100%",
                aspectRatio: aspect(coverMeta?.width, coverMeta?.height),
                borderRadius: 12,
                marginTop: 4,
              }}
              resizeMode="cover"
              onError={() => {
                setActiveIndex((i) =>
                  i + 1 < candidateUrls.length ? i + 1 : i + 1
                );
              }}
            />
          )}

          {blocks.map((block: any, i: number) => renderBlock(block, i))}
        </Card>
      </AnimatedReveal>
    </ScrollView>
  );
};

export default NewsDetailContainer;
