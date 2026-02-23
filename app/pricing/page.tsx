import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { PricingCards } from "@/components/PricingCards";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const monthlyPlans = [
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

const annualPlans = [
  {
    name: "Personal",
    description: "Built for everyday global spending.",
    price: "$0",
    features: ["Virtual card", "One IBAN", "Multi currency balances", "Standard FX", "Basic limits"]
  },
  {
    name: "Plus",
    description: "Extra controls for active users.",
    price: "$140",
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

const feeItems = [
  {
    title: "FX markup",
    body: "From X% depending on corridor, plan, and routing conditions at confirmation time."
  },
  {
    title: "Card replacement",
    body: "Standard replacement fee applies for physical cards. Expedited shipping may include additional charges."
  },
  {
    title: "ATM usage",
    body: "Monthly free allowance depends on plan tier. Out of allowance withdrawals include a fixed fee."
  },
  {
    title: "International transfers",
    body: "Transfer fees vary by destination and rail. A full fee preview is shown before confirmation."
  },
  {
    title: "Premium support",
    body: "Priority support is included with Plus and Business. Dedicated onboarding is available for Business."
  }
];

export default function PricingPage() {
  return (
    <>
      <Section className="pb-8 pt-20 md:pt-24">
        <Reveal>
          <div className="max-w-4xl space-y-5">
            <Badge variant="outline" className="bg-white text-slate-700">
              Pricing
            </Badge>
            <h1 className="text-5xl font-semibold leading-tight text-slate-950 md:text-6xl">Plans for personal and global finance.</h1>
            <p className="text-lg leading-relaxed text-slate-700 md:text-xl">
              Start free, upgrade for deeper controls, or choose Business for teams with approvals and exports.
            </p>
          </div>
        </Reveal>
      </Section>

      <Section className="pt-6">
        <Reveal>
          <Tabs defaultValue="monthly" className="space-y-6">
            <TabsList>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="annual">Annual</TabsTrigger>
            </TabsList>
            <TabsContent value="monthly">
              <PricingCards plans={monthlyPlans} />
            </TabsContent>
            <TabsContent value="annual">
              <PricingCards plans={annualPlans} />
              <p className="mt-4 text-sm text-slate-500">Annual pricing shown as billed yearly.</p>
            </TabsContent>
          </Tabs>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <div className="space-y-5">
            <h2 className="text-4xl font-semibold text-slate-950 md:text-5xl">Fees</h2>
            <Accordion type="single" collapsible className="rounded-3xl border border-border/80 bg-white px-6 shadow-soft">
              {feeItems.map((item, index) => (
                <AccordionItem key={item.title} value={`fee-${index}`}>
                  <AccordionTrigger className="text-base md:text-lg">{item.title}</AccordionTrigger>
                  <AccordionContent className="text-base leading-relaxed">{item.body}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
