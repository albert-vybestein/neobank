import { Check, Eye, KeyRound, Shield, ShieldCheck, Siren, UserCheck } from "lucide-react";

import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const pillars = [
  {
    title: "Safe smart account ownership",
    lines: ["Controlled by your keys", "No hidden custody"],
    icon: KeyRound
  },
  {
    title: "Permissions and policy modules",
    lines: ["Limits and allowlists", "Session keys for convenience, bounded by rules"],
    icon: Shield
  },
  {
    title: "Guards that enforce constraints",
    lines: ["Execution checks for every transaction", "Prevents policy bypass"],
    icon: ShieldCheck
  },
  {
    title: "Recovery without support custody",
    lines: ["Social recovery or time locked recovery", "Clear recovery timeline"],
    icon: UserCheck
  },
  {
    title: "Monitoring and transparency",
    lines: ["Real time activity feed", "Exportable statements"],
    icon: Eye
  }
];

const canItems = [
  "Help create and simulate transactions",
  "Provide risk controls and alerts",
  "Sponsor fees for a smooth experience"
];

const cannotItems = [
  "Move funds without your permissions",
  "Reset keys centrally",
  "Bypass your account rules"
];

export default function SecurityPage() {
  return (
    <>
      <Section className="pb-8 pt-20 md:pt-24">
        <Reveal>
          <div className="max-w-4xl space-y-5">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Security
              </Badge>
              <Badge variant="outline" className="bg-white text-slate-700">
                Ownership first
              </Badge>
            </div>
            <h1 className="text-5xl font-semibold leading-tight text-slate-950 md:text-6xl">Non custodial by design. Safer by default.</h1>
            <p className="text-lg leading-relaxed text-slate-700 md:text-xl">
              Your account is a Safe smart account. You keep ownership. Policies are enforced with audited modules.
            </p>
          </div>
        </Reveal>
      </Section>

      <Section className="pt-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map((pillar, index) => (
            <Reveal key={pillar.title} delay={index * 0.05}>
              <Card className="card-lift h-full bg-white/95">
                <CardHeader className="space-y-4">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <pillar.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {pillar.lines.map((line) => (
                      <li key={line} className="flex items-start gap-2 text-sm text-slate-700">
                        <Check className="mt-0.5 h-4 w-4 text-primary" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <Reveal>
          <div className="space-y-5">
            <h2 className="text-4xl font-semibold text-slate-950 md:text-5xl">What we can and cannot do</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2 text-base">We can</TableHead>
                  <TableHead className="text-base">We cannot</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[0, 1, 2].map((index) => (
                  <TableRow key={index}>
                    <TableCell className="text-base text-slate-700">
                      <div className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                        <span>{canItems[index]}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-base text-slate-700">
                      <div className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-rose-600" />
                        <span>{cannotItems[index]}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="card-lift bg-white/95">
              <CardHeader>
                <Siren className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Audit in progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-slate-600">Independent reviews are underway for account and policy modules.</p>
              </CardContent>
            </Card>
            <Card className="card-lift bg-white/95">
              <CardHeader>
                <ShieldCheck className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Bug bounty</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-slate-600">Responsible disclosure program with rewards for validated findings.</p>
              </CardContent>
            </Card>
            <Card className="card-lift bg-white/95">
              <CardHeader>
                <Eye className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Payments partners</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-slate-600">Regional partners provide card issuance and banking rails where available.</p>
              </CardContent>
            </Card>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="mt-6 text-sm text-slate-500">Security is a process. We publish updates.</p>
        </Reveal>
      </Section>
    </>
  );
}
