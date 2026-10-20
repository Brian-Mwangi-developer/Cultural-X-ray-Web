"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/report";

// Replaces the root layout when it fails, so it brings its own document and inline styles.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportError(error, { where: "route.global", digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "grid",
          placeItems: "center",
          fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: "#ffffff",
          color: "#111113",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 380 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>Cultural X-Ray didn&rsquo;t load</h1>
          <p style={{ color: "#71717a", fontSize: 15, lineHeight: 1.6 }}>
            Something went wrong on our side. Your work is safe. Reload, and if it keeps happening, send us the reference below.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ background: "#ff6719", color: "#fff", border: 0, borderRadius: 999, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Reload
          </button>
          {error.digest && <p style={{ marginTop: 24, fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#71717a" }}>Reference {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
