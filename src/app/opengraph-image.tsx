import { ImageResponse } from "next/og";
import { SPARKLE_PATH } from "@/lib/sparkle";

export const alt = "Stellar — your to-do list, arranged around your star chart";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NIGHT_BG = "linear-gradient(165deg, #100d20 0%, #1a1434 55%, #231a40 100%)";
const ACCENT = "#c9b8ff";
const TEXT_HEADING = "#ece7fb";
const TEXT_MUTED = "#9d90c9";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: NIGHT_BG,
        }}
      >
        <svg width={88} height={88} viewBox="0 0 24 24" fill={ACCENT}>
          <path d={SPARKLE_PATH} />
        </svg>
        <div style={{ fontSize: 84, fontWeight: 600, color: TEXT_HEADING, fontStyle: "italic" }}>Stellar</div>
        <div style={{ fontSize: 34, color: TEXT_MUTED }}>Your to-do list, arranged around your star chart.</div>
      </div>
    ),
    { ...size },
  );
}
