import { Box, Skeleton } from "@mui/material";

const SKELETON_ROWS = 4;

const MapListSkeleton: React.FC = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
      maxHeight: "100%",
      width: "100%",
      gap: 1,
      boxSizing: "border-box",
    }}
  >
    {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
      <Box
        key={i}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          p: 1,
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Skeleton
          variant="rounded"
          width={96}
          height={96}
          sx={{ flexShrink: 0 }}
        />
        <Box sx={{ minWidth: 0, width: "100%" }}>
          <Skeleton variant="text" width="50%" sx={{ fontSize: "1.25rem" }} />
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="70%" />
        </Box>
      </Box>
    ))}
  </Box>
);

export default MapListSkeleton;
