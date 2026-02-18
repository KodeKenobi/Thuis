import React from "react";
import { router } from "expo-router";

import SectionTemplate from "@/components/templates/section-template";
import { Button } from "@/components/ui/button";
import NewsListContainer from "../news/news-list-container";
import { useFetchLocalNews } from "@/service/news";

const HomeNewsListContainer = () => {
  const { news, newsError, newsLoading } = useFetchLocalNews({
    options: {},
  });

  if (!news?.length || (newsLoading && newsError)) return null;
  return (
    <SectionTemplate
      title="Nieuws"
      action={
        <Button
          variant="link"
          title="meer"
          onPress={() => router.push("/news/news-screen")}
        />
      }
    >
      <NewsListContainer
        cardProps={{
          variant: "default",
        }}
        n={2}
        hideIfEmpty
      />
    </SectionTemplate>
  );
};

export default HomeNewsListContainer;
