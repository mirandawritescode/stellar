"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActiveRoute, TABS } from "@/lib/nav";
import { SPARKLE_PATH } from "@/lib/sparkle";

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/onboarding")) {
    return null;
  }

  return (
    <nav className="app-nav">
      <ul className="mx-auto flex h-full max-w-[640px] items-center justify-around">
        {TABS.map((tab) => {
          const active = isActiveRoute(pathname, tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`nav-link flex min-h-[44px] flex-col items-center justify-center gap-1.5 text-xs font-medium ${
                  active ? "active" : ""
                }`}
              >
                <svg className="nav-star" viewBox="0 0 24 24" aria-hidden="true">
                  <path d={SPARKLE_PATH} />
                </svg>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
