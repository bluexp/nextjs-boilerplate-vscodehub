import React from "react";

/**
 * Head — Global <head> content
 * Inserts Google AdSense bootstrap script strictly between <head> and </head> on every page.
 * Note: AdSense recommends placing this snippet in the <head> of every page.
 */
export default function Head() {
  return (
    <>
      {/* Google AdSense site association meta tag: must be present in <head> on every page */}
      <meta name="google-adsense-account" content="ca-pub-2037794469328298" />

      {/* Google AdSense global script (only load in production) */}
      {process.env.NODE_ENV === "production" && (
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2037794469328298"
          crossOrigin="anonymous"
        />
      )}
    </>
  );
}