import Link from "next/link";
import { ComponentType } from "react";
import { Check, CreditCard, Globe2, Layers, ShieldCheck, Users } from "lucide-react";

import { PhoneMock } from "@/components/PhoneMock";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { SignInButton } from "@/components/SignInButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ProductSection = {
  id: string;
  title: string;
  description: string;
  bullets: string[];
  variant: "cards" | "iban" | "transfer" | "shared" | "policies" | "subscriptions";
  icon: ComponentType<{ className?: string }>;
};

const sections: ProductSection[] = [
  {
    id: "cards",
    title: "Cards",
    description: "Configure each card with limits and controls that stay easy to use day to day.",
    bullets: ["Physical and virtual", "Apple Pay and Google Pay", "Receipts and categories", "Spend controls and freeze"],
    variant: "cards",
    icon: CreditCard
  },
  {
    id: "iban",
    title: "IBAN accounts",
    description: "Use local account details for salary and transfers, with sharing built into the app.",
    bullets: [
      "Receive salary",
      "SEPA and international transfers where available",
      "Beneficiaries and templates"
    ],
    variant: "iban",
    icon: Globe2
  },
  {
    id: "transfers",
    title: "Global transfers and FX",
    description: "Preview outcomes before you confirm, including fees and expected arrival time.",
    bullets: ["Transparent preview", "Clear fees", "Fast delivery"],
    variant: "transfer",
    icon: Layers
  },
  {
    id: "shared",
    title: "Shared accounts",
    description: "Run family or team money with roles, approvals, and individual limits.",
    bullets: ["Couples, teams, family", "Roles and approvals", "Limits per member"],
    variant: "shared",
    icon: Users
  },
  {
    id: "controls",
    title: "Controls and limits",
    description: "Set account level rules that apply consistently across cards and transfers.",
    bullets: ["Per transaction caps", "Daily and monthly limits", "Recipient allowlists", "Category controls"],
    variant: "policies",
    icon: ShieldCheck
  },
  {
    id: "subscriptions",
    title: "Subscriptions",
    description: "Handle recurring payments with one tap pause, revoke, and category level caps.",
    bullets: ["Recurring payments", "Caps by amount and cadence", "One tap pause or revoke"],
    variant: "subscriptions",
    icon: CreditCard
  }
];

export default function ProductPage() {
  return (
    <>
      <Section className="pb-10 pt-20 md:pt-24">
        <Reveal>
          <div className="max-w-4xl space-y-5">
            <Badge variant="outline" className="bg-white text-slate-700">
              Product overview
            </Badge>
            <h1 className="text-5xl font-semibold leading-tight text-slate-950 md:text-6xl">
              Everything you expect from a neobank. More control than a bank.
            </h1>
            <p className="text-lg leading-relaxed text-slate-700 md:text-xl">
              Cards, IBANs, global transfers, shared accounts, and policies that protect you by default.
            </p>
          </div>
        </Reveal>
      </Section>

      {sections.map((section, index) => (
        <Section key={section.id} className={index === 0 ? "pt-6" : "pt-2"}>
          <Reveal>
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
              <Card className="order-2 bg-white/95 lg:order-1">
                <CardContent className="space-y-6 p-8">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <section.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-4xl font-semibold text-slate-950">{section.title}</h2>
                    <p className="text-lg text-slate-600">{section.description}</p>
                  </div>
                  <ul className="space-y-3">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2 text-base text-slate-700">
                        <Check className="mt-1 h-4 w-4 text-primary" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <div className="order-1 lg:order-2">
                <PhoneMock variant={section.variant} className="max-w-[350px]" />
              </div>
            </div>
          </Reveal>
        </Section>
      ))}

      <Section>
        <Reveal>
          <Card className="bg-slate-950 text-white">
            <CardContent className="flex flex-col items-center gap-6 p-10 text-center md:p-14">
              <h2 className="text-4xl font-semibold md:text-5xl">Ready to switch to a more controllable account?</h2>
              <p className="max-w-2xl text-lg text-slate-300">Sign in to connect and deploy your account setup with policy modules.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <SignInButton size="lg">Sign in</SignInButton>
                <Button size="lg" variant="outline" className="border-slate-700 bg-transparent text-white hover:bg-slate-800" asChild>
                  <Link href="/pricing">See pricing</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </Section>
    </>
  );
}
