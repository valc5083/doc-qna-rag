import { useState } from "react";
import { Collapse, Box } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import type { SourceChunk } from "../types";
import CitationHighlighter from "./CitationHighlighter";
import {
  SourceSection,
  SourceTitle,
  SourceChunkBox,
  SourceScore,
} from "./styles/ChatStyles";

const SourceHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 4,
  cursor: "pointer",
  marginBottom: 8,
});

const CollapseLessIcon = styled(ExpandLess)({
  fontSize: 16,
  color: "#888",
});

const CollapseMoreIcon = styled(ExpandMore)({
  fontSize: 16,
  color: "#888",
});

interface Props {
  sources: SourceChunk[];
}

const SourceViewer = ({ sources }: Props) => {
  const [expanded, setExpanded] = useState(false);

  if (!sources) return null;
  if (!Array.isArray(sources)) return null;
  if (sources.length === 0) return null;

  return (
    <SourceSection>
      <SourceHeader onClick={() => setExpanded(!expanded)}>
        <SourceTitle>
          📎 {sources.length} Source{sources.length > 1 ? "s" : ""} Used
        </SourceTitle>
        {expanded ? <CollapseLessIcon /> : <CollapseMoreIcon />}
      </SourceHeader>

      <Collapse in={expanded}>
        {sources.map((source: any, i: number) => {
          const text = source?.text ?? source?.Text ?? "No preview available";
          const score = source?.score ?? source?.Score ?? 0;
          const chunkIndex = source?.chunkIndex ?? source?.ChunkIndex ?? i;

          return (
            <SourceChunkBox key={i}>
              <strong>Source {i + 1}</strong> (chunk #{chunkIndex})
              <br />
              <CitationHighlighter
                text={text}
                citedSentences={
                  source?.citedSentences ?? source?.CitedSentences ?? []
                }
              />
              <SourceScore>Relevance: {(score * 100).toFixed(1)}%</SourceScore>
            </SourceChunkBox>
          );
        })}
      </Collapse>
    </SourceSection>
  );
};

export default SourceViewer;
