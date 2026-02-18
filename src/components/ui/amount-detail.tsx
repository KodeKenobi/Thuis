import React from "react";
import { useTextStyles, ThemedText, ThemedTextProps } from "./themed-text";
import { formatAmount } from "@/utils";

export type AmountDetailProps = ThemedTextProps & {
  amount: number;
  dangerCompareTo?: number;
  dangerGreaterThan?: boolean;
  dangerLessThan?: boolean;
  applyDangerColor?: boolean;
  applySuccessColor?: boolean;
};

const AmountDetail = ({
  amount,
  dangerCompareTo = 0,
  dangerGreaterThan = true,
  dangerLessThan = false,
  applyDangerColor = true,
  applySuccessColor = true,
  ...rest
}: AmountDetailProps) => {
  const textStyles = useTextStyles();
  const isDanger =
    (dangerGreaterThan && amount > dangerCompareTo) ||
    (dangerLessThan && amount < dangerCompareTo);

  const isSuccess =
    (dangerLessThan && amount >= dangerCompareTo) ||
    (dangerGreaterThan && amount <= dangerCompareTo);

  let textStyle = {};
  if (isDanger && applyDangerColor) {
    textStyle = { ...textStyles.danger };
  } else if (!isDanger && isSuccess && applySuccessColor) {
    textStyle = { ...textStyles.success };
  }

  return (
    <ThemedText {...textStyle} weight="semiBold" {...rest}>
      {formatAmount(+(amount || 0).toFixed(2), {
        currency: "EUR",
      })}
    </ThemedText>
  );
};

export default AmountDetail;
