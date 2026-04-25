import { Box, Skeleton } from "@mui/material";
import { styled } from "@mui/material/styles";

const SkeletonCard = styled(Box)({
  borderRadius: 12,
  overflow: "hidden",
  marginBottom: 16,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
});

const SkeletonHeader = styled(Box)({
  background: "linear-gradient(135deg, #d0d8e4, #b8c4d4)",
  padding: 16,
});

const SoftSkeleton = styled(Skeleton)({
  backgroundColor: "rgba(255,255,255,0.3)",
});

const CollectionSkeleton = () => (
  <SkeletonCard>
    <SkeletonHeader>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" gap={1} alignItems="center">
          <SoftSkeleton variant="circular" width={24} height={24} />
          <SoftSkeleton variant="text" width={120} height={24} />
        </Box>
        <SoftSkeleton variant="rounded" width={80} height={28} />
      </Box>
    </SkeletonHeader>
  </SkeletonCard>
);

export const CollectionListSkeleton = () => (
  <Box>
    {[1, 2].map((i) => (
      <CollectionSkeleton key={i} />
    ))}
  </Box>
);

export default CollectionSkeleton;
