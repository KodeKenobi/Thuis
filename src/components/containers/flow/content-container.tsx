import React, { useEffect, useMemo, useRef } from "react";
import { StyleSheet } from "react-native";
import { Container } from "@/components/ui/container";
import RichTextContainer from "./rich-text-container";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Checkbox,
  CheckboxGroup,
  CheckboxItem,
} from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { FileUploader, FileAsset } from "@/components/ui/file-uploader";
import { ButtonToggle } from "@/components/ui/button-toggle";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import Card from "@/components/ui/card";
import { FlowListElement } from "./flow-list-element-container";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { router } from "expo-router";
import { useGetFlowDefinition } from "@/service/flows";
import { useAuth } from "@/contexts/auth-context";

function hasData(el: any): el is { data: any } {
  return el && typeof el === "object" && "data" in el;
}
function hasOutputKey(d: any): d is { outputKey: string } {
  return (
    d &&
    typeof d === "object" &&
    "outputKey" in d &&
    typeof d.outputKey === "string"
  );
}
function isSelect(el: any): boolean {
  return (
    el?.type === "select" &&
    hasData(el) &&
    el.data &&
    Array.isArray(el.data.list)
  );
}
function isInput(el: any): boolean {
  return el?.type === "input" && hasData(el) && el.data;
}
function isCheckbox(el: any): boolean {
  return el?.type === "checkbox" && hasData(el) && el.data;
}
function isDateInput(el: any): boolean {
  return el?.type === "date-input" && hasData(el) && el.data;
}
function isFile(el: any): boolean {
  return el?.type === "file" && hasData(el) && el.data;
}
function isList(el: any): boolean {
  return (
    el?.type === "list" &&
    hasData(el) &&
    el.data &&
    Array.isArray(el.data.items)
  );
}

const extractFlowCodeFromHref = (href?: string): string | undefined => {
  if (!href) return;
  try {
    const noHash = href.split("#")[0];
    const pathOnly = noHash.replace(/^https?:\/\/[^/]+/i, "");
    const cleanPath = pathOnly.split("?")[0];
    const parts = cleanPath.split("/").filter(Boolean);
    const idx = parts.findIndex(
      (p) => p.toLowerCase() === "flow" || p.toLowerCase() === "flows"
    );
    if (idx !== -1 && parts[idx + 1]) return decodeURIComponent(parts[idx + 1]);
  } catch {}
  return;
};

const resolveFlowCode = (href?: string, data?: any): string | undefined => {
  const byUrl = extractFlowCodeFromHref(href);
  if (byUrl && byUrl.startsWith("CUS_")) return byUrl;

  const explicit =
    (data?.code && String(data.code)) ||
    (data?.outputKey && String(data.outputKey));
  if (explicit && String(explicit).startsWith("CUS_")) return String(explicit);

  return undefined;
};

function getSampleForPattern(pattern: string): string | undefined {
  if (
    /email|@/.test(pattern) ||
    pattern.includes("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/")
  )
    return "bijv. naam@email.com";
  if (/\d{4}\s?[A-Z]{2}/.test(pattern)) return "bijv. 1234 AB";
  if (/^\d{10}$/.test(pattern)) return "bijv. 0612345678";
  if (/^\d{2}-\d{2}-\d{4}$/.test(pattern)) return "bijv. 01-01-2024";
  if (/^\d+$/.test(pattern)) return "bijv. 12345";
  return undefined;
}

