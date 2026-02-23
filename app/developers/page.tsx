import { Code2, CreditCard, ShieldCheck, Wallet } from "lucide-react";

import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const blocks = [
  {
    title: "Account primitives",
    body: "Create accounts, manage permissions, and support shared account structures with clear ownership boundaries.",
    icon: Wallet
  },
  {
    title: "Policy engine",
    body: "Attach limits, allowlists, and session scopes so app actions remain bounded by explicit rules.",
    icon: ShieldCheck
  },
  {
    title: "Payments",
    body: "Trigger card and bank transfer workflows through partner rails with a consistent SDK experience.",
    icon: CreditCard
  }
];

const codeSample = `import { NeobankClient } from "@neobank/sdk";

const client = new NeobankClient({ appId: "app_123" });

const account = await client.accounts.create({
  owner: "user_42",
  type: "personal"
});

await client.policies.update(account.id, {
  dailyLimit: "2000",
  recipientAllowlist: ["merchant_1", "beneficiary_7"]
});

await client.payments.transfer({
  accountId: account.id,
  amount: "100.00",
  currency: "EUR",
  destination: "beneficiary_7"
});`;

export default function DevelopersPage() {
  return (
    <>
      <Section className="pb-8 pt-20 md:pt-24">
        <Reveal>
          <div className="max-w-4xl space-y-5">
            <Badge variant="outline" className="bg-white text-slate-700">
              Developers
            </Badge>
            <h1 className="text-5xl font-semibold leading-tight text-slate-950 md:text-6xl">
              Integrate programmable accounts without exposing complexity.
            </h1>
            <p className="text-lg leading-relaxed text-slate-700 md:text-xl">
              Use smart accounts, policies, and payment primitives through a clean SDK surface.
            </p>
          </div>
        </Reveal>
      </Section>

      <Section className="pt-8">
        <div className="grid gap-4 md:grid-cols-3">
          {blocks.map((block, index) => (
            <Reveal key={block.title} delay={index * 0.05}>
              <Card className="card-lift h-full bg-white/95">
                <CardHeader>
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <block.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-2xl">{block.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base text-slate-600">{block.body}</p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <Reveal>
          <Card className="overflow-hidden bg-slate-950 text-slate-100">
            <CardHeader className="border-b border-slate-800">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Code2 className="h-4 w-4" />
                API sketch
              </div>
              <CardTitle className="text-2xl text-white">Static SDK example</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <pre className="overflow-x-auto p-6 text-sm leading-relaxed">
                <code>{codeSample}</code>
              </pre>
            </CardContent>
          </Card>
        </Reveal>
      </Section>
    </>
  );
}
