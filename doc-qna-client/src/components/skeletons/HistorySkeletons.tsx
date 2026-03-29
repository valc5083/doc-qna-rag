import { Box, Skeleton } from "@mui/material";

const HistoryItemSkeleton = () => (
  <Box
    sx={{
      borderRadius: 3,
      overflow: "hidden",
      mb: 2,
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    }}
  >
    <Box sx={{ background: "#F5F8FB", p: 1.5 }}>
      <Box display="flex" justifyContent="space-between">
        <Skeleton variant="rounded" width={140} height={22} />
        <Skeleton variant="rounded" width={100} height={22} />
      </Box>
    </Box>
    <Box sx={{ p: 2 }}>
      <Skeleton variant="text" width="80%" height={22} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="100%" height={16} />
      <Skeleton variant="text" width="90%" height={16} />
      <Skeleton variant="text" width="60%" height={16} />
    </Box>
  </Box>
);

export const HistoryListSkeleton = () => (
  <Box>
    {[1, 2, 3].map((i) => (
      <HistoryItemSkeleton key={i} />
    ))}
  </Box>
);

export default HistoryItemSkeleton;
