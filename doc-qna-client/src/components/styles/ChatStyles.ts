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
  minHeight: 74,
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
  alignItems: "center",
  gap: 16,
  boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
  "@media (max-width: 700px)": {
    padding: "10px 12px",
    gap: 10,
    gridTemplateColumns: "auto 1fr auto",
  },
});

export const ChatHeaderTitle = styled(Typography)({
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "1.1rem",
  textAlign: "center",
});

export const ChatHeaderSubtitle = styled(Typography)({
  color: "rgba(255,255,255,0.7)",
  fontSize: "0.8rem",
  marginTop: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
});

export const BackButton = styled(Button)({
  height: 36,
  minWidth: 86,
  padding: "0 14px",
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

  '@media (max-width: 600px)': {
    maxWidth: '90%',
  },

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

  '@media (max-width: 600px)': {
    maxWidth: '92%',
  },
  
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

// ── AI Fallback Warning ───────────────────────────────────────
export const FallbackWarning = styled(Box)({
  marginBottom: 12,
  padding: "12px 16px",
  backgroundColor: "#fff4e5",
  borderLeft: "4px solid #ed6c02",
  borderRadius: "8px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
});

export const FallbackWarningTitle = styled(Typography)({
  fontWeight: 600,
  fontSize: "0.9rem",
  color: "#e65100",
  display: "flex",
  alignItems: "center",
  gap: 6,
});

export const FallbackWarningText = styled(Typography)({
  fontSize: "0.85rem",
  color: "#663c00",
  lineHeight: 1.4,
});

export const FallbackReasonText = styled(Typography)({
  fontSize: "0.75rem",
  color: "#663c00",
  opacity: 0.8,
  marginTop: 4,
});

// ── Answer Source Badge ───────────────────────────────────────
export const AnswerSourceBadge = styled(Box)({
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 10px",
  borderRadius: "12px",
  fontSize: "0.75rem",
  fontWeight: 600,
  marginBottom: 8,
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

// ── Answer Container Wrapper ──────────────────────────────────
export const AnswerContainer = styled(Box)({
  alignSelf: "flex-start",
  width: "100%",
  maxWidth: "75%",
  
  '@media (max-width: 600px)': {
    maxWidth: '92%',
  },
});

// ── Assistant Bubble Variants ─────────────────────────────────
export const AssistantBubbleDocument = styled(Paper)({
  borderRadius: "18px 18px 18px 4px",
  padding: "16px 20px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  background: "#ffffff",
  borderLeft: "4px solid #2e7d32",
});

export const AssistantBubbleAI = styled(Paper)({
  borderRadius: "18px 18px 18px 4px",
  padding: "16px 20px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  background: "#fff4e5",
  borderLeft: "4px solid #ed6c02",
});

export const MarkdownContent = styled(Box)({
  fontSize: "0.95rem",
  lineHeight: 1.6,
  color: "inherit",
  "& p": {
    margin: 0,
  },
  "& p + p": {
    marginTop: 8,
  },
  "& ol, & ul": {
    listStylePosition: "inside",
    paddingLeft: 0,
    marginTop: 8,
    marginBottom: 8,
  },
  "& li": {
    marginBottom: 4,
  },
  "& li:last-child": {
    marginBottom: 0,
  },
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
