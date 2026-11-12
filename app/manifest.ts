import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "پۆلا",
    short_name: "پۆلا",
    description: "تۆڕی کۆمەڵایەتی پۆلا",
    lang: "ckb",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/pwa-icons/192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icons/512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icons/maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
