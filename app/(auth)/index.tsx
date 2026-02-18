import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { FlatList, ViewToken } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, useRouter } from "expo-router";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { DotsNavigator } from "@/components/ui/dots-navigator";
import { OnboardingSlideContainer } from "@/components/containers/onboarding/onboarding-slide-container";
import { SIZES, STORAGE_KEYS } from "@/constants";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

const width = SIZES.viewport.width;
const IMAGE_SIZE = width * 0.7;

const slides = [
  {
    id: "1",
    image: require("@/assets/images/repair-onboarding.png"),
    title: "Reparaties snel aanvragen",
    description:
      "Meld eenvoudig problemen en volg de status van je reparatieverzoeken in real-time.",
  },
  {
    id: "2",
    image: require("@/assets/images/financial-onboarding.png"),
    title: "Financiën overzichtelijk beheren",
    description:
      "Bekijk je huurbetalingen, facturen en openstaande saldo's in één duidelijk overzicht.",
  },
  {
    id: "3",
    image: require("@/assets/images/financial-onboarding.png"),
    title: "Direct contact met je corporatie",
    description:
      "Stel vragen, ontvang updates en communiceer eenvoudig met je woningcorporatie.",
  },
];

export default function OnboardingScreen() {
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const onboarded = await AsyncStorage.getItem(STORAGE_KEYS.HAS_ONBOARDED);
      setHasOnboarded(onboarded === "true");
    })();
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const {
    corpColors: { primary },
  } = useCorporateBranding();

  const finish = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, "true");
    router.replace("/(auth)/signin-screen");
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finish();
    }
  };

  const handleSkip = () => finish();

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

  // if (hasOnboarded === null) {
  //   return <ScreenLoader />;
  // }

  if (hasOnboarded || !hasOnboarded) {
    return <Redirect href="/(auth)/signin-screen" />;
  }

  return (
    <Container
      direction="vertical"
      justify="space-between"
      align="center"
      style={{
        flex: 1,
        paddingVertical: 60,
      }}
    >
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={({ item }) => (
          <Container style={{ width }}>
            <OnboardingSlideContainer
              image={item.image}
              title={item.title}
              description={item.description}
              imageSize={IMAGE_SIZE}
            />
          </Container>
        )}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={{ flex: 1 }}
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
        }}
        gap={20}
      >
        <DotsNavigator
          total={slides.length}
          activeIndex={currentIndex}
          dotSize={8}
          activeColor={primary}
          inactiveColor="#DDD"
        />

        <Container
          direction="horizontal"
          justify="space-between"
          style={{
            width: "100%",
            paddingHorizontal: 30,
          }}
        >
          {currentIndex < slides.length - 1 ? (
            <Button title="Overslaan" onPress={handleSkip} variant="gray" />
          ) : (
            <Container />
          )}
          <Button
            onPress={handleNext}
            title={currentIndex < slides.length - 1 ? "Volgende" : "Inloggen"}
          />
        </Container>
      </Container>
    </Container>
  );
}
