import { styled } from "@mui/material/styles";
import { Box, Button, Card, TextField, Typography } from "@mui/material";

export const CollectionCard = styled(Card)({
  borderRadius: 12,
  marginBottom: 16,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  overflow: "hidden",
  transition: "box-shadow 0.2s",
  "&:hover": {
    boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
  },
});

export const CollectionCardHeader = styled(Box)({
  background: "linear-gradient(135deg, #1F4E79, #2E75B6)",
  padding: "14px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  "@media (max-width: 600px)": {
    padding: "12px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
});

export const CollectionHeaderInfo = styled(Box)({
  flex: 1,
  minWidth: 0,
});

export const CollectionHeaderActions = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "nowrap",
  "@media (max-width: 600px)": {
    width: "100%",
    justifyContent: "flex-end",
  },
});

export const CollectionName = styled(Typography)({
  fontWeight: 700,
  fontSize: "1rem",
  color: "#ffffff",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const CollectionDescription = styled(Typography)({
  fontSize: "0.78rem",
  color: "rgba(255,255,255,0.75)",
  marginTop: 2,
});

export const CollectionBody = styled(Box)({
  padding: "16px 20px",
  "@media (max-width: 600px)": {
    padding: "12px",
  },
});

export const CollectionDocItem = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "10px 0",
  borderBottom: "1px solid #F0F4F8",
  "@media (max-width: 600px)": {
    alignItems: "stretch",
    flexDirection: "column",
  },
  "&:last-child": {
    borderBottom: "none",
  },
});

export const CollectionDocInfo = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 12,
  minWidth: 0,
  width: "100%",
});

export const CollectionDocTitle = styled(Typography)({
  fontWeight: 600,
  fontSize: "0.9rem",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const CollectionDocActions = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 6,
  justifyContent: "flex-end",
  width: "100%",
  "@media (min-width: 601px)": {
    width: "auto",
  },
});

export const CreateCollectionCard = styled(Card)({
  borderRadius: 12,
  marginBottom: 24,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  padding: "20px 24px",
  "@media (max-width: 600px)": {
    padding: "14px",
  },
});

export const CollectionInput = styled(TextField)({
  marginBottom: 12,
  "& .MuiOutlinedInput-root": {
    borderRadius: 10,
    "&:hover fieldset": { borderColor: "#2E75B6" },
    "&.Mui-focused fieldset": { borderColor: "#1F4E79" },
  },
});

export const CreateButton = styled(Button)({
  borderRadius: 10,
  textTransform: "none",
  fontWeight: 700,
  background: "linear-gradient(135deg, #1F4E79, #2E75B6)",
  color: "#ffffff",
  padding: "10px 24px",
  "@media (max-width: 600px)": {
    width: "100%",
  },
  "&:hover": {
    background: "linear-gradient(135deg, #163d61, #1F4E79)",
  },
});

export const DeleteCollectionButton = styled(Button)({
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

export const EmptyCollectionBox = styled(Box)({
  textAlign: "center",
  padding: "32px 0",
  color: "#AAAAAA",
});

export const DocCountBadge = styled(Box)({
  background: "rgba(255,255,255,0.2)",
  borderRadius: 20,
  padding: "2px 12px",
  fontSize: "0.78rem",
  color: "#ffffff",
  fontWeight: 600,
});
