import { styled } from "@mui/material/styles";
import { Box, Button, Card, Typography, LinearProgress } from "@mui/material";

// ── Page Layout ───────────────────────────────────────────────
export const DashboardLayout = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  background: theme.palette.background.default,
  display: "flex",
  flexDirection: "column",
}));

// ── Top Navigation Bar ────────────────────────────────────────
export const NavBar = styled(Box)(({ theme }) => ({
  background: "linear-gradient(135deg, #1F4E79, #2E75B6)",
  padding: "16px 32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxShadow: "0 2px 12px rgba(0,0,0,0.2)",

  "@media (max-width: 600px)": {
    padding: "12px 16px",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    gap: 8,
  },
}));

export const NavTitle = styled(Typography)({
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "1.4rem",
  "@media (max-width: 600px)": {
    fontSize: "1.2rem",
  },
});

export const NavEmail = styled(Typography)({
  color: "rgba(255,255,255,0.8)",
  fontSize: "0.875rem",
  maxWidth: "min(100%, 320px)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  "@media (max-width: 600px)": {
    fontSize: "0.78rem",
    flexBasis: "100%",
    maxWidth: "100%",
  },
});

export const NavActions = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
  justifyContent: "flex-end",
  "@media (max-width: 600px)": {
    width: "100%",
    gap: 8,
    justifyContent: "flex-start",
  },
});

export const NavLogoutButton = styled(Button)({
  color: "#ffffff",
  background: "rgb(255, 8, 0)",
  borderColor: "rgba(255, 255, 255, 0.67)",
  borderRadius: 8,
  textTransform: "none",
  whiteSpace: "nowrap",
  fontWeight: 600,
  fontSize: "0.85rem",
  minWidth: "fit-content",
  "&:hover": {
    borderColor: "#ffcdd2",
    background: "rgba(245, 5, 29, 0.91)",
  },
});

export const NavHistoryButton = styled(Button)({
  color: "#ffffff",
  borderColor: "rgba(255,255,255,0.5)",
  borderRadius: 8,
  textTransform: "none",
  whiteSpace: "nowrap",
  fontWeight: 600,
  fontSize: "0.85rem",
  minWidth: "fit-content",
  background: "rgba(255,255,255,0.15)",
  "&:hover": {
    borderColor: "#ffffff",
    background: "rgba(255,255,255,0.25)",
  },
});

export const NavCollectionButton = styled(Button)({
  color: "#ffffff",
  borderColor: "rgba(255,255,255,0.5)",
  borderRadius: 8,
  textTransform: "none",
  whiteSpace: "nowrap",
  fontWeight: 600,
  fontSize: "0.85rem",
  minWidth: "fit-content",
  background: "rgba(255,255,255,0.15)",
  "&:hover": {
    borderColor: "#ffffff",
    background: "rgba(255,255,255,0.25)",
  },
});

// ── Main Content Area ─────────────────────────────────────────
export const MainContent = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: "32px",
  maxWidth: 1000,
  margin: "0 auto",
  width: "100%",

  "@media (max-width: 600px)": {
    padding: "16px",
  },
}));

// ── Section Title ─────────────────────────────────────────────
export const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: "1.3rem",
  color: theme.palette.text.primary,
  marginBottom: 16,
}));

// ── Drop Zone ─────────────────────────────────────────────────
export const DropZoneBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isDragActive",
})<{ isDragActive?: boolean }>(({ isDragActive, theme }) => ({
  border: `2px dashed ${isDragActive ? "#2E75B6" : "#AAAAAA"}`,
  borderRadius: 12,
  padding: "48px 32px",
  textAlign: "center",
  cursor: "pointer",
  background:
    theme.palette.mode === "dark"
      ? isDragActive
        ? "#1E293B"
        : "#111827"
      : isDragActive
        ? "#EBF3FB"
        : "#FAFAFA",
  transition: "all 0.2s ease",
  marginBottom: 32,
  "&:hover": {
    borderColor: "#2E75B6",
    background: theme.palette.mode === "dark" ? "#1E293B" : "#EBF3FB",
  },
}));

export const DropZoneIcon = styled(Box)({
  fontSize: "3rem",
  marginBottom: 12,
});

export const DropZoneText = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: "1rem",
  color: theme.palette.text.primary,
  marginBottom: 4,
}));

export const DropZoneSubText = styled(Typography)(({ theme }) => ({
  fontSize: "0.8rem",
  color: theme.palette.text.secondary,
}));

// ── Upload Progress ───────────────────────────────────────────
export const UploadProgressBar = styled(LinearProgress)({
  borderRadius: 4,
  height: 8,
  marginTop: 16,
  "& .MuiLinearProgress-bar": {
    background: "linear-gradient(135deg, #1F4E79, #2E75B6)",
  },
});

// ── Document Card ─────────────────────────────────────────────
export const DocumentCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  padding: "16px 20px",
  marginBottom: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  transition: "box-shadow 0.2s",
  gap: 12,
  "@media (max-width: 600px)": {
    padding: "12px",
    alignItems: "stretch",
    flexDirection: "column",
  },
  "&:hover": {
    boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
  },
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
}));

export const DocumentInfo = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 16,
  flex: 1,
  minWidth: 0,
});

export const DocumentName = styled(Typography)(({ theme }) => ({
  display: "block",
  width: "100%",
  maxWidth: "100%",
  fontWeight: 600,
  fontSize: "0.95rem",
  color: theme.palette.text.primary,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

export const DocumentMeta = styled(Typography)(({ theme }) => ({
  fontSize: "0.78rem",
  color: theme.palette.text.secondary,
  marginTop: 2,
}));

export const DeleteButton = styled(Button)({
  minWidth: "auto",
  padding: "6px 16px",
  borderRadius: 8,
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.8rem",
  color: "#e53935",
  borderColor: "#e53935",
  "&:hover": {
    background: "#fdecea",
  },
});

export const EmptyStateBox = styled(Box)(({ theme }) => ({
  textAlign: "center",
  padding: "40px 0",
  color: theme.palette.text.secondary,
}));
