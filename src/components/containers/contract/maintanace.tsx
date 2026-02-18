import React, { useMemo } from "react";
import { View } from "react-native";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";

import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
} from "@/components/ui/bottom-sheet";
import { DetailContentGroup } from "@/components/ui/detail-content";
import { SIZES } from "@/constants";
import { useFetchMaintananceDetail } from "@/service/maintanance";
import Skeleton from "@/components/ui/skeleton";
import { ComponentProfiler } from "@/utils/component-profiler";

interface MaintanaceProps {
  selectedMaintanance: IMaintenance | null;
  close: () => void;
}

const Maintanace = ({ selectedMaintanance, close }: MaintanaceProps) => {
  const id = selectedMaintanance?.id;

  const { maintananceDetail, maintananceDetailLoading } =
    useFetchMaintananceDetail({ id });
  const isInitialLoading =
    !!id && maintananceDetailLoading && !maintananceDetail;

  const detail = useMemo(
    () => maintananceDetail || selectedMaintanance || null,
    [maintananceDetail, selectedMaintanance]
  );

  const formattedReportDate =
    detail?.melddatum &&
    format(new Date(detail.melddatum), "EEEE dd MMMM yyyy", {
      locale: nl,
    });

  const firstOrder = (maintananceDetail?.onderhoudsorders || [])[0];

  const plannedRaw =
    firstOrder?.begindatum || firstOrder?.uitersteGereeddatum || null;

  const formattedPlannedDate =
    plannedRaw &&
    format(new Date(plannedRaw), "EEEE dd MMMM yyyy", {
      locale: nl,
    });

  const items =
    detail === null
      ? []
      : [
          ...(detail?.omschrijving
            ? [
                {
                  label: "Omschrijving",
                  content: detail.omschrijving || "",
                },
              ]
            : []),

          {
            label: "Gemeld op",
            content: formattedReportDate || "",
          },

          {
            label: "Status",
            content: detail?.status?.naam || "",
          },

          ...(formattedPlannedDate
            ? [
                {
                  label: "Gepland op",
                  content: formattedPlannedDate,
                },
              ]
            : []),
        ];

  return (
    <BottomSheet
      open={!!id}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      snapPoints={["70%"]}
    >
      <BottomSheetContent>
        <ComponentProfiler componentName="MaintananceDetailContainer">
          <BottomSheetHeader title="Reparatie details" />
          <BottomSheetScrollView
            contentContainerStyle={{
              padding: SIZES.padding,
              gap: SIZES.padding,
              paddingTop: 50,
              flexGrow: 1,
            }}
          >
            <DetailContentGroup
              items={items.map((item) => ({
                ...item,
                content: isInitialLoading ? (
                  <Skeleton width="100%" height={20} />
                ) : (
                  item.content
                ),
              }))}
              direction="vertical"
              detailItemDirection="vertical"
              columns={1}
            />
          </BottomSheetScrollView>
        </ComponentProfiler>
      </BottomSheetContent>
    </BottomSheet>
  );
};

export default Maintanace;
