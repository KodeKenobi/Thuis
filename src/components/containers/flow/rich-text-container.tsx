import { Container } from "@/components/ui/container";
import { useTextStyles, ThemedText } from "@/components/ui/themed-text";
import React from "react";
import { Linking, StyleSheet } from "react-native";

// Helper to check if a block is empty
const isEmptyBlock = (block: TFlowRichTextBlock): boolean => {
  if (block.type !== "paragraph") return false;

  return (
    !block.content ||
    block.content.length === 0 ||
    block.content.every(
      (node) =>
        node.type === "hardBreak" ||
        (node.type === "text" && !node.text?.trim())
    )
  );
};

const RichTextContainer = ({ element }: { element: IFlowRichTextElement }) => {
  const textStyles = useTextStyles();
  const contentNodes = element.data?.content?.content;

  const renderContent = (nodes: any, keyPrefix: string): React.ReactNode[] => {
    if (!nodes) return [];

    return nodes.map((node: any, index: number) => {
      const key = `${keyPrefix}-${index}`;

      if (node.type === "hardBreak") {
        return "\n";
      }

      if (node.type === "text" && node.text) {
        let styleProps: Record<string, any> = {};
        let onPress: (() => void) | undefined;

        if (node.marks) {
          node.marks.forEach((mark: any) => {
            if (mark.type === "bold") styleProps.weight = "bold";
            if (mark.type === "italic")
              styleProps.style = [{ fontStyle: "italic" }, styleProps.style];
            if (mark.type === "underline")
              styleProps.style = [
                { textDecorationLine: "underline" },
                styleProps.style,
              ];
            if (mark.type === "link" && mark.attrs?.href) {
              styleProps = { ...styleProps, ...textStyles.link };
              onPress = () => Linking.openURL(mark.attrs.href);
            }
          });
        }

        return (
          <ThemedText key={key} {...styleProps} onPress={onPress}>
            {node.text}
          </ThemedText>
        );
      }

      // Handle nested blocks recursively
      if (
        node.type === "paragraph" ||
        node.type === "heading" ||
        node.type === "bulletList" ||
        node.type === "orderedList" ||
        node.type === "listItem"
      ) {
        return renderBlock(node, key);
      }

      return null;
    });
  };

  const renderBlock = (
    block: TFlowRichTextBlock,
    key: string
  ): React.ReactNode => {
    if (isEmptyBlock(block)) return null;

    if (block.type === "paragraph") {
      const isBreakOnly =
        block.content?.length === 1 && block.content[0].type === "hardBreak";

      return (
        <ThemedText
          key={key}
          {...textStyles.body}
          selectable
          style={isBreakOnly ? styles.breakOnly : undefined}
        >
          {renderContent(block.content, key)}
        </ThemedText>
      );
    }

    if (block.type === "heading") {
      const level = block.attrs?.level || 1;
      const size = level === 1 ? "xxl" : level === 2 ? "xl" : "md";
      const weight = level === 1 ? "bold" : level === 2 ? "semiBold" : "bold";

      return (
        <ThemedText key={key} size={size} weight={weight} selectable>
          {renderContent(block.content, key)}
        </ThemedText>
      );
    }

    if (block.type === "bulletList" && block.content) {
      return (
        <Container key={key} style={{ marginVertical: 4 }}>
          {block.content.map((item, i) =>
            item.type === "listItem" ? (
              <Container
                key={`${key}-item-${i}`}
                style={{ flexDirection: "row", alignItems: "flex-start" }}
              >
                <ThemedText style={{ marginRight: 8 }}>•</ThemedText>
                <ThemedText {...textStyles.body} style={{ flex: 1 }}>
                  {/* @ts-ignore */}
                  {renderContent(item?.content, `${key}-item-${i}`)}
                </ThemedText>
              </Container>
            ) : null
          )}
        </Container>
      );
    }

    if (block.type === "orderedList" && block.content) {
      return (
        <Container key={key} style={{ marginVertical: 4 }}>
          {block.content.map((item, i) =>
            item.type === "listItem" ? (
              <Container
                key={`${key}-item-${i}`}
                style={{ flexDirection: "row", alignItems: "flex-start" }}
              >
                <ThemedText style={{ marginRight: 8 }}>{`${
                  i + 1
                }.`}</ThemedText>
                <ThemedText {...textStyles.body} style={{ flex: 1 }}>
                  {/* @ts-ignore */}
                  {renderContent(item.content, `${key}-item-${i}`)}
                </ThemedText>
              </Container>
            ) : null
          )}
        </Container>
      );
    }

    return null;
  };

  // Filter out empty blocks before rendering
  const filteredNodes = contentNodes?.filter((block) => !isEmptyBlock(block));

  return (
    <Container gap={12}>
      {filteredNodes?.map((block, index) =>
        renderBlock(block, `block-${index}`)
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  breakOnly: {
    lineHeight: 8,
  },
});

export default RichTextContainer;
