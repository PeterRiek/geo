import { Button, Container, Stack } from "@mui/material";
import React from "react";

const GamePage = () => {
  return (
    <Container>
      <Stack>
        <Button href="g/singleplayer">Singleplayer</Button>
        <Button href="g/multiplayer">Mutliplayer</Button>
      </Stack>
    </Container>
  );
};

export default GamePage;
