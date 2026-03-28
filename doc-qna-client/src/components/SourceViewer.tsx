import { useState } from "react";
import { Collapse, Box } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import type { SourceChunk } from "../types";
import {
  SourceSection,
  SourceTitle,
  SourceChunkBox,
  SourceScore,
} from "./styles/ChatStyles";

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
      <Box
        display="flex"
        alignItems="center"
        gap={0.5}
        sx={{ cursor: "pointer", mb: 1 }}
        onClick={() => setExpanded(!expanded)}
      >
        <SourceTitle>
          📎 {sources.length} Source{sources.length > 1 ? "s" : ""} Used
        </SourceTitle>
        {expanded ? (
          <ExpandLess sx={{ fontSize: 16, color: "#888" }} />
        ) : (
          <ExpandMore sx={{ fontSize: 16, color: "#888" }} />
        )}
      </Box>

      <Collapse in={expanded}>
        {sources.map((source: any, i: number) => {
          const text =
            source?.text ?? 
            source?.Text ?? 
            "No preview available";
          const score =
            source?.score ?? 
            source?.Score ?? 
            0;
          const chunkIndex =
            source?.chunkIndex ?? 
            source?.ChunkIndex ??
            i;

          return (
            <SourceChunkBox key={i}>
              <strong>Source {i + 1}</strong> (chunk #{chunkIndex})
              <br />
              {text.length > 200 ? text.substring(0, 200) + "..." : text}
              <SourceScore>Relevance: {(score * 100).toFixed(1)}%</SourceScore>
            </SourceChunkBox>
          );
        })}
      </Collapse>
    </SourceSection>
  );
};

export default SourceViewer;
