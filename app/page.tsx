"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  CreditCard,
  Shield,
  Sparkles,
  Wallet
} from "lucide-react";

import { CinematicHeroVisual } from "@/components/CinematicHeroVisual";
import { FeatureGrid } from "@/components/FeatureGrid";
import { PhoneMock } from "@/components/PhoneMock";
import { PricingCards } from "@/components/PricingCards";
import { Reveal } from "@/components/Reveal";
import { SceneShift } from "@/components/SceneShift";
import { Section } from "@/components/Section";
import { SignInButton } from "@/components/SignInButton";
import { TrustStrip } from "@/components/TrustStrip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/site";

const partnerLogos = ["Northline", "Aster Payments", "Blue Orbit", "Sentinel", "Ledgerway", "Atlas"];

const principles = [
  {
    title: "Balances in fiat",
    body: "Always shown in EUR, USD, and GBP with clear totals.",
    icon: Wallet
  },
  {
    title: "No chain, no gas",
    body: "Tokens and network management stay behind the scenes.",
    icon: Shield
  },
  {
    title: "One tap flows",
    body: "Pay, transfer, split, subscribe with instant confirmation.",
    icon: Sparkles
  }
];

const steps = [
  {
    title: "Create account and passkey",
    body: "Secure sign in and immediate account setup.",
    icon: Wallet
  },
  {
    title: "Get card + IBAN",
    body: "Provision cards and local rails where available.",
    icon: CreditCard
  },
  {
    title: "Use it everywhere",
    body: "Move money globally with policy controls active by default.",
    icon: Building2
  }
];

export default function HomePage() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      <section className="hero-gradient relative overflow-hidden pt-28 pb-14 md:pt-36 md:pb-20">
        <div className="hero-light hero-light-a" aria-hidden />
        <div className="hero-light hero-light-b" aria-hidden />
        <div className="hero-light hero-light-c" aria-hidden />

        <div className="container grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8"
          >
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="bg-white/80 text-slate-700">
                Smart account onboarding
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Security by design
              </Badge>
              <p className="text-sm font-medium text-slate-600">{siteConfig.tagline}</p>
            </div>

            <div className="space-y-5">
              <h1 className="headline-xl max-w-3xl">A global bank account you actually own.</h1>
              <p className="body-lg max-w-2xl">
                Cards and IBANs worldwide, instant transfers, and precise money controls. Safe smart accounts protect ownership while the experience stays clean and familiar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <SignInButton size="lg">Sign in</SignInButton>
              <Button size="lg" variant="outline" asChild>
                <Link href="/how-it-works">See how it works</Link>
              </Button>
            </div>

            <TrustStrip />
          </motion.div>

          <Reveal delay={0.1}>
            <CinematicHeroVisual />
          </Reveal>
        </div>
      </section>

      <Section className="pt-8 md:pt-10">
        <Reveal>
          <div className="glass-panel p-6 md:p-8">
            <p className="text-base font-medium text-slate-700">
              Built by teams from payments, security, and crypto infrastructure.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {partnerLogos.map((logo) => (
                <span
                  key={logo}
                  className="rounded-full border border-border/80 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </Section>

      <Section className="py-10 md:py-14">
        <Reveal>
          <p className="chapter-divider">Money should feel calm.</p>
        </Reveal>
      </Section>

      <Section className="pt-4">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-start">
          <Reveal>
            <div className="space-y-6">
              <Badge variant="outline" className="bg-white text-slate-700">Chapter one</Badge>
              <h2 className="headline-lg max-w-2xl">Looks like a modern neobank. Operates with programmable ownership.</h2>
              <p className="body-lg max-w-2xl">
                The interface stays familiar. The architecture adds depth where it matters: permissions, recovery, and traceable control.
              </p>

              <div className="grid gap-3">
                {principles.map((item, index) => (
                  <Reveal key={item.title} delay={0.08 * index}>
                    <Card className="scene-card card-lift">
                      <CardHeader>
                        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-xl">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-base text-slate-600">{item.body}</p>
                      </CardContent>
                    </Card>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="glass-panel p-4 md:p-5">
              <PhoneMock variant="transfer" className="max-w-[370px]" />
            </div>
          </Reveal>
        </div>
      </Section>

      <SceneShift />

      <Section className="pt-8">
        <Reveal>
          <div className="mb-10 max-w-3xl space-y-4">
            <Badge variant="outline" className="bg-white text-slate-700">Chapter two</Badge>
            <h2 className="headline-lg">Core capabilities with clear controls</h2>
            <p className="body-lg">
              Global cards, shared accounts, transfer rails, and policy modules are composed into one precise system.
            </p>
          </div>
        </Reveal>
        <FeatureGrid />
      </Section>

      <Section>
        <Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <Reveal key={step.title} delay={index * 0.08}>
                <Card className="scene-card card-lift h-full">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base text-slate-600">{step.body}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </Reveal>
        <div className="mt-8">
          <Button variant="outline" size="lg" asChild>
            <Link href="/how-it-works">
              See how it works
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>

      <Section>
        <Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="scene-card card-lift">
              <CardHeader>
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Your account is a Safe smart account</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-slate-600">Ownership stays with your keys. No hidden custody.
                </p>
              </CardContent>
            </Card>
            <Card className="scene-card card-lift">
              <CardHeader>
                <BadgeCheck className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Modules enforce limits and permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-slate-600">Rules apply to cards, transfers, and sub-accounts before execution.</p>
              </CardContent>
            </Card>
            <Card className="scene-card card-lift">
              <CardHeader>
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Recovery built in</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-slate-600">Time locks and guardian flows protect long term access.</p>
              </CardContent>
            </Card>
          </div>
        </Reveal>
        <div className="mt-8">
          <Button variant="outline" size="lg" asChild>
            <Link href="/security">Security model</Link>
          </Button>
        </div>
      </Section>

      <Section>
        <Reveal>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="headline-lg">Choose a plan that fits how you move money</h2>
              <p className="body-lg mt-3">Personal for individuals, Plus for power users, Business for teams.</p>
            </div>
          </div>
        </Reveal>
        <PricingCards compact />
        <div className="mt-8">
          <Button variant="outline" size="lg" asChild>
            <Link href="/pricing">Compare plans</Link>
          </Button>
        </div>
      </Section>

      <Section className="pt-8">
        <Reveal>
          <Card className="relative overflow-hidden border-white/15 bg-slate-950 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(59,130,246,0.3),transparent_40%),radial-gradient(circle_at_88%_20%,rgba(6,182,212,0.24),transparent_34%)]" />
            <CardContent className="relative p-8 md:p-12">
              <div className="max-w-3xl space-y-6">
                <h2 className="text-[clamp(2rem,4.6vw,3.4rem)] font-semibold leading-[0.98] tracking-[-0.035em]">
                  Start with a better account. Keep full control.
                </h2>
                <p className="text-lg text-slate-300">
                  Global cards and local rails with ownership, clarity, and policy controls built into every action.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <SignInButton size="lg">Sign in</SignInButton>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-slate-700 bg-transparent text-white hover:bg-slate-800"
                    asChild
                  >
                    <Link href="mailto:sales@neobank.example">
                      <Briefcase className="h-4 w-4" />
                      Contact sales
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </Section>
    </>
  );
}
