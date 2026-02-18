import { BottomSheet, BottomSheetContent } from "@/components/ui/bottom-sheet";
import { ThemedText } from "@/components/ui/themed-text";
import React from "react";

const AllStepsContainer = ({
  open,
  close,
}: {
  open: boolean;
  close: () => void;
}) => {
  return (
    <BottomSheet open={open} onOpenChange={(open) => (!open ? close() : null)}>
      <BottomSheetContent>
        <ThemedText>All steps container</ThemedText>
      </BottomSheetContent>
    </BottomSheet>
  );
};

export default AllStepsContainer;
