import { styled } from "@mui/material/styles";
import { Box, Button, Card, Typography } from "@mui/material";

// ── Page Layout ───────────────────────────────────────────────
export const HistoryLayout = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  background: theme.palette.background.default,
  display: "flex",
  flexDirection: "column",
}));

// ── History Card ──────────────────────────────────────────────
export const HistoryCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  marginBottom: 16,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  overflow: "hidden",
  transition: "box-shadow 0.2s",
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  "&:hover": {
    boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
  },
}));

// ── Card Header ───────────────────────────────────────────────
export const HistoryCardHeader = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === "dark" ? "#121926" : "#F5F8FB",
  padding: "12px 20px",
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

// ── Card Body ─────────────────────────────────────────────────
export const HistoryCardBody = styled(Box)({
  padding: "16px 20px",
});

// ── Question Text ─────────────────────────────────────────────
export const QuestionText = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: "1rem",
  color: theme.palette.text.primary,
  marginBottom: 8,
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
}));

// ── Answer Text ───────────────────────────────────────────────
export const AnswerText = styled(Typography)(({ theme }) => ({
  fontSize: "0.9rem",
  color: theme.palette.text.primary,
  lineHeight: 1.6,
  marginBottom: 8,
}));

// ── Meta Row ──────────────────────────────────────────────────
export const MetaRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
});

// ── Meta Text ─────────────────────────────────────────────────
export const MetaText = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem",
  color: theme.palette.text.secondary,
}));

// ── Doc Badge ─────────────────────────────────────────────────
export const DocBadge = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 4,
  background: theme.palette.mode === "dark" ? "#1E293B" : "#EBF3FB",
  borderRadius: 6,
  padding: "2px 10px",
  fontSize: "0.75rem",
  color: theme.palette.mode === "dark" ? "#93C5FD" : "#2E75B6",
  fontWeight: 600,
}));

// ── Clear Button ──────────────────────────────────────────────
export const ClearButton = styled(Button)({
  borderRadius: 8,
  textTransform: "none",
  fontWeight: 600,
  color: "#e53935",
  borderColor: "#e53935",
  "&:hover": {
    background: "#fdecea",
    borderColor: "#c62828",
  },
});

// ── Empty State ───────────────────────────────────────────────
export const EmptyHistoryBox = styled(Box)(({ theme }) => ({
  textAlign: "center",
  padding: "80px 0",
  color: theme.palette.text.secondary,
}));

// ── Stats Row ─────────────────────────────────────────────────
export const StatsRow = styled(Box)({
  display: "flex",
  gap: 16,
  marginBottom: 24,
  flexWrap: "wrap",
});

// ── Stat Card ─────────────────────────────────────────────────
export const StatCard = styled(Box)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: 12,
  padding: "16px 24px",
  flex: 1,
  minWidth: 140,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  textAlign: "center",
  border: `1px solid ${theme.palette.divider}`,
}));

export const StatNumber = styled(Typography)(({ theme }) => ({
  fontSize: "2rem",
  fontWeight: 700,
  color: theme.palette.text.primary,
  lineHeight: 1,
  marginBottom: 4,
}));

export const StatLabel = styled(Typography)(({ theme }) => ({
  fontSize: "0.8rem",
  color: theme.palette.text.secondary,
}));

// ── Answer Source Badges ──────────────────────────────────────
export const AnswerSourceBadge = styled(Box)({
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "3px 8px",
  borderRadius: "10px",
  fontSize: "0.7rem",
  fontWeight: 600,
});

export const DocumentSourceBadge = styled(AnswerSourceBadge)({
  backgroundColor: "#e8f5e9",
  color: "#2e7d32",
  border: "1px solid #81c784",
});

export const AISourceBadge = styled(AnswerSourceBadge)({
  backgroundColor: "#fff4e5",
  color: "#e65100",
  border: "1px solid #ffb74d",
});

// ── Answer Text Variants ──────────────────────────────────────
export const AnswerTextDocument = styled(AnswerText)(({ theme }) => ({
  borderLeft: "3px solid #2e7d32",
  paddingLeft: 16,
  backgroundColor: theme.palette.mode === "dark" ? "#102318" : "#f1f8f4",
}));

export const AnswerTextAI = styled(AnswerText)(({ theme }) => ({
  borderLeft: "3px solid #ed6c02",
  paddingLeft: 16,
  backgroundColor: theme.palette.mode === "dark" ? "#2C1B08" : "#fff4e5",
}));
