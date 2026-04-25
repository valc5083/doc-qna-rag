import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const HighlightMark = styled("mark")({
  background: "#FFF176",
  borderRadius: 4,
  padding: "0 2px",
  color: "#333333",
  fontWeight: 600,
});

interface Props {
  text: string;
  citedSentences?: string[];
}

const CitationHighlighter = ({ text, citedSentences = [] }: Props) => {
  if (!citedSentences.length) {
    return (
      <Typography fontSize="0.78rem" color="#555555" lineHeight={1.5}>
        {text.length > 200 ? text.substring(0, 200) + "..." : text}
      </Typography>
    );
  }

  // Split text into parts and highlight cited sentences
  let remaining = text;
  const parts: { content: string; highlighted: boolean }[] = [];

  citedSentences.forEach((sentence) => {
    const idx = remaining.indexOf(sentence);
    if (idx === -1) return;

    if (idx > 0) {
      parts.push({
        content: remaining.substring(0, idx),
        highlighted: false,
      });
    }

    parts.push({
      content: sentence,
      highlighted: true,
    });

    remaining = remaining.substring(idx + sentence.length);
  });

  if (remaining) {
    parts.push({ content: remaining, highlighted: false });
  }

  if (!parts.length) {
    return (
      <Typography fontSize="0.78rem" color="#555555">
        {text.substring(0, 200)}
        {text.length > 200 ? "..." : ""}
      </Typography>
    );
  }

  return (
    <Typography
      fontSize="0.78rem"
      color="#555555"
      lineHeight={1.6}
      component="span"
    >
      {parts.map((part, i) =>
        part.highlighted ? (
          <HighlightMark key={i}>{part.content}</HighlightMark>
        ) : (
          <span key={i}>{part.content}</span>
        ),
      )}
    </Typography>
  );
};

export default CitationHighlighter;
