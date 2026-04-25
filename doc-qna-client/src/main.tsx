import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.tsx";
import { useThemeStore } from "./store/themeStore";

const ThemedApp = () => {
  const { isDark } = useThemeStore();

  const theme = createTheme({
    palette: {
      mode: isDark ? "dark" : "light",
      primary: { main: "#2E75B6" },
      background: {
        default: isDark ? "#0F1117" : "#F0F4F8",
        paper: isDark ? "#1A1D27" : "#ffffff",
      },
    },
    typography: { fontFamily: "Arial, sans-serif" },
    shape: { borderRadius: 8 },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: 10,
            fontFamily: "Arial, sans-serif",
            fontSize: "0.875rem",
          },
          success: {
            style: {
              background: "#1F4E79",
              color: "#ffffff",
            },
            iconTheme: {
              primary: "#ffffff",
              secondary: "#1F4E79",
            },
          },
          error: {
            style: {
              background: "#e53935",
              color: "#ffffff",
            },
            iconTheme: {
              primary: "#ffffff",
              secondary: "#e53935",
            },
          },
        }}
      />
    </ThemeProvider>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemedApp />
  </StrictMode>,
);
