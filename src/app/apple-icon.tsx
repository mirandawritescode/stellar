import { renderAppIcon } from "@/lib/appIcon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  // iOS applies its own rounded-corner mask, so the source stays square.
  return renderAppIcon(180, { rounded: false });
}
