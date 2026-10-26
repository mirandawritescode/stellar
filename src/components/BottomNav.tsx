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
    <nav className="sticky bottom-0 border-t border-black/[.08] bg-white dark:border-white/[.145] dark:bg-black">
      <ul className="mx-auto flex max-w-[720px] items-stretch justify-around">
        {TABS.map((tab) => {
          const active = isActiveRoute(pathname, tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[44px] items-center justify-center py-2 text-sm font-medium ${
                  active
                    ? "text-black dark:text-zinc-50"
                    : "text-zinc-500 dark:text-zinc-400"
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
