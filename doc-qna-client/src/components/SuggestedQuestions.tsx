import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
  Collapse,
} from "@mui/material";
import { Lightbulb, ExpandMore, ExpandLess } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { qnaApi } from "../api/qnaApi";
import type { SuggestedQuestion } from "../types";
import toast from "react-hot-toast";

const QuestionChip = styled(Chip)(({ theme }) => ({
  cursor: "pointer",
  height: "auto",
  padding: "6px 4px",
  "& .MuiChip-label": {
    whiteSpace: "normal",
    fontSize: "0.8rem",
  },
  "&:hover": {
    background: theme.palette.mode === "dark" ? "#2A3A5A" : "#D6E8F8",
  },
}));

const SuggestionsToggleButton = styled(Button)({
  textTransform: "none",
  color: "#2E75B6",
  fontWeight: 600,
  fontSize: "0.85rem",
  marginBottom: 8,
});

const SuggestionsHint = styled(Typography)({
  display: "block",
  marginBottom: 8,
});

const CategoryQuestionChip = styled(QuestionChip, {
  shouldForwardProp: (prop) => prop !== "chipColor",
})<{ chipColor: string }>(({ chipColor }) => ({
  background: `${chipColor}15`,
  borderColor: `${chipColor}44`,
  color: chipColor,
  border: "1px solid",
}));

const categoryColor = (cat: string) => {
  switch (cat) {
    case "Overview":
      return "#1F4E79";
    case "Details":
      return "#2E75B6";
    case "Analysis":
      return "#4CAF50";
    default:
      return "#888888";
  }
};

interface Props {
  documentId: string;
  onSelectQuestion: (q: string) => void;
}

const SuggestedQuestions = ({ documentId, onSelectQuestion }: Props) => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<SuggestedQuestion[]>([]);
  const [expanded, setExpanded] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const result = await qnaApi.suggestQuestions(documentId, 6);
      setQuestions(result.questions);
      setExpanded(true);
    } catch {
      toast.error("Failed to generate suggestions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box mb={2}>
      <SuggestionsToggleButton
        variant="text"
        size="small"
        startIcon={loading ? <CircularProgress size={14} /> : <Lightbulb />}
        endIcon={
          !loading && questions.length ? (
            expanded ? (
              <ExpandLess />
            ) : (
              <ExpandMore />
            )
          ) : undefined
        }
        onClick={
          questions.length ? () => setExpanded(!expanded) : handleGenerate
        }
        disabled={loading}
      >
        {loading
          ? "Generating..."
          : questions.length
            ? "Suggested questions"
            : "Suggest questions"}
      </SuggestionsToggleButton>

      <Collapse in={expanded && questions.length > 0}>
        <SuggestionsHint variant="caption" color="text.secondary">
          Tap any question to add it to the input.
        </SuggestionsHint>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {questions.map((q, i) => (
            <CategoryQuestionChip
              key={i}
              label={q.question}
              onClick={() => {
                onSelectQuestion(q.question);
                setExpanded(false);
              }}
              chipColor={categoryColor(q.category)}
              variant="outlined"
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

export default SuggestedQuestions;
