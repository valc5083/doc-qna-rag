import { Box, Typography } from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const PreviewBox = styled(Box)({
  width: 56,
  height: 72,
  borderRadius: 6,
  background: 'linear-gradient(135deg, #FFEBEE, #FFCDD2)',
  display: 'grid',
  gridTemplateRows: '22px 12px 12px',
  alignContent: 'center',
  justifyItems: 'center',
  flexShrink: 0,
  border: '1px solid #FFCDD2',
  rowGap: 2,
  padding: '6px 4px',
});

const PageCount = styled(Typography)({
  fontSize: '0.6rem',
  fontWeight: 700,
  color: '#C62828',
  lineHeight: 1,
  textAlign: 'center',
  width: '100%',
});

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface Props {
  fileName: string;
  chunkCount: number;
  fileSizeBytes: number;
}

const DocumentCardPreview = ({
  fileName, chunkCount, fileSizeBytes
}: Props) => {
  // Estimate pages from chunks (rough: 1 chunk ≈ 0.5 pages)
  const estimatedPages = Math.max(1,
    Math.round(chunkCount * 0.5));

  const ext = fileName.split('.').pop()?.toUpperCase() ?? 'PDF';
  const formattedSize = formatSize(fileSizeBytes);

  return (
    <PreviewBox title={`${formattedSize} • ~${estimatedPages} pages`}>
      <PictureAsPdf sx={{ color: '#C62828', fontSize: 22, display: 'block' }} />
      <PageCount>{ext}</PageCount>
      <PageCount>~{estimatedPages}p</PageCount>
    </PreviewBox>
  );
};

export default DocumentCardPreview;