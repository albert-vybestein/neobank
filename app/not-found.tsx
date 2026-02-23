import Link from "next/link";

import { SignInButton } from "@/components/SignInButton";
import { Section } from "@/components/Section";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Section className="pt-24">
      <div className="mx-auto max-w-2xl rounded-3xl border border-border/80 bg-white/95 p-10 text-center shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">404</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-950 md:text-5xl">Page not found</h1>
        <p className="mt-4 text-lg text-slate-600">The page you requested does not exist or may have moved.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
          <SignInButton variant="outline">Sign in</SignInButton>
        </div>
      </div>
    </Section>
  );
}
