import { BottomSheetClose } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ButtonToggle } from "@/components/ui/button-toggle";
import { Container } from "@/components/ui/container";
import React, { useState } from "react";
import { ScrollView } from "react-native";
import { TitleContainer } from "./title-container";
import { SIZES } from "@/constants";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

const RestoreContainer = ({
  currentSnapshots,
  handleRestore,
  isRestoreFlowLoading,
}: IUseFlowReturn) => {
  const [selectedSnapshot, setSelectedSnapshot] = useState("");
  const { colors: { background, grayishColor } } = useCorporateBranding();
  const renderFooter = () => {
    return (
      <Container flex={1}>
        <ScrollView
          style={{
            padding: SIZES.padding,
            backgroundColor: background,
          }}
        >
          <ButtonToggle
            items={currentSnapshots?.map((snapshot) => ({
              id: snapshot?.snapshotKey,
              label: (
                <TitleContainer
                  style={{
                    marginBottom: 0,
                    padding: 16,
                    width: "100%",
                  }}
                  textStyle={{
                    fontSize: 16,
                    color: grayishColor,
                  }}
                  element={snapshot?.elements?.[0]}
                />
              ),
            }))}
            selected={selectedSnapshot}
            isMulti={false}
            onSelect={(snapshot) => setSelectedSnapshot(snapshot)}
          />
        </ScrollView>

        <Container
          flex={1}
          direction="horizontal"
          gap={12}
          style={{
            padding: SIZES.padding,
            borderTopWidth: 1,
            borderTopColor: "#f0f0f0",
          }}
        >
          <BottomSheetClose asChild>
            <Button
              title="Vorige"
              variant="outlined"
              disabled={isRestoreFlowLoading}
            />
          </BottomSheetClose>
          <Button
            title="Herstellen"
            disabled={isRestoreFlowLoading || !selectedSnapshot}
            loading={isRestoreFlowLoading}
            onPress={() => handleRestore(selectedSnapshot)}
            style={{
              flex: 1,
            }}
          />
        </Container>
      </Container>
    );
  };

  return <Container>{renderFooter()}</Container>;
};

export default RestoreContainer;
