import { styled } from "@mui/material/styles";
import { Box, Button, Card, Typography } from "@mui/material";

// ── Page Wrapper ──────────────────────────────────────────
export const DashboardWrapper = styled(Box)({
  minHeight: "100vh",
  background: "#F0F4F8",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

// ── Welcome Card ──────────────────────────────────────────
export const WelcomeCard = styled(Card)({
  width: 480,
  borderRadius: 16,
  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
  padding: "8px",
});

// ── Card Body ─────────────────────────────────────────────
export const CardBody = styled(Box)({
  padding: "40px 32px",
  textAlign: "center",
});

// ── Welcome Title ─────────────────────────────────────────
export const WelcomeTitle = styled(Typography)({
  fontWeight: 700,
  fontSize: "1.8rem",
  color: "#1F4E79",
  marginBottom: 8,
});

// ── Signed In Label ───────────────────────────────────────
export const SignedInLabel = styled(Typography)({
  fontSize: "0.875rem",
  color: "#888888",
  marginBottom: 4,
});

// ── Email Display ─────────────────────────────────────────
export const EmailDisplay = styled(Typography)({
  fontWeight: 600,
  fontSize: "1.1rem",
  color: "#1A1A1A",
  marginBottom: 16,
});

// ── Coming Soon Banner ────────────────────────────────────
export const ComingSoonBanner = styled(Box)({
  background: "#EBF3FB",
  borderRadius: 10,
  padding: "16px 24px",
  marginBottom: 32,
  border: "1px solid #BDD7EE",
});

// ── Coming Soon Text ──────────────────────────────────────
export const ComingSoonText = styled(Typography)({
  fontSize: "0.875rem",
  color: "#2E75B6",
  lineHeight: 1.6,
});

// ── Logout Button ─────────────────────────────────────────
export const LogoutButton = styled(Button)({
  borderRadius: 10,
  padding: "10px 40px",
  fontWeight: 600,
  textTransform: "none",
  fontSize: "0.95rem",
  borderColor: "#e53935",
  color: "#e53935",
  "&:hover": {
    background: "#fdecea",
    borderColor: "#c62828",
    color: "#c62828",
  },
});
