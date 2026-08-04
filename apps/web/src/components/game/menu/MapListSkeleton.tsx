import { Box, Paper, Skeleton, Stack } from "@mui/material";

const SKELETON_ROWS = 4;

// Mirrors MapsLibrary's actual map row exactly (Paper, not a bordered Box — MapsLibrary's rows
// have no border, just Paper's default elevation shadow) so the loading state doesn't visibly
// jump/shift once the real rows swap in.
const MapListSkeleton: React.FC = () => (
  <Stack spacing={1}>
    {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
      <Paper
        key={i}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          p: 1,
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
      </Paper>
    ))}
  </Stack>
);

export default MapListSkeleton;
