import { Box, Skeleton } from "@mui/material";
import { styled } from "@mui/material/styles";

const SkeletonCard = styled(Box)({
  borderRadius: 12,
  padding: 16,
  background: "#ffffff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  marginBottom: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const DocumentSkeleton = () => (
  <SkeletonCard>
    <Box display="flex" alignItems="center" gap={2} flex={1}>
      <Skeleton variant="circular" width={36} height={36} />
      <Box flex={1}>
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="text" width="30%" height={16} />
      </Box>
    </Box>
    <Box display="flex" gap={1}>
      <Skeleton variant="rounded" width={60} height={24} />
      <Skeleton variant="rounded" width={70} height={28} />
      <Skeleton variant="rounded" width={36} height={28} />
    </Box>
  </SkeletonCard>
);

export const DocumentListSkeleton = () => (
  <Box>
    {[1, 2, 3].map((i) => (
      <DocumentSkeleton key={i} />
    ))}
  </Box>
);

export default DocumentSkeleton;
