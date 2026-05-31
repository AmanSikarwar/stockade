import { useTheme } from "../../theme/ThemeContext";
import { IconButton } from "./IconButton";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <IconButton
      icon={isDark ? "sun" : "moon"}
      label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggleTheme}
    />
  );
}