const FlowLink: React.FC<{ element: any }> = ({ element }) => {
  const href =
    (element?.data && (element.data["@url"] || element.data.url)) || "";
  const text =
    (element?.data && (element.data.text || element.data["@text"])) || "Openen";

  const isHttp = typeof href === "string" && /^https?:\/\//i.test(href);
  const flowCode = resolveFlowCode(href, element?.data);

  const { definition, definitionLoading, definitionError } =
    useGetFlowDefinition(flowCode || "", {
      enabled: !!flowCode,
      gcTime: 0,
      staleTime: 0,
    });
  const available = !!definition && !definitionError;

  const goToFlow = () => {
    if (!flowCode) return;
    router.push({
      pathname: "/flows/[id]",
      params: {
        id: String(flowCode),
        code: String(flowCode),
        flowCode: String(flowCode),
        defaultLabel: text || "Flow",
      },
    });
  };

  if (isHttp && !flowCode) {
    return (
      <Container gap={6}>
        <Button
          variant="link"
          title={text}
          style={{ width: "auto", opacity: 0.5 }}
          disabled
        />
        <ThemedText style={{ opacity: 0.7 }}>
          Deze link verwijst naar een webpagina buiten de app.
        </ThemedText>
      </Container>
    );
  }

  if (flowCode) {
    if (definitionLoading) {
      return (
        <Container gap={6}>
          <Button
            variant="link"
            title={text}
            style={{ width: "auto", opacity: 0.5 }}
            disabled
          />
          <ThemedText style={{ opacity: 0.7 }}>
            Controleren of deze optie beschikbaar is…
          </ThemedText>
        </Container>
      );
    }

    if (!available) {
      return (
        <Container gap={6}>
          <Button
            variant="link"
            title={text}
            style={{ width: "auto", opacity: 0.5 }}
            disabled
          />
          <ThemedText style={{ opacity: 0.7 }}>
            Deze optie is (nog) niet beschikbaar in uw app. Kies een alternatief
            via het startscherm
          </ThemedText>
        </Container>
      );
    }

    return (
      <Container gap={6}>
        <ThemedText selectable>
          Deze stap verwijst naar een andere dialoog. Je blijft in de app.
        </ThemedText>
        <Button
          variant="link"
          title={text}
          style={{ width: "auto" }}
          onPress={goToFlow}
        />
      </Container>
    );
  }

  return (
    <Container gap={6}>
      <Button
        variant="link"
        title={text}
        style={{ width: "auto", opacity: 0.5 }}
        disabled
      />
      <ThemedText style={{ opacity: 0.7 }}>
        We kunnen de juiste dialoog niet bepalen. Kies via het startscherm.
      </ThemedText>
    </Container>
  );
};

interface ContentContainerProps {
  elements: TFlowElement[];
  formData: Record<string, any>;
  formErrors: Record<string, string>;
  onElementChange: (outputKey: string, value: any) => void;
  showLabel?: boolean;
  renderFields?: boolean;
  isAuthFlow?: boolean;
}

