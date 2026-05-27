import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * HTML document shell for Expo web.
 * Only rendered on the server/at build time — not included in the native bundle.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        {/* Viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Primary SEO */}
        <title>Farmguard — AI Crop &amp; Livestock Diagnosis for Farmers</title>
        <meta
          name="description"
          content="Farmguard helps farmers identify crop diseases and livestock conditions with AI-powered photo diagnosis, a moon-aware planting calendar, and a local farmers market to buy and sell fresh produce."
        />
        <meta name="keywords" content="farm app, crop disease diagnosis, livestock health, farmers market, planting calendar, moon phase farming, AI agriculture" />
        <meta name="author" content="Farmguard" />
        <meta name="robots" content="index, follow" />

        {/* Theme */}
        <meta name="theme-color" content="#2D6A4F" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Farmguard" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Farmguard — AI Crop &amp; Livestock Diagnosis" />
        <meta
          property="og:description"
          content="Identify crop diseases and livestock conditions instantly with AI. Plan your planting by moon phase. Buy and sell fresh produce on the Farmguard Market."
        />
        <meta property="og:site_name" content="Farmguard" />
        <meta property="og:locale" content="en_US" />

        {/* Performance: preconnect to API */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

        {/* Expo Router resets scroll-view styling for web */}
        <ScrollViewStyleReset />

        {/* Prevent flash of unstyled content */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root { height: 100%; background-color: #F7F9F4; }
              body { margin: 0; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
