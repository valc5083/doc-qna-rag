import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Select,
  MenuItem,
  Typography,
  FormControl,
  InputLabel,
  Collapse,
} from "@mui/material";
import { Summarize, ExpandMore, ExpandLess } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { qnaApi } from "../api/qnaApi";
import type { SummarizeResponse } from "../types";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

const SummaryBox = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === "dark" ? "#1E2133" : "#F0F7FF",
  border: `1px solid ${theme.palette.mode === "dark" ? "#2A2D3E" : "#BDD7EE"}`,
  borderRadius: 12,
  padding: "16px 20px",
  marginBottom: 16,
}));

const StyleFormControl = styled(FormControl)({
  minWidth: 140,
});

const SummarizeButton = styled(Button)({
  borderRadius: 8,
  textTransform: "none",
  fontWeight: 600,
  borderColor: "#2E75B6",
  color: "#2E75B6",
});

const SummaryHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
});

const SummaryContent = styled(Box)({
  marginTop: 12,
  fontSize: "0.9rem",
  lineHeight: 1.7,
  "& p": { margin: "0 0 8px 0" },
  "& ul": { paddingLeft: 20 },
  "& li": { marginBottom: 4 },
});

interface Props {
  documentId: string;
}

const DocumentSummary = ({ documentId }: Props) => {
  const [style, setStyle] = useState<string>("concise");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SummarizeResponse | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleSummarize = async () => {
    try {
      setLoading(true);
      const result = await qnaApi.summarize({
        documentId,
        style: style as any,
      });
      setSummary(result);
      setExpanded(true);
      toast.success("Summary generated!");
    } catch {
      toast.error("Failed to generate summary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box mb={2}>
      <Box display="flex" gap={1} alignItems="center" mb={1}>
        <StyleFormControl size="small">
          <InputLabel>Style</InputLabel>
          <Select
            value={style}
            label="Style"
            onChange={(e) => setStyle(e.target.value)}
          >
            <MenuItem value="concise">Concise</MenuItem>
            <MenuItem value="detailed">Detailed</MenuItem>
            <MenuItem value="bullet_points">Bullet Points</MenuItem>
            <MenuItem value="executive">Executive</MenuItem>
          </Select>
        </StyleFormControl>

        <SummarizeButton
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} /> : <Summarize />}
          onClick={handleSummarize}
          disabled={loading}
        >
          {loading ? "Summarizing..." : "Summarize"}
        </SummarizeButton>
      </Box>

      {summary && (
        <SummaryBox>
          <SummaryHeader onClick={() => setExpanded(!expanded)}>
            <Typography fontWeight={700} fontSize="0.9rem" color="#1F4E79">
              📋 Document Summary
              <Typography
                component="span"
                fontSize="0.75rem"
                color="#888888"
                ml={1}
              >
                ({summary.chunksAnalyzed} sections analyzed)
              </Typography>
            </Typography>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </SummaryHeader>

          <Collapse in={expanded}>
            <SummaryContent>
              <ReactMarkdown>{summary.summary}</ReactMarkdown>
            </SummaryContent>
          </Collapse>
        </SummaryBox>
      )}
    </Box>
  );
};

export default DocumentSummary;
