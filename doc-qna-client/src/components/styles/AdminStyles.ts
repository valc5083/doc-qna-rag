import { styled } from "@mui/material/styles";
import { Box, Card, Typography } from "@mui/material";

export const AdminLayout = styled(Box)({
  minHeight: "100vh",
  background: "#0F1117",
  color: "#ffffff",
});

export const AdminNav = styled(Box)({
  background: "#1A1D27",
  padding: "16px 32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: "1px solid #2A2D3E",
});

export const AdminNavTitle = styled(Typography)({
  fontWeight: 700,
  fontSize: "1.2rem",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  gap: 8,
});

export const AdminContent = styled(Box)({
  padding: "32px",
  maxWidth: 1200,
  margin: "0 auto",
});

export const StatsGrid = styled(Box)({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
  marginBottom: 32,
});

export const StatBox = styled(Card)<{ accent?: string }>(
  ({ accent = "#2E75B6" }) => ({
    background: "#1A1D27",
    borderRadius: 12,
    padding: "20px 24px",
    border: `1px solid #2A2D3E`,
    borderLeft: `4px solid ${accent}`,
    boxShadow: "none",
  }),
);

export const StatValue = styled(Typography)({
  fontSize: "2rem",
  fontWeight: 700,
  color: "#ffffff",
  lineHeight: 1,
  marginBottom: 4,
});

export const StatLabel = styled(Typography)({
  fontSize: "0.78rem",
  color: "#8B8FA8",
  textTransform: "uppercase",
  letterSpacing: 0.5,
});

export const AdminCard = styled(Card)({
  background: "#1A1D27",
  borderRadius: 12,
  border: "1px solid #2A2D3E",
  marginBottom: 24,
  boxShadow: "none",
  overflow: "hidden",
});

export const AdminCardHeader = styled(Box)({
  padding: "16px 24px",
  borderBottom: "1px solid #2A2D3E",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

export const AdminCardTitle = styled(Typography)({
  fontWeight: 700,
  fontSize: "1rem",
  color: "#ffffff",
});

export const AdminTable = styled(Box)({
  width: "100%",
  overflowX: "auto",
});

export const TableHeader = styled(Box)({
  display: "grid",
  padding: "10px 24px",
  background: "#13151F",
  borderBottom: "1px solid #2A2D3E",
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "#8B8FA8",
  textTransform: "uppercase",
  letterSpacing: 0.5,
});

export const TableRow = styled(Box)({
  display: "grid",
  padding: "12px 24px",
  borderBottom: "1px solid #1E2030",
  alignItems: "center",
  fontSize: "0.875rem",
  color: "#C8CAD8",
  transition: "background 0.15s",
  "&:hover": {
    background: "#1E2133",
  },
  "&:last-child": {
    borderBottom: "none",
  },
});

export const TabButton = styled(Box)<{ active?: boolean }>(({ active }) => ({
  padding: "8px 20px",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: 600,
  background: active ? "#2E75B6" : "transparent",
  color: active ? "#ffffff" : "#8B8FA8",
  transition: "all 0.15s",
  "&:hover": {
    background: active ? "#2E75B6" : "#1E2133",
    color: "#ffffff",
  },
}));

export const BadgeChip = styled(Box)<{ color?: string }>(
  ({ color = "#2E75B6" }) => ({
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 20,
    fontSize: "0.72rem",
    fontWeight: 700,
    background: `${color}22`,
    color: color,
    border: `1px solid ${color}44`,
  }),
);
