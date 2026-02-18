import React from "react";
import { Container } from "@/components/ui/container";
import Skeleton from "@/components/ui/skeleton";
import { SIZES } from "@/constants";
import Card from "../ui/card";

const cardStyle = {
  borderRadius: SIZES.radius,
  padding: SIZES.padding / 1.5,
  marginVertical: 8,
};

const RecordCardSkeleton: React.FC = () => (
  <Card gap={8} style={cardStyle} variant="background">
    <Container
      direction="horizontal"
      justify="space-between"
      align="flex-start"
    >
      <Skeleton height={14} style={{ flex: 1, marginRight: 8 }} />
      <Skeleton height={18} width={52} />
    </Container>

    <Skeleton height={12} style={{ width: "40%" }} />

    <Skeleton height={10} style={{ width: "30%" }} />
  </Card>
);

export default RecordCardSkeleton;
