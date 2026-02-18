import { Badge } from "@/components/ui/badge";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
} from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { DetailContentGroup } from "@/components/ui/detail-content";
import { variantToBadge } from "@/components/ui/record-card";
import { ThemedText } from "@/components/ui/themed-text";
import { SIZES } from "@/constants";
import { useCaseComment } from "@/service/cases";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { CustomBottomSheetTextInput } from "@/components/ui/bottom-sheet-text-input";

import { ComponentProfiler } from "@/utils/component-profiler";

type FormData = { subject: string; description: string };
type FormErrors = { subject?: string; description?: string };

type CaseCommentContainerProps = {
  selectedCase: ICase | null;
  onClose: () => void;
};

const CaseCommentContainer = ({
  selectedCase,
  onClose,
}: CaseCommentContainerProps) => {
  const formattedCreatedDate =
    selectedCase?.createdon &&
    format(new Date(selectedCase?.createdon), "dd MMMM yyyy HH:mm", {
      locale: nl,
    });

  const formattedUpdatedAtDate =
    selectedCase?.modifiedon &&
    format(new Date(selectedCase?.modifiedon), "dd MMMM yyyy HH:mm", {
      locale: nl,
    });
  const [openLeaveComment, setOpenLeaveComment] = useState(false);
  const [form, setForm] = useState<FormData>({ subject: "", description: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const { leaveComment, leaveCommentLoading, leaveCommentReset } =
    useCaseComment(selectedCase?.id || "");

  const reset = () => {
    setForm({ subject: "", description: "" });
    setErrors({});
    leaveCommentReset();
    setOpenLeaveComment(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.subject.trim()) newErrors.subject = "Vul een onderwerp in";
    if (!form.description.trim())
      newErrors.description = "Vul een beschrijving in";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    leaveComment(form).then(() => {
      reset();
    });
  };

  return (
    <BottomSheet
      open={!!selectedCase}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      snapPoints={["75%", "90%"]}
      footer={({}) => {
        return (
          <Container
            style={styles.footer}
            direction="horizontal"
            align="center"
            justify="space-between"
            gap={16}
          >
            <Button
              title={"Annuleren"}
              variant="outlined"
              disabled={leaveCommentLoading}
              onPress={!openLeaveComment ? onClose : reset}
            />
            <Button
              title={leaveCommentLoading ? "Verzenden..." : "Verstuur Reactie"}
              onPress={
                openLeaveComment
                  ? handleSubmit
                  : () => setOpenLeaveComment(true)
              }
              disabled={leaveCommentLoading}
              style={{
                flex: 1,
              }}
            />
          </Container>
        );
      }}
    >
      <BottomSheetContent>
        <ComponentProfiler componentName="CaseCommentContainer">
          <BottomSheetHeader title="Zaak Details" />
          <BottomSheetScrollView
            enableFooterMarginAdjustment
            keyboardShouldPersistTaps="handled"
          >
            {openLeaveComment ? (
              <Container
                gap={20}
                style={{ padding: SIZES.padding, paddingTop: 50 }}
              >
                <ThemedText>Laat een reactie achter</ThemedText>

                <CustomBottomSheetTextInput
                  label="Onderwerp"
                  placeholder="Onderwerp"
                  value={form.subject}
                  onChangeText={(text) =>
                    setForm((f) => ({ ...f, subject: text }))
                  }
                  error={errors.subject}
                />
                <CustomBottomSheetTextInput
                  label="Beschrijving"
                  placeholder="Beschrijving"
                  multiline
                  style={{ minHeight: 150 }}
                  inputStyle={{ height: "auto", borderRadius: 10 }}
                  value={form.description}
                  onChangeText={(text) =>
                    setForm((f) => ({ ...f, description: text }))
                  }
                  error={errors.description}
                />
              </Container>
            ) : null}
            {!openLeaveComment && selectedCase ? (
              <Container
                gap={20}
                style={{ padding: SIZES.padding, paddingTop: 50 }}
              >
                <DetailContentGroup
                  direction="vertical"
                  detailItemDirection="vertical"
                  columns={1}
                  items={[
                    {
                      label: "Titel",
                      content: selectedCase?.title,
                    },
                    {
                      label: "Ticket nummer",
                      content: selectedCase?.ticketnumber,
                    },
                    ...(selectedCase?.status?.code
                      ? [
                          {
                            label: "Status",
                            content: (
                              <Badge
                                variant={
                                  variantToBadge[
                                    // @ts-ignore
                                    selectedCase?.status?.code === "0"
                                      ? "open"
                                      : "resolved"
                                  ]
                                }
                              >
                                {selectedCase?.status.label}
                              </Badge>
                            ),
                          },
                        ]
                      : []),
                    ...(formattedCreatedDate
                      ? [
                          {
                            label: "Gemaakt op",
                            content: formattedCreatedDate,
                          },
                        ]
                      : []),
                    ...(formattedUpdatedAtDate
                      ? [
                          {
                            label: "Gewijzigd op",
                            content: formattedUpdatedAtDate,
                          },
                        ]
                      : []),

                    {
                      label: "Zaak type",
                      content: selectedCase?.casetype?.label,
                    },
                    {
                      label: "Onderwerp",
                      content: selectedCase?.subject?.label,
                    },
                  ]}
                />
              </Container>
            ) : null}
          </BottomSheetScrollView>
        </ComponentProfiler>
      </BottomSheetContent>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});

export default CaseCommentContainer;
