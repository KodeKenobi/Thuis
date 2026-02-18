import { ActionButton } from "@/components/ui/action-button";
import { Container } from "@/components/ui/container";
import { useAuth } from "@/contexts/auth-context";
import { useFetchLocalNews } from "@/service/news";
import { useFetchCases } from "@/service/cases";
import { router } from "expo-router";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

const HomeActionsContainer = () => {
  const { user } = useAuth();
  const { colors: { white } } = useCorporateBranding();
  const { news, newsLoading } = useFetchLocalNews({});
  const { cases, casesLoading } = useFetchCases({
    params: { subset: "open" },
  });

  return (
    <Container
      style={{
        backgroundColor: white,
        paddingHorizontal: 24,
        paddingVertical: 24,
      }}
      direction="horizontal"
      justify="space-between"
      gap={12}
    >
      <ActionButton
        icon={<Ionicons name="mail-outline" size={24} color="#000" />}
        label="Post"
        count={news?.length || 0}
        loading={newsLoading}
        color="#2563eb"
        onPress={() => {
          router.navigate("/(tabs)/posts-screen");
        }}
      />
      <ActionButton
        icon={<Ionicons name="document-text-outline" size={22} color="#000" />}
        label="Zaken"
        count={cases?.length || 0}
        loading={casesLoading}
        color={"#ea580c"}
        onPress={() => {
          router.navigate("/(tabs)/cases-screen");
        }}
      />
    </Container>
  );
};

export default HomeActionsContainer;
