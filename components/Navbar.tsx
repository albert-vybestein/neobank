"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@/components/SignInButton";
import { siteConfig } from "@/lib/site";

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isActivePath = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b border-white/60 backdrop-blur-xl transition-all duration-500 ${
        scrolled ? "bg-white/88 shadow-[0_12px_30px_-22px_rgba(15,23,42,0.4)]" : "bg-white/70"
      }`}
    >
      <div className="container">
        <div className={`flex items-center justify-between gap-4 transition-all duration-500 ${scrolled ? "h-16" : "h-20"}`}>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-semibold tracking-[-0.03em] text-slate-900">
              {siteConfig.brandName}
            </Link>
            <Badge variant="outline" className="hidden bg-white/80 text-slate-600 sm:inline-flex">
              Smart account onboarding
            </Badge>
          </div>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
            {siteConfig.navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors duration-300 ${
                  isActivePath(item.href) ? "text-slate-900" : "text-slate-600 hover:text-slate-900"
                }`}
                aria-current={isActivePath(item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <SignInButton
              journey="sign-in"
              eventLocation="navbar_login"
              variant="outline"
              className="h-10 rounded-xl border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
            >
              Log in
            </SignInButton>
            <SignInButton
              journey="create"
              eventLocation="navbar_create"
              className="h-10 rounded-xl px-5 text-sm font-semibold shadow-[0_10px_22px_-12px_rgba(37,99,235,0.75)]"
            >
              Create account
            </SignInButton>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <div id="mobile-menu" className="border-t border-border bg-white/95 pb-4 lg:hidden">
          <div className="container grid gap-2 py-4">
            {siteConfig.navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-2xl px-4 py-3 text-sm font-medium transition hover:bg-slate-100 ${
                  isActivePath(item.href) ? "bg-slate-100 text-slate-900" : "text-slate-700"
                }`}
                aria-current={isActivePath(item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
            <SignInButton
              journey="sign-in"
              eventLocation="mobile_login"
              variant="outline"
              className="h-11 w-full rounded-2xl border-slate-300 bg-white text-sm font-semibold text-slate-800"
              onClick={() => setMobileOpen(false)}
            >
              Log in
            </SignInButton>
          </div>
          <div className="sticky bottom-0 border-t border-border bg-white/90 px-4 py-3 backdrop-blur">
            <SignInButton
              journey="create"
              eventLocation="mobile_create"
              className="h-11 w-full rounded-2xl text-sm font-semibold"
              onClick={() => setMobileOpen(false)}
            >
              Create account
            </SignInButton>
          </div>
        </div>
      ) : null}
    </header>
  );
}