export const ContentContainer: React.FC<ContentContainerProps> = ({
  elements = [],
  formData,
  formErrors,
  onElementChange,
  showLabel,
  renderFields = true,
  isAuthFlow,
}) => {
  const { colors: { theme } } = useCorporateBranding();
  const isDark = theme === "dark";

  // ---- Prefill email once (safe) ----
  const { user, userData } = useAuth();
  const loginEmail = useMemo(
    () =>
      userData?.emailaddress1 ||
      (user as any)?.email ||
      (user as any)?.loginName ||
      "",
    [userData?.emailaddress1, user]
  );
  const prefilledOnce = useRef(false);

  useEffect(() => {
    if (prefilledOnce.current) return;
    if (!elements?.length) return;
    if (!loginEmail) return;

    const emailEl = elements.find((el: any) => {
      if (!isInput(el)) return false;
      const key = String(el?.data?.outputKey ?? "").toLowerCase();
      const type = String(el?.data?.inputType ?? "").toLowerCase();
      const label = String(
        el?.data?.label ?? el?.data?.["@label"] ?? ""
      ).toLowerCase();
      return (
        key === "email" || type.includes("email") || label.includes("email")
      );
    });

    if (!emailEl || !hasOutputKey(emailEl.data)) return;

    const outputKey = emailEl.data.outputKey;
    const current = formData?.[outputKey];

    if (!current || String(current).trim().length === 0) {
      // onElementChange(outputKey, loginEmail);
      prefilledOnce.current = true;
    }
  }, [elements, formData, loginEmail, onElementChange]);

  if (!elements.length) return null;

  const otherElements = elements?.filter((el) => el?.type !== "title");
  const hasVisibleCardElements = otherElements.some((el) => {
    if (el?.type === "rich-text") return true;
    if (el?.type === "display") return true;
    return renderFields;
  });

  return (
    <Container gap={24}>
      {hasVisibleCardElements && (
        <Card
          variant={isAuthFlow ? "default" : "background"}
          style={[isAuthFlow ? { borderRadius: 0 } : { borderRadius: 12 }]}
        >
          <Container gap={16}>
            {otherElements.map((element: any, idx: number) => {
              if (element?.type === "rich-text") {
                return (
                  <RichTextContainer
                    element={element}
                    key={element?.type + idx}
                  />
                );
              }

              if (element?.type === "display") {
                return (
                  <ThemedText
                    key={element?.type + (element?.data?.text || idx)}
                    selectable
                  >
                    {element?.data?.text}
                  </ThemedText>
                );
              }

              if (!renderFields) return null;

              /* -------- SELECT -------- */
              if (isSelect(element)) {
                const items = (element.data.list || []).map((opt: any) => ({
                  id: opt.value,
                  label: opt["@text"] || opt.text || opt.value,
                }));
                const outputKey = hasOutputKey(element.data)
                  ? element.data.outputKey
                  : undefined;
                const placeholder =
                  element.properties?.placeholder || "Selecteer een item";
                const label =
                  element.data["label"] ||
                  element.data["@label"] ||
                  placeholder;

                if (!outputKey) return null;

                if (items.length > 0 && items.length <= 4) {
                  const isMulti = !!element.data.isMulti;
                  return (
                    <ButtonToggle
                      key={element?.type + idx}
                      items={items}
                      isMulti={isMulti}
                      selected={
                        isMulti
                          ? Array.isArray(formData[outputKey])
                            ? formData[outputKey]
                            : []
                          : formData[outputKey] || ""
                      }
                      onSelect={(val: string | string[]) =>
                        onElementChange(outputKey, val)
                      }
                      label={showLabel ? label : null}
                      required={element.data.required}
                      error={formErrors[outputKey]}
                    />
                  );
                }

                return (
                  <Select
                    key={element?.type + idx}
                    items={items}
                    value={
                      items.find(
                        (item: any) => item.id === formData[outputKey]
                      ) || null
                    }
                    onValueChange={(val) =>
                      onElementChange(outputKey, val ? val.id : null)
                    }
                    placeholder={placeholder}
                    label={showLabel ? label : null}
                    required={element.data.required}
                    error={formErrors[outputKey]}
                    {...(isDark ? { variant: "outline" } : {})}
                  />
                );
              }

              /* -------- INPUT -------- */
              if (isInput(element)) {
                const outputKey = hasOutputKey(element.data)
                  ? element.data.outputKey
                  : undefined;
                const label =
                  element.data["label"]?.trim() ||
                  element.data["@label"] ||
                  element?.data?.outputKey;

                let placeholder = element.properties?.placeholder || label;

                if (!element.properties?.placeholder && element.data?.pattern) {
                  const sample = getSampleForPattern(element.data.pattern);
                  if (sample) placeholder = sample;
                }

                if (!outputKey) return null;

                return (
                  <Input
                    key={element?.type + idx}
                    numberOfLines={
                      element?.properties?.rows
                        ? +element?.properties?.rows
                        : undefined
                    }
                    value={formData[outputKey] || ""}
                    onChangeText={(val) => onElementChange(outputKey, val)}
                    placeholder={placeholder}
                    label={showLabel ? label || "" : null}
                    required={element.data.required}
                    multiline={element?.properties?.rows > 1}
                    inputStyle={
                      element?.properties?.rows > 1
                        ? { height: "auto" }
                        : undefined
                    }
                    style={
                      element?.properties?.rows > 1
                        ? { minHeight: 100, height: "auto" }
                        : undefined
                    }
                    error={(() => {
                      const err = formErrors[outputKey];
                      if (
                        err &&
                        err.toLowerCase().includes("ongeldig formaat") &&
                        element.data?.pattern
                      ) {
                        const sample = getSampleForPattern(
                          element.data.pattern
                        );
                        if (sample) return `Ongeldig formaat (${sample})`;
                      }
                      return err;
                    })()}
                    {...(isDark ? { variant: "outline" } : {})}
                  />
                );
              }

              /* -------- CHECKBOX -------- */
              if (isCheckbox(element)) {
                const outputKey = hasOutputKey(element.data)
                  ? element.data.outputKey
                  : undefined;

                if (Array.isArray(element.data.options)) {
                  if (!outputKey) return null;
                  const options = element.data.options;
                  const value = formData[outputKey] || [];
                  const label =
                    element.data["label"] || element.data["@label"] || "";
                  return (
                    <CheckboxGroup
                      key={element?.type + idx}
                      value={value}
                      onValueChange={(vals) => onElementChange(outputKey, vals)}
                      label={showLabel ? label : null}
                      required={element.data.required}
                      error={formErrors[outputKey]}
                    >
                      {options.map((opt: any, i: number) => (
                        <CheckboxItem
                          key={opt.value || i}
                          value={opt.value}
                          label={opt["@text"] || opt.text || opt.value}
                          disabled={opt.disabled}
                        />
                      ))}
                    </CheckboxGroup>
                  );
                }

                if (!outputKey) return null;
                return (
                  <Checkbox
                    key={element?.type + idx}
                    checked={!!formData[outputKey]}
                    onCheckedChange={(val) => onElementChange(outputKey, val)}
                    label={element.data["label"]}
                  />
                );
              }

              /* -------- DATE INPUT -------- */
              if (isDateInput(element)) {
                const outputKey = hasOutputKey(element.data)
                  ? element.data.outputKey
                  : undefined;
                if (!outputKey) return null;

                const label =
                  element.data["label"] || element.data["@label"] || "";
                const minDate = element.data.minValue
                  ? element.data.minValue !== "new Date()"
                    ? new Date(element.data.minValue)
                    : new Date()
                  : undefined;
                const maxDate = element.data.maxValue
                  ? new Date(element.data.maxValue)
                  : undefined;
                const mode = element.data.includeTime ? "datetime" : "date";

                return (
                  <DatePicker
                    key={element?.type + idx}
                    value={
                      formData[outputKey]
                        ? new Date(formData[outputKey])
                        : undefined
                    }
                    onChange={(date) =>
                      onElementChange(
                        outputKey,
                        date ? date.toISOString() : undefined
                      )
                    }
                    minDate={minDate}
                    maxDate={maxDate}
                    mode={mode}
                    label={showLabel ? label : null}
                    required={element.data.required}
                    error={formErrors[outputKey]}
                    {...(isDark ? { variant: "outline" } : {})}
                  />
                );
              }

              /* -------- FILE -------- */
              if (isFile(element)) {
                const outputKey = hasOutputKey(element.data)
                  ? element.data.outputKey
                  : undefined;
                if (!outputKey) return null;

                const label =
                  element.data["label"] ||
                  element.data["@label"] ||
                  element.data.inputText ||
                  "";
                const multiple =
                  element.data.multiple ?? element.data.multipleFiles ?? false;
                const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;
                let maxSize =
                  element.data.maxSize || element.properties?.maxSize;
                if (!maxSize || maxSize > DEFAULT_MAX_SIZE)
                  maxSize = DEFAULT_MAX_SIZE;
                const accept =
                  element.data.accept || element.properties?.accept || "*/*";

                return (
                  <FileUploader
                    key={element?.type + idx}
                    value={formData[outputKey] || []}
                    onChange={(files: FileAsset[]) =>
                      onElementChange(outputKey, files)
                    }
                    multiple={multiple}
                    maxSize={maxSize}
                    accept={accept}
                    label={showLabel ? label : null}
                    required={element.data.required}
                    error={formErrors[outputKey]}
                  />
                );
              }

              /* -------- LIST -------- */
              if (isList(element)) {
                const outputKey = hasOutputKey(element.data)
                  ? element.data.outputKey
                  : undefined;

                const label = element.data["label"] || element.data["@label"];
                return (
                  <FlowListElement
                    key={`list-${idx}`}
                    element={{
                      type: element.type,
                      data: {
                        items: element.data.items as any[],
                        columns: element.data.columns,
                        outputKey,
                        required: element.data.required || false,
                        multiSelect: element.data.multiSelect,
                      },
                    }}
                    value={formData[outputKey] || []}
                    onChange={onElementChange}
                    error={formErrors[outputKey]}
                    label={showLabel ? label : undefined}
                  />
                );
              }

              /* -------- LINK -------- */
              if (element?.type === "link") {
                return <FlowLink key={`link-${idx}`} element={element} />;
              }

              return null;
            })}
          </Container>
        </Card>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({});
