"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActiveRoute, TABS } from "@/lib/nav";

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/onboarding")) {
    return null;
  }

  return (
    <nav className="app-nav sticky bottom-0">
      <ul className="mx-auto flex max-w-[640px] items-stretch justify-around">
        {TABS.map((tab) => {
          const active = isActiveRoute(pathname, tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`nav-link flex min-h-[44px] items-center justify-center py-2 text-sm font-medium ${
                  active ? "active" : ""
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
