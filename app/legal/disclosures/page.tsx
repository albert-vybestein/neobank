import { Section } from "@/components/Section";
import { Badge } from "@/components/ui/badge";

export default function DisclosuresPage() {
  return (
    <Section className="pt-24">
      <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-border/80 bg-white/95 p-8 shadow-soft md:p-10">
        <Badge variant="outline" className="bg-white text-slate-700">
          Legal
        </Badge>
        <h1 className="text-4xl font-semibold text-slate-950 md:text-5xl">Disclosures</h1>
        <p className="text-sm text-slate-500">Last updated: February 22, 2026</p>
        <div className="space-y-4 text-base leading-relaxed text-slate-700">
          <p>
            NEOBANK is not a bank. Banking services and fiat payment rails are provided by regulated partners, subject to local eligibility and onboarding requirements.
          </p>
          <p>
            Account ownership is non custodial and remains with the user through smart account controls. Availability varies by country, product, and partner coverage.
          </p>
          <h2 className="text-2xl font-semibold text-slate-900">Partner disclosures</h2>
          <p>Cards, bank transfer rails, and account numbers are issued and operated by licensed regional partners.</p>
          <h2 className="text-2xl font-semibold text-slate-900">Regional availability</h2>
          <p>Features, limits, and onboarding requirements differ by country, partner, and account type.</p>
          <h2 className="text-2xl font-semibold text-slate-900">Risk statement</h2>
          <p>Investment, trading, and prediction products involve risk and may not be suitable for all users.</p>
        </div>
      </div>
    </Section>
  );
}
