import type { Metadata } from "next";
import "./globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { Roboto } from "next/font/google";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import theme from "@/theme";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { auth } from "@/auth";
import AppShell from "@/components/layout/app-shell";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "geo.riek.me",
  description: "GeoGuessr But Free",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  let canManageMaps = false;
  if (session?.accessToken) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/me`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
      });
      if (res.ok) {
        const me: { permissions?: string[] } = await res.json();
        canManageMaps = me.permissions?.includes("MANAGE_MAPS") ?? false;
      }
    } catch {
      canManageMaps = false;
    }
  }

  return (
    <html lang="en" className={roboto.variable} suppressHydrationWarning style={{height:"100%"}}>
      <body style={{height:"100%"}}>
        <InitColorSchemeScript attribute="class" />
        <AppRouterCacheProvider options={{ key: "css" }} >
          <ThemeProvider theme={theme}>
            <CssBaseline />

            <AppShell username={session?.user?.name ?? null} canManageMaps={canManageMaps}>
              {children}
            </AppShell>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
