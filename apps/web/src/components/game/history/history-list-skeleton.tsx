import { Box, Skeleton } from "@mui/material";

const SKELETON_ROWS = 4;

const HistoryListSkeleton: React.FC = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
      height: "100%",
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
          <Skeleton variant="text" width="60%" sx={{ fontSize: "1.25rem" }} />
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="50%" sx={{ fontSize: "0.75rem" }} />
        </Box>
      </Box>
    ))}
  </Box>
);

export default HistoryListSkeleton;
