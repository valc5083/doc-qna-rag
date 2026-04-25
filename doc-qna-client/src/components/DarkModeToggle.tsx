import { IconButton, Tooltip } from "@mui/material";
import { DarkMode, LightMode } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { useThemeStore } from "../store/themeStore";

const ToggleButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "iconColor",
})<{ iconColor: string }>(({ iconColor }) => ({
  color: iconColor,
}));

interface Props {
  color?: string;
}

const DarkModeToggle = ({ color = "#ffffff" }: Props) => {
  const { isDark, toggle } = useThemeStore();

  return (
    <Tooltip title={isDark ? "Light mode" : "Dark mode"}>
      <ToggleButton onClick={toggle} iconColor={color}>
        {isDark ? <LightMode /> : <DarkMode />}
      </ToggleButton>
    </Tooltip>
  );
};

export default DarkModeToggle;
