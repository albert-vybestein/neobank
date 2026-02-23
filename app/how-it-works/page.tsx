import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { FAQAccordion } from "@/components/FAQAccordion";
import { LayerDiagram } from "@/components/LayerDiagram";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const steps = [
  {
    title: "Create account with passkey",
    body: "Set up your profile and sign in with passkey authentication for secure access across devices."
  },
  {
    title: "Smart account is created",
    body: "A Safe smart account is deployed behind the scenes and connected to your app profile."
  },
  {
    title: "Get card and IBAN from regulated partners",
    body: "Card credentials and local account details are provisioned through regional partners."
  },
  {
    title: "Spending and transfers follow policies",
    body: "Defined limits, allowlists, and approvals are enforced before transactions execute."
  },
  {
    title: "Revoke permissions anytime",
    body: "Pause cards, remove sessions, and tighten policies in a few taps whenever needed."
  }
];

const faqItems = [
  {
    question: "Do I need to think about crypto?",
    answer:
      "No. You see fiat balances and use cards and bank transfers. The underlying architecture improves ownership and controls."
  },
  {
    question: "What if I lose my phone?",
    answer:
      "You can recover access with guardians and time locks. Recovery is explicit, transparent, and does not require support custody."
  },
  {
    question: "Who holds my money?",
    answer:
      "Account ownership remains with your non custodial smart account, while regulated partners provide fiat rails and local banking services where required."
  }
];

export default function HowItWorksPage() {
  return (
    <>
      <Section className="pb-8 pt-20 md:pt-24">
        <Reveal>
          <div className="max-w-4xl space-y-5">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-white text-slate-700">
                Architecture
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Security
              </Badge>
            </div>
            <h1 className="text-5xl font-semibold leading-tight text-slate-950 md:text-6xl">
              A modern account, built on programmable ownership.
            </h1>
            <p className="text-lg leading-relaxed text-slate-700 md:text-xl">
              You get cards and IBANs, while smart accounts provide control and safety under the hood.
            </p>
          </div>
        </Reveal>
      </Section>

      <Section className="pt-8">
        <Reveal>
          <LayerDiagram />
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <div className="space-y-5">
            <h2 className="text-4xl font-semibold text-slate-950 md:text-5xl">Step by step</h2>
            <Accordion type="single" collapsible className="rounded-3xl border border-border/80 bg-white px-6 shadow-soft">
              {steps.map((step, index) => (
                <AccordionItem key={step.title} value={`step-${index}`}>
                  <AccordionTrigger className="text-base md:text-lg">{step.title}</AccordionTrigger>
                  <AccordionContent className="text-base leading-relaxed">{step.body}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <div className="space-y-5">
            <h2 className="text-4xl font-semibold text-slate-950 md:text-5xl">FAQ</h2>
            <FAQAccordion items={faqItems} />
          </div>
        </Reveal>
      </Section>
    </>
  );
}
