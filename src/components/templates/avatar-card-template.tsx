import React from "react";
import { Container } from "../ui/container";
import Avatar, { AvatarProps } from "../ui/avatar";
import { ThemedText, useTextStyles } from "../ui/themed-text";
import Card, { CardProps } from "../ui/card";

export type AvatarCardTemplateProps = CardProps & {
  avatar?: AvatarProps;
  showArrow?: boolean;
  showAvatar?: boolean;
};

// Memoize static style objects to avoid recreation
const avatarContainerStyle = { flex: 1, minWidth: 0, flexShrink: 1 };
const contentContainerStyle = { flex: 1, minWidth: 0, flexShrink: 1 };

const AvatarCardTemplate = React.memo(
  ({
    avatar,
    children,
    showArrow = true,
    showAvatar = true,
    ...props
  }: AvatarCardTemplateProps) => {
    const textStyles = useTextStyles();
    return (
      <Card
        direction="horizontal"
        justify="space-between"
        align="center"
        gap={12}
        {...props}
      >
        <Container
          direction="horizontal"
          align="center"
          gap={12}
          style={avatarContainerStyle}
        >
          {showAvatar ? <Avatar {...avatar} /> : null}
          <Container style={contentContainerStyle}>{children}</Container>
        </Container>
        {showArrow ? (
          <ThemedText {...textStyles.gray}>{"\u203A"}</ThemedText>
        ) : null}
      </Card>
    );
  }
);

AvatarCardTemplate.displayName = "AvatarCardTemplate";

export default AvatarCardTemplate;
