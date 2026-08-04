import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "geo.riek.me",
    short_name: "geo.riek.me",
    description: "GeoGuessr But Free",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#47a12b",
    icons: [
      {
        src: "/icons/app/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/app/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
