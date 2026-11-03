import { renderAppIcon } from "@/lib/appIcon";

export async function GET() {
  return renderAppIcon(192);
}
