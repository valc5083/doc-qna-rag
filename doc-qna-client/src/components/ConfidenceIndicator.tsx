import { Box, Tooltip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ConfidenceScore } from "../types";

const Bar = styled(Box)<{ width: number; color: string }>(
  ({ width, color }) => ({
    height: 4,
    width: `${width}%`,
    background: color,
    borderRadius: 2,
    transition: "width 0.5s ease",
  }),
);

const IndicatorRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 8,
  cursor: "help",
  marginTop: 8,
});

const ConfidenceLabel = styled(Typography)({
  fontSize: "0.72rem",
  color: "#888888",
  fontWeight: 600,
  whiteSpace: "nowrap",
});

const ConfidenceTrack = styled(Box)({
  flex: 1,
  height: 4,
  background: "#E0E0E0",
  borderRadius: 8,
  maxWidth: 100,
});

const ConfidenceValue = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "valueColor",
})<{ valueColor: string }>(({ valueColor }) => ({
  fontSize: "0.72rem",
  fontWeight: 700,
  color: valueColor,
  whiteSpace: "nowrap",
}));

const levelColor = (level: string) => {
  switch (level) {
    case "High":
      return "#4CAF50";
    case "Medium":
      return "#FF9800";
    default:
      return "#F44336";
  }
};

interface Props {
  confidence?: ConfidenceScore | null;
}

const ConfidenceIndicator = ({ confidence }: Props) => {
  if (!confidence) return null;

  const color = levelColor(confidence.level);

  return (
    <Tooltip title={confidence.explanation} placement="top" arrow>
      <IndicatorRow>
        <ConfidenceLabel>Confidence:</ConfidenceLabel>
        <ConfidenceTrack>
          <Bar width={confidence.overall * 100} color={color} />
        </ConfidenceTrack>
        <ConfidenceValue valueColor={color}>
          {confidence.level} ({(confidence.overall * 100).toFixed(0)}%)
        </ConfidenceValue>
      </IndicatorRow>
    </Tooltip>
  );
};

export default ConfidenceIndicator;
