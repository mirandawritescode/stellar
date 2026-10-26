export interface Tab {
  label: string;
  href: string;
}

export const TABS: Tab[] = [
  { label: "Today", href: "/" },
  { label: "Tasks", href: "/tasks" },
  { label: "Chart", href: "/chart" },
  { label: "Settings", href: "/settings" },
];

export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
