import { useTheme } from "@/context/ThemeContext";
import colors from "@/constants/colors";

export function useColors() {
  const { isDark } = useTheme();
  const palette = isDark
    ? (colors as typeof colors & { dark: typeof colors.light }).dark
    : colors.light;
  return { ...palette, radius: colors.radius };
}
