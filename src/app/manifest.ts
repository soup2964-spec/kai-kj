import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moodna — Expense Tracker",
    short_name: "Moodna",
    description: "Scan receipts and auto-categorize expenses",
    start_url: "/",
    display: "standalone",
    background_color: "#eceef1",
    theme_color: "#225aea",
    orientation: "portrait",
    icons: [
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
    ],
  };
}
