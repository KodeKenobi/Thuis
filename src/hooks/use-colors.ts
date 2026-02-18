import { COLORS } from "@/constants/colors";
import { useTheme } from "@/contexts/theme-context";

export const useColors = () => {
  const { theme } = useTheme();

  return {
    ...COLORS?.[theme],
    theme,
    light: COLORS.light,
    dark: COLORS.dark,
  };
};
