"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import ConnectButton from "./wallet/ConnectButton";

const BASE_NAV = [
  { href: "/swap", label: "Swap" },
  { href: "/mint", label: "Mint" },
  { href: "/explore", label: "Explore" },
  { href: "/wallet", label: "My Blocks" },
  { href: "/about", label: "About" },
] as const;

const ADMIN_ITEM = { href: "/admin", label: "Admin" } as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  // Hidden by default; AdminProbe (inside the wallet island) flips it on
  // when the connected account matches owner() on-chain. /admin itself is
  // independently owner-gated, so hiding the nav entry is purely cosmetic.
  const [isAdmin, setIsAdmin] = useState(false);
  const nav = isAdmin ? [...BASE_NAV, ADMIN_ITEM] : [...BASE_NAV];

  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className={`flex h-11 items-center rounded-block px-4 font-display font-semibold transition-colors duration-tap ${
                      isActive(pathname, item.href)
                        ? "bg-brand text-brand-ink"
                        : "text-ink-soft hover:bg-sunken hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ConnectButton onAdminStatus={setIsAdmin} />
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar: thumb-reachable primary actions. */}
      <nav
        aria-label="Primary mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-raised pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-5">
          {nav.slice(0, 4).map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 font-display text-xs font-bold ${
                  isActive(pathname, item.href) ? "text-brand" : "text-ink-soft"
                }`}
              >
                <TabIcon name={item.label} active={isActive(pathname, item.href)} />
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setSheetOpen((v) => !v)}
              aria-expanded={sheetOpen}
              aria-controls="mobile-more-sheet"
              className={`flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 font-display text-xs font-bold ${
                sheetOpen || isActive(pathname, "/about") || isActive(pathname, "/admin")
                  ? "text-brand"
                  : "text-ink-soft"
              }`}
            >
              <TabIcon name="More" active={sheetOpen} />
              More
            </button>
          </li>
        </ul>
        {sheetOpen ? (
          <div id="mobile-more-sheet" className="border-t border-line bg-raised p-3">
            <ul className="grid grid-cols-2 gap-2">
              {nav.slice(4).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className={`flex min-h-11 items-center justify-center rounded-block border font-display font-semibold ${
                      isActive(pathname, item.href)
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-line bg-bg text-ink-soft"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </nav>
    </>
  );
}

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = "currentColor";
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true as const };
  switch (name) {
    case "Mint":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="4" stroke={stroke} strokeWidth="2" fill={active ? "currentColor" : "none"} opacity={active ? 0.18 : 1} />
          <path d="M12 8.5v7M8.5 12h7" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "Swap":
      return (
        <svg {...common}>
          <path d="M4 8h13l-3-3M20 16H7l3 3" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "Explore":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="7" height="7" rx="2" stroke={stroke} strokeWidth="2" />
          <rect x="13" y="4" width="7" height="7" rx="2" stroke={stroke} strokeWidth="2" />
          <rect x="4" y="13" width="7" height="7" rx="2" stroke={stroke} strokeWidth="2" />
          <rect x="13" y="13" width="7" height="7" rx="2" stroke={stroke} strokeWidth="2" />
        </svg>
      );
    case "My Blocks":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="13" rx="3" stroke={stroke} strokeWidth="2" />
          <path d="M15 12.5h3" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="1.6" fill={stroke} />
          <circle cx="12" cy="12" r="1.6" fill={stroke} />
          <circle cx="18" cy="12" r="1.6" fill={stroke} />
        </svg>
      );
  }
}
