import { Box, Skeleton } from "@mui/material";

const DocumentSkeleton = () => (
  <Box
    sx={{
      borderRadius: 3,
      p: 2,
      background: "#ffffff",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      mb: 1.5,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
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
  </Box>
);

export const DocumentListSkeleton = () => (
  <Box>
    {[1, 2, 3].map((i) => (
      <DocumentSkeleton key={i} />
    ))}
  </Box>
);

export default DocumentSkeleton;
