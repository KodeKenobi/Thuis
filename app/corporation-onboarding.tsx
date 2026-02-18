import React, { useCallback, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Redirect, router } from "expo-router";
import { Container } from "@/components/ui/container";
import { useGetTenants } from "@/service/tenants";
import { FlatList, ViewToken, ListRenderItem } from "react-native";
import { DotsNavigator } from "@/components/ui/dots-navigator";
import { OnboardingSlideContainer } from "@/components/containers/onboarding/onboarding-slide-container";
import { SIZES, API_URL } from "@/constants";
import { Button } from "@/components/ui/button";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ui/themed-text";
import ScreenLoader from "@/components/ui/screen-loader";
import { useTheme } from "@/contexts/theme-context";
import { COLORS } from "@/constants/colors";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

const width = SIZES.viewport.width;
const IMAGE_SIZE = width * 0.7;

const CorporationOnboarding = () => {
  const { updateCorporationOnboarded, corporationOnboarded, user } = useAuth();

  const {
    corpColors: { primary },
  } = useCorporateBranding();

  const { tenants, tenantsLoading } = useGetTenants({
    querykeySuffix: "corporation-onboarding",
  });

  const { theme } = useTheme();

  const tenant = useMemo(() => {
    return tenants?.find((tenant) => tenant.name === user?.corporationName);
  }, [tenants, user?.corporationName]);

  // Gradient colors based on theme
  const gradientColors = useMemo(() => {
    return [primary || "", primary || ""] as const;
  }, [primary]);

  // Get logo (same logic as home page)
  const logo = useMemo(() => {
    let logoUrl = tenant?.logo;

    if (theme === "dark") {
      logoUrl = tenant?.logoAlt;
      if (!logoUrl) {
        logoUrl = user?.corporation?.logoAlt;
      }
    }

    if (!tenant) {
      logoUrl = user?.corporation?.logo;
    }

    if (logoUrl) {
      return `${API_URL?.replace("/api/v1", "")}${logoUrl}`;
    }
    return null;
  }, [tenant, user?.corporation]);

  const handleFinish = async () => {
    await updateCorporationOnboarded({
      id: user?.custId || "",
      corporationName: user?.corporationName || "",
    });
    router.replace("/(tabs)");
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<any>>(null);

  const handleNext = () => {
    if (currentIndex < (tenant?.onboardingScreens || [])?.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToOffset({
        offset: width * nextIndex,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => handleFinish();

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 50,
    }),
    [],
  );

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  // Show loader while tenants are loading to prevent crashes from undefined values
  if (tenantsLoading) {
    return <ScreenLoader />;
  }

  if (
    (corporationOnboarded?.id === user?.custId &&
      user?.corporationName === corporationOnboarded?.corporationName) ||
    !tenant?.onboardingScreens?.length
  ) {
    return <Redirect href="/(tabs)" />;
  }

  const onboardingScreens = tenant?.onboardingScreens || [];

  const renderItem: ListRenderItem<ITenant["onboardingScreens"][0]> = ({
    item,
  }) => {
    return (
      <Container style={{ width: width, height: "100%" }}>
        <OnboardingSlideContainer
          image={{ uri: "" }}
          title={item.title || "No title"}
          description={item.subTitle || "No description"}
          imageSize={IMAGE_SIZE}
          titleTextStyle={{ style: { color: tenant?.assets?.accent?.["50"] } }}
          descriptionTextStyle={{
            style: { color: tenant?.assets?.accent?.["50"] },
          }}
        />
      </Container>
    );
  };

  if (!onboardingScreens.length) {
    return (
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flex: 1,
        }}
      >
        <Container
          direction="vertical"
          justify="center"
          align="center"
          style={{ flex: 1, padding: 20 }}
        >
          <ThemedText>No onboarding screens available</ThemedText>
        </Container>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        flex: 1,
      }}
    >
      <Container
        direction="vertical"
        align="center"
        style={{
          flex: 1,
          paddingTop: 60,
          paddingBottom: 40,
        }}
      >
        {/* Corporation Logo */}
        {logo && (
          <Container
            style={{
              height: 32,
              width: "100%",
              paddingHorizontal: 20,
              marginBottom: 20,
            }}
          >
            <Image
              source={{ uri: logo }}
              style={{
                height: 32,
                width: "100%",
                alignSelf: "center",
              }}
              tintColor={tenant?.assets?.accent?.["50"]}
              contentFit="contain"
              contentPosition="center"
            />
          </Container>
        )}

        <FlatList
          ref={flatListRef}
          data={onboardingScreens}
          renderItem={renderItem}
          keyExtractor={(item, index) => {
            return item.title || `screen-${index}`;
          }}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          style={{ flex: 1, width: "100%" }}
          contentContainerStyle={{
            alignItems: "stretch",
            width: width * onboardingScreens.length,
          }}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          scrollEventThrottle={16}
        />

        <Container
          direction="vertical"
          align="center"
          style={{
            width: "100%",
            paddingTop: 8,
          }}
          gap={16}
        >
          <DotsNavigator
            total={onboardingScreens.length}
            activeIndex={currentIndex}
            dotSize={8}
            activeColor={tenant?.assets?.accent?.["500"]}
            inactiveColor="#DDD"
          />

          <Container
            direction="horizontal"
            justify="space-between"
            style={{
              width: "100%",
              paddingHorizontal: 30,
              paddingBottom: 20,
            }}
          >
            {currentIndex < onboardingScreens.length - 1 ? (
              <Button
                title="Overslaan"
                onPress={handleSkip}
                variant="text"
                textColor="white"
              />
            ) : (
              <Container />
            )}
            <Button
              onPress={handleNext}
              style={{
                backgroundColor: COLORS.light.secondary,
              }}
              variant={theme === "dark" ? "secondary" : "secondary"}
              title={
                currentIndex < onboardingScreens.length - 1
                  ? "Volgende"
                  : "Klaar"
              }
            />
          </Container>
        </Container>
      </Container>
    </LinearGradient>
  );
};

export default CorporationOnboarding;
