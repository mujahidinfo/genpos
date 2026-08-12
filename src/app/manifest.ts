import type { MetadataRoute } from "next";

/**
 * Served by Next at /manifest.webmanifest (referenced from the root layout).
 * `display: standalone` is what makes the installed app open without browser
 * chrome; without `start_url` + `display` Chrome will not offer to install.
 */
export default function manifest(): MetadataRoute.Manifest {
  const name = process.env.NEXT_PUBLIC_APP_NAME ?? "GenPOS";

  return {
    name: `${name} – Point of Sale`,
    short_name: name,
    description:
      "Point-of-sale, inventory, customers and finance for small shops — works on any phone or tablet.",
    // Open straight into the till rather than the marketing page.
    start_url: "/sales",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#4f46e5",
    lang: "en",
    dir: "ltr",
    categories: ["business", "finance", "productivity", "shopping"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Maskable variants keep the glyph inside Android's adaptive-icon safe zone.
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "New Sale", short_name: "Sell", url: "/sales" },
      { name: "Inventory", short_name: "Stock", url: "/inventory" },
      { name: "Orders", short_name: "Orders", url: "/orders" },
    ],
  };
}
