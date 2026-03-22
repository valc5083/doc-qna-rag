import { styled } from "@mui/material/styles";
import { Box, Button, Card, TextField, Typography } from "@mui/material";

// ── Page Wrapper ──────────────────────────────────────────
export const PageWrapper = styled(Box)({
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #1F4E79 0%, #2E75B6 100%)",
});

// ── Auth Card ─────────────────────────────────────────────
export const AuthCard = styled(Card)({
  width: 420,
  borderRadius: 16,
  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  padding: "8px",
});

// ── Card Inner Padding ────────────────────────────────────
export const CardInner = styled(Box)({
  padding: "32px",
});

// ── Avatar Icon Box ───────────────────────────────────────
export const IconAvatar = styled(Box)({
  width: 56,
  height: 56,
  borderRadius: "50%",
  background: "linear-gradient(135deg, #1F4E79, #2E75B6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 16px auto",
});

// ── Header Section ────────────────────────────────────────
export const HeaderSection = styled(Box)({
  textAlign: "center",
  marginBottom: 24,
});

// ── Page Title ────────────────────────────────────────────
export const PageTitle = styled(Typography)({
  fontWeight: 700,
  fontSize: "1.5rem",
  color: "#1A1A1A",
});

// ── Subtitle ──────────────────────────────────────────────
export const SubTitle = styled(Typography)({
  fontSize: "0.875rem",
  color: "#888888",
  marginTop: 4,
});

// ── Styled Text Field ─────────────────────────────────────
export const StyledTextField = styled(TextField)({
  marginBottom: 16,
  "& .MuiOutlinedInput-root": {
    borderRadius: 10,
    "&:hover fieldset": {
      borderColor: "#2E75B6",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#1F4E79",
    },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#1F4E79",
  },
});

// ── Last Text Field (no bottom margin) ───────────────────
export const LastTextField = styled(StyledTextField)({
  marginBottom: 24,
});

// ── Submit Button ─────────────────────────────────────────
export const SubmitButton = styled(Button)({
  width: "100%",
  padding: "12px",
  fontWeight: 700,
  borderRadius: 10,
  fontSize: "1rem",
  textTransform: "none",
  background: "linear-gradient(135deg, #1F4E79, #2E75B6)",
  color: "#ffffff",
  "&:hover": {
    background: "linear-gradient(135deg, #163d61, #1F4E79)",
    boxShadow: "0 4px 20px rgba(31,78,121,0.4)",
  },
  "&:disabled": {
    background: "#cccccc",
    color: "#888888",
  },
});

// ── Bottom Link Row ───────────────────────────────────────
export const BottomLinkRow = styled(Box)({
  textAlign: "center",
  marginTop: 16,
});

// ── Bottom Link Text ──────────────────────────────────────
export const BottomLinkText = styled(Typography)({
  fontSize: "0.875rem",
  color: "#555555",
});
