import React, { ReactNode } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";

import { Container } from "../ui/container";
import { AvatarSkeleton, AvatarSkeletonProps } from "../ui/avatar";
import Skeleton from "../ui/skeleton";
import Card, { CardProps } from "../ui/card";

type AvatarCardTemplateSkeletonProps = CardProps & {
  showArrow?: boolean;
  avatar?: AvatarSkeletonProps;
};

const AvatarCardTemplateSkeleton = ({
  avatar,
  children,
  showArrow,
  ...props
}: AvatarCardTemplateSkeletonProps) => {
  return (
    <Card
      direction="horizontal"
      justify="space-between"
      align="center"
      gap={12}
      {...props}
    >
      <Container direction="horizontal" align="center" gap={12}>
        <AvatarSkeleton {...avatar} />
        <Container gap={6} style={{ flex: 1 }}>
          {children ?? (
            <>
              <Skeleton height={14} style={{ width: "80%" }} />
              <Skeleton height={10} style={{ width: "40%" }} />
            </>
          )}
        </Container>
      </Container>
      {showArrow && (
        <Skeleton height={16} style={{ width: 16, borderRadius: 4 }} />
      )}
    </Card>
  );
};

export default AvatarCardTemplateSkeleton;
