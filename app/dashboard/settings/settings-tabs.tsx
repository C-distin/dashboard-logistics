"use client";

import { IconArrowsExchange, IconCurrencyDollar } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  {
    label: "Exchange Rates",
    href: "/dashboard/settings/exchange-rates",
    icon: IconArrowsExchange,
  },
  {
    label: "Price Rates",
    href: "/dashboard/settings/price-rates",
    icon: IconCurrencyDollar,
  },
];

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b">
      <nav className="flex gap-0" aria-label="Settings tabs">
        {TABS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
