import Link from "next/link";
import { Check } from "lucide-react";

import { SignInButton } from "@/components/SignInButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PricingCardData = {
  name: string;
  description: string;
  price: string;
  features: string[];
  highlight?: boolean;
};

const defaultPlans: PricingCardData[] = [
  {
    name: "Personal",
    description: "Built for everyday global spending.",
    price: "$0",
    features: ["Virtual card", "One IBAN", "Multi currency balances", "Standard FX", "Basic limits"]
  },
  {
    name: "Plus",
    description: "Extra controls for active users.",
    price: "$14",
    features: [
      "Physical and virtual cards",
      "Extra accounts or pots",
      "Advanced controls",
      "Subscriptions automation",
      "Priority support"
    ],
    highlight: true
  },
  {
    name: "Business",
    description: "Policy driven finance for teams.",
    price: "Custom",
    features: ["Team cards", "Shared accounts", "Approval policies", "Accounting exports", "Admin roles"]
  }
];

type PricingCardsProps = {
  plans?: PricingCardData[];
  compact?: boolean;
};

export function PricingCards({ plans = defaultPlans, compact = false }: PricingCardsProps) {
  return (
    <div className={cn("grid gap-5 lg:grid-cols-3", compact && "lg:gap-4")}>
      {plans.map((plan) => (
        <Card
          key={plan.name}
          className={cn(
            "card-lift flex h-full flex-col bg-white/95",
            plan.highlight && "border-primary/50 bg-gradient-to-b from-blue-50 to-white"
          )}
        >
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            <p className="text-sm text-slate-600">{plan.description}</p>
            <p className="text-3xl font-semibold text-slate-900">{plan.price}</p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-6">
            <ul className="space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {plan.name === "Business" ? (
              <Button variant={plan.highlight ? "default" : "outline"} asChild>
                <Link href="mailto:sales@neobank.example">Contact sales</Link>
              </Button>
            ) : (
              <SignInButton journey="create" variant={plan.highlight ? "default" : "outline"}>
                Create account
              </SignInButton>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
