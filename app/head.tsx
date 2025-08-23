import React from "react";

/**
 * Head — Global <head> content
 * Inserts Google AdSense bootstrap script strictly between <head> and </head> on every page.
 * Note: AdSense recommends placing this snippet in the <head> of every page.
 */
export default function Head() {
  return (
    <>
      {/* Google AdSense global script: load in all environments for verification/testing */}
      <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2037794469328298"
        crossOrigin="anonymous"
      />
    </>
  );
}