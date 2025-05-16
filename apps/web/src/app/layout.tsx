import type { Metadata } from "next";
import "./globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { Roboto } from "next/font/google";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import theme from "@/theme";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "GeoGuessr Clone",
  description: "GeoGuessr But Free",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={roboto.variable} suppressHydrationWarning style={{height:"100%"}}>
      <body style={{height:"100%"}}>
        <InitColorSchemeScript attribute="class" />
        <AppRouterCacheProvider options={{ key: "css" }} >
          <ThemeProvider theme={theme}>
            <CssBaseline />

            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
