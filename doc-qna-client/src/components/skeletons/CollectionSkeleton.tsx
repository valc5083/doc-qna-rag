import { Box, Skeleton } from "@mui/material";

const CollectionSkeleton = () => (
  <Box
    sx={{
      borderRadius: 3,
      overflow: "hidden",
      mb: 2,
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    }}
  >
    <Box
      sx={{
        background: "linear-gradient(135deg, #d0d8e4, #b8c4d4)",
        p: 2,
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" gap={1} alignItems="center">
          <Skeleton
            variant="circular"
            width={24}
            height={24}
            sx={{ bgcolor: "rgba(255,255,255,0.3)" }}
          />
          <Skeleton
            variant="text"
            width={120}
            height={24}
            sx={{ bgcolor: "rgba(255,255,255,0.3)" }}
          />
        </Box>
        <Skeleton
          variant="rounded"
          width={80}
          height={28}
          sx={{ bgcolor: "rgba(255,255,255,0.3)" }}
        />
      </Box>
    </Box>
  </Box>
);

export const CollectionListSkeleton = () => (
  <Box>
    {[1, 2].map((i) => (
      <CollectionSkeleton key={i} />
    ))}
  </Box>
);

export default CollectionSkeleton;
