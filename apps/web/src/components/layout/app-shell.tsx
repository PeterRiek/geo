"use client";

import { usePathname } from "next/navigation";
import { Box } from "@mui/material";
import AppHeader from "./app-header";

interface Props {
  username: string | null;
  children: React.ReactNode;
}

const AppShell: React.FC<Props> = ({ username, children }) => {
  const pathname = usePathname();
  const isFullScreenView =
    pathname?.startsWith("/game/play") || pathname?.startsWith("/history/");

  if (isFullScreenView) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <AppHeader username={username} />
      <Box component="main" sx={{ flex: 1, minHeight: 0 }}>
        {children}
      </Box>
    </Box>
  );
};

export default AppShell;
