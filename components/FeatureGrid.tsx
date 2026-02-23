import { Banknote, CreditCard, Earth, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/Reveal";

const features = [
  {
    title: "Global IBAN accounts",
    body: "Open accounts built for local payouts and global income.",
    icon: Banknote
  },
  {
    title: "Cards that just work",
    body: "Use one card across merchants, devices, and travel flows.",
    icon: CreditCard
  },
  {
    title: "Instant global transfers",
    body: "Move money quickly with transparent previews before you confirm.",
    icon: Earth
  },
  {
    title: "Shared accounts",
    body: "Manage money with family or teams using roles and approvals.",
    icon: Users
  },
  {
    title: "Smart controls",
    body: "Define rules, caps, and recipient permissions from one place.",
    icon: SlidersHorizontal
  },
  {
    title: "You own the account",
    body: "Ownership stays with you while rails and cards stay seamless.",
    icon: ShieldCheck
  }
];

export function FeatureGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {features.map((feature, index) => (
        <Reveal key={feature.title} delay={index * 0.05}>
            <Card className="card-lift h-full bg-white/90">
              <CardHeader>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" aria-hidden />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                {feature.title === "You own the account" ? (
                  <Badge variant="outline" className="w-fit bg-blue-50 text-blue-700">
                    Security
                  </Badge>
                ) : null}
              </CardHeader>
            <CardContent>
              <p className="text-base text-slate-600">{feature.body}</p>
            </CardContent>
          </Card>
        </Reveal>
      ))}
    </div>
  );
}
