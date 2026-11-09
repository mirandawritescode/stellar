import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stellar",
    short_name: "Stellar",
    description: "Your to-do list, arranged around your star chart.",
    start_url: "/",
    display: "standalone",
    background_color: "#100d20",
    theme_color: "#100d20",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
    ],
  };
}
