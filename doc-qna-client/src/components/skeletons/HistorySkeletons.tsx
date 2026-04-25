import { Box, Skeleton } from "@mui/material";
import { styled } from "@mui/material/styles";

const HistorySkeletonCard = styled(Box)({
  borderRadius: 12,
  overflow: "hidden",
  marginBottom: 16,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
});

const HistoryHeader = styled(Box)({
  background: "#F5F8FB",
  padding: 12,
});

const HistoryBody = styled(Box)({
  padding: 16,
});

const SpacedTextSkeleton = styled(Skeleton)({
  marginBottom: 8,
});

const HistoryItemSkeleton = () => (
  <HistorySkeletonCard>
    <HistoryHeader>
      <Box display="flex" justifyContent="space-between">
        <Skeleton variant="rounded" width={140} height={22} />
        <Skeleton variant="rounded" width={100} height={22} />
      </Box>
    </HistoryHeader>
    <HistoryBody>
      <SpacedTextSkeleton variant="text" width="80%" height={22} />
      <Skeleton variant="text" width="100%" height={16} />
      <Skeleton variant="text" width="90%" height={16} />
      <Skeleton variant="text" width="60%" height={16} />
    </HistoryBody>
  </HistorySkeletonCard>
);

export const HistoryListSkeleton = () => (
  <Box>
    {[1, 2, 3].map((i) => (
      <HistoryItemSkeleton key={i} />
    ))}
  </Box>
);

export default HistoryItemSkeleton;
