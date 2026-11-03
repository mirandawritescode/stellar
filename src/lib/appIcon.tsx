import { ImageResponse } from "next/og";

const NIGHT_BG = "#100d20";
const ACCENT = "#c9b8ff";

// A four-pointed sparkle, drawn as a path instead of the "✦" character:
// the ImageResponse renderer's default font doesn't include that glyph.
const SPARKLE_PATH =
  "M12 0c0 0 1.5 8.5 4 11 2.5 2.5 8 1 8 1s-5.5 1.5-8 4c-2.5 2.5-4 8-4 8s-1.5-5.5-4-8c-2.5-2.5-8-4-8-4s5.5 1.5 8-1c2.5-2.5 4-11 4-11z";

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
