import { ImageResponse } from "next/og";
import { SPARKLE_PATH } from "@/lib/sparkle";

const NIGHT_BG = "#100d20";
const ACCENT = "#c9b8ff";

export function renderAppIcon(size: number, { rounded = true }: { rounded?: boolean } = {}) {
  const glyphSize = size * 0.56;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: NIGHT_BG,
          borderRadius: rounded ? size * 0.22 : 0,
        }}
      >
        <svg width={glyphSize} height={glyphSize} viewBox="0 0 24 24" fill={ACCENT}>
          <path d={SPARKLE_PATH} />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
