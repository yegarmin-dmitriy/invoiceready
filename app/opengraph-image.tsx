import { ImageResponse } from "next/og";

export const alt = "InvoiceReady — turn any invoice into a legally compliant EU e-invoice";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social share card for the live demo link.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "90px",
          backgroundColor: "#070b18",
          backgroundImage:
            "linear-gradient(135deg, rgba(99,102,241,0.35), rgba(139,92,246,0.15) 40%, rgba(217,70,239,0.28))",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            padding: "10px 22px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.25)",
            color: "#c7d2fe",
            fontSize: 26,
            fontWeight: 600,
          }}
        >
          EN 16931 · UBL 2.1 · Peppol BIS 3.0
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 34,
            fontSize: 118,
            fontWeight: 800,
            letterSpacing: "-3px",
            color: "#a78bfa",
          }}
        >
          InvoiceReady
        </div>
        <div style={{ display: "flex", marginTop: 20, fontSize: 44, fontWeight: 600, color: "#f1f5f9" }}>
          Turn any invoice — even a photo — into a
        </div>
        <div style={{ display: "flex", fontSize: 44, fontWeight: 600, color: "#f1f5f9" }}>
          legally compliant EU e-invoice in 30 seconds.
        </div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 28, color: "#94a3b8" }}>
          E-invoicing mandates are arriving across the EU — Poland, Belgium, France 2026+
        </div>
      </div>
    ),
    { ...size },
  );
}
