import { useState } from "react";
import { Box, Collapse, Chip, Typography } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import type { ImageSourceChunk } from "../types";
import { styled } from "@mui/material/styles";

const Section = styled(Box)({
  marginTop: 12,
  borderTop: "1px solid #E8F4FD",
  paddingTop: 10,
});

const ImageCard = styled(Box)({
  background: "#F8FBFF",
  border: "1px solid #BDD7EE",
  borderRadius: 8,
  padding: "10px 12px",
  marginBottom: 8,
});

const HeaderRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
  userSelect: "none",
});

interface Props {
  imageSources?: ImageSourceChunk[] | null;
}

const ImageSourceViewer = ({ imageSources }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [shown, setShown] = useState<Set<number>>(new Set());

  if (!imageSources?.length) return null;

  const toggle = (i: number) =>
    setShown((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  return (
    <Section>
      <HeaderRow onClick={() => setExpanded(!expanded)}>
        <Typography
          sx={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#8B8FA8",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            flex: 1,
          }}
        >
          🖼️ {imageSources.length} Image
          {imageSources.length > 1 ? "s" : ""} Referenced
        </Typography>
        {expanded ? (
          <ExpandLess sx={{ fontSize: 16, color: "#888" }} />
        ) : (
          <ExpandMore sx={{ fontSize: 16, color: "#888" }} />
        )}
      </HeaderRow>

      <Collapse in={expanded}>
        <Box mt={1}>
          {imageSources.map((img, i) => (
            <ImageCard key={i}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={0.5}
              >
                <Typography fontSize="0.78rem" fontWeight={600} color="#1F4E79">
                  📄 Page {img.pageNumber}
                </Typography>
                <Chip
                  label={`${(img.score * 100).toFixed(0)}% match`}
                  size="small"
                  sx={{
                    fontSize: "0.68rem",
                    height: 20,
                    background: "#EBF3FB",
                    color: "#2E75B6",
                    fontWeight: 600,
                  }}
                />
              </Box>

              <Typography fontSize="0.78rem" color="#555555" lineHeight={1.5}>
                {img.description.length > 180
                  ? img.description.substring(0, 180) + "..."
                  : img.description}
              </Typography>

              <Box mt={1} sx={{ cursor: "pointer" }} onClick={() => toggle(i)}>
                <Typography fontSize="0.72rem" color="#2E75B6" fontWeight={600}>
                  {shown.has(i) ? "▲ Hide" : "▼ Show image"}
                </Typography>

                {shown.has(i) && img.base64Data && (
                  <Box
                    component="img"
                    src={`data:image/jpeg;base64,${img.base64Data}`}
                    alt={`Page ${img.pageNumber}`}
                    sx={{
                      width: "100%",
                      maxHeight: 200,
                      objectFit: "contain",
                      borderRadius: 1,
                      mt: 1,
                      border: "1px solid #E0E0E0",
                      background: "#fff",
                    }}
                  />
                )}
              </Box>
            </ImageCard>
          ))}
        </Box>
      </Collapse>
    </Section>
  );
};

export default ImageSourceViewer;
