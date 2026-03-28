import { styled } from "@mui/material/styles";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";

// ── Chat Page Layout ──────────────────────────────────────────
export const ChatLayout = styled(Box)({
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  background: "#F0F4F8",
});

// ── Chat Header ───────────────────────────────────────────────
export const ChatHeader = styled(Box)({
  background: "linear-gradient(135deg, #1F4E79, #2E75B6)",
  padding: "12px 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
});

export const ChatHeaderTitle = styled(Typography)({
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "1.1rem",
});

export const ChatHeaderSubtitle = styled(Typography)({
  color: "rgba(255,255,255,0.7)",
  fontSize: "0.78rem",
  marginTop: 2,
});

export const BackButton = styled(Button)({
  color: "#ffffff",
  borderColor: "rgba(255,255,255,0.5)",
  borderRadius: 8,
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.85rem",
  "&:hover": {
    borderColor: "#ffffff",
    background: "rgba(255,255,255,0.1)",
  },
});

// ── Messages Area ─────────────────────────────────────────────
export const MessagesArea = styled(Box)({
  flex: 1,
  overflowY: "auto",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  gap: 16,
});

// ── User Bubble ───────────────────────────────────────────────
export const UserBubble = styled(Box)({
  alignSelf: "flex-end",
  maxWidth: "70%",
  background: "linear-gradient(135deg, #1F4E79, #2E75B6)",
  color: "#ffffff",
  borderRadius: "18px 18px 4px 18px",
  padding: "12px 16px",
  fontSize: "0.95rem",
  lineHeight: 1.5,
  boxShadow: "0 2px 8px rgba(31,78,121,0.3)",
});

// ── Assistant Bubble ──────────────────────────────────────────
export const AssistantBubble = styled(Paper)({
  alignSelf: "flex-start",
  maxWidth: "75%",
  borderRadius: "18px 18px 18px 4px",
  padding: "16px 20px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  background: "#ffffff",
});

// ── Source Section ────────────────────────────────────────────
export const SourceSection = styled(Box)({
  marginTop: 12,
  borderTop: "1px solid #EEE",
  paddingTop: 10,
});

export const SourceTitle = styled(Typography)({
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "#888888",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: 0.5,
});

export const SourceChunkBox = styled(Box)({
  background: "#F5F8FB",
  border: "1px solid #BDD7EE",
  borderRadius: 8,
  padding: "8px 12px",
  marginBottom: 6,
  fontSize: "0.78rem",
  color: "#444444",
  lineHeight: 1.5,
});

export const SourceScore = styled(Typography)({
  fontSize: "0.7rem",
  color: "#2E75B6",
  fontWeight: 600,
  marginTop: 4,
});

// ── Thinking Indicator ────────────────────────────────────────
export const ThinkingBubble = styled(Paper)({
  alignSelf: "flex-start",
  borderRadius: "18px 18px 18px 4px",
  padding: "14px 20px",
  background: "#ffffff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  display: "flex",
  alignItems: "center",
  gap: 8,
});

export const ThinkingText = styled(Typography)({
  fontSize: "0.9rem",
  color: "#888888",
  fontStyle: "italic",
});

// ── Input Area ────────────────────────────────────────────────
export const InputArea = styled(Box)({
  padding: "16px 24px",
  background: "#ffffff",
  borderTop: "1px solid #E0E0E0",
  display: "flex",
  gap: 12,
  alignItems: "flex-end",
});

export const QuestionInput = styled(TextField)({
  flex: 1,
  "& .MuiOutlinedInput-root": {
    borderRadius: 12,
    "&:hover fieldset": { borderColor: "#2E75B6" },
    "&.Mui-focused fieldset": { borderColor: "#1F4E79" },
  },
});

export const SendButton = styled(Button)({
  height: 48,
  minWidth: 48,
  borderRadius: 12,
  background: "linear-gradient(135deg, #1F4E79, #2E75B6)",
  color: "#ffffff",
  fontWeight: 700,
  textTransform: "none",
  padding: "0 24px",
  "&:hover": {
    background: "linear-gradient(135deg, #163d61, #1F4E79)",
  },
  "&:disabled": {
    background: "#cccccc",
    color: "#888888",
  },
});

// ── Empty State ───────────────────────────────────────────────
export const EmptyChat = styled(Box)({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  color: "#AAAAAA",
  gap: 12,
});

export const EmptyChatIcon = styled(Typography)({
  fontSize: "3rem",
});

export const EmptyChatText = styled(Typography)({
  fontSize: "1rem",
  color: "#AAAAAA",
  textAlign: "center",
});

export const EmptyChatSub = styled(Typography)({
  fontSize: "0.85rem",
  color: "#CCCCCC",
  textAlign: "center",
});
