"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FlagIcon from "@mui/icons-material/Flag";

interface Props {
  onForfeit: () => void;
}

const InGameMenu: React.FC<Props> = ({ onForfeit }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleForfeitClick = () => {
    closeMenu();
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    onForfeit();
  };

  return (
    <>
      <IconButton
        onClick={() => setMenuOpen(true)}
        sx={{
          position: "absolute",
          bottom: 20,
          left: 20,
          zIndex: 20,
          bgcolor: "rgba(0,0,0,0.6)",
          color: "#fff",
          "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
        }}
        aria-label="Game menu"
      >
        <MoreVertIcon />
      </IconButton>

      <Dialog open={menuOpen} onClose={closeMenu} fullWidth maxWidth="xs">
        <DialogTitle>Game menu</DialogTitle>
        <DialogContent sx={{ px: 0 }}>
          <List>
            <ListItemButton onClick={handleForfeitClick}>
              <ListItemIcon>
                <FlagIcon color="error" />
              </ListItemIcon>
              <ListItemText sx={{ color: "error.main" }}>Forfeit game</ListItemText>
            </ListItemButton>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeMenu}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Forfeit game?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will end the game right away and take you to the results screen. This can&apos;t be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirm} color="error" variant="contained">
            Forfeit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InGameMenu;
