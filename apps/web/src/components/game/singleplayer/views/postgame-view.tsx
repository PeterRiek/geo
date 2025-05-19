import { Box, Button, Typography } from "@mui/material";

const PostgameView = () => (
  <Box
    sx={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: 4,
      p: 4,
    }}
  >
    <Typography variant="h1" textAlign="center">
      Thanks for playing!
    </Typography>
    <Button href="/game" variant="contained" size="large">
      BACK TO MENU
    </Button>
  </Box>
);

export default PostgameView;
