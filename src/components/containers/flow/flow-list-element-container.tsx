import React from "react";
import { SelectList } from "./select-list";
import Label from "@/components/ui/label";

export const FlowListElement: React.FC<IFlowListElementProps> = ({
  element,
  value = [],
  onChange,
  error,
  label,
}) => {
  const handleSelectionChange = (items: any) => {
    // Ensure we always store as array, even for single select
    const arrayValue = Array.isArray(items) ? items : [items];
    if (!element.data.outputKey) return;
    onChange(element.data.outputKey, arrayValue);
  };

  // Ensure value is always an array
  const safeValue = Array.isArray(value) ? value : value ? [value] : [];

  const columns: IFlowListColumn[] = element.data.columns.map((col) => ({
    value: col.value,
    label: col.label,
    displayFormat: col?.displayFormat as "currency" | "date" | undefined,
  }));

  // todo - add search

  return (
    <>
      {label ? <Label>{label}</Label> : null}
      <SelectList
        items={element?.data?.items}
        columns={columns}
        selected={safeValue}
        onSelectionChange={handleSelectionChange}
        error={error}
        required={element.data.required}
        multiSelect={element.data.multiSelect}
        disabled={!element.data.outputKey}
        selectionMessage={
          element.data?.multiSelect
            ? "Selecteer meerdere items"
            : "Selecteer een artikel"
        }
      />
    </>
  );
};
