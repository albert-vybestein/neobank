import { Section } from "@/components/Section";
import { Badge } from "@/components/ui/badge";

export default function TermsPage() {
  return (
    <Section className="pt-24">
      <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-border/80 bg-white/95 p-8 shadow-soft md:p-10">
        <Badge variant="outline" className="bg-white text-slate-700">
          Legal
        </Badge>
        <h1 className="text-4xl font-semibold text-slate-950 md:text-5xl">Terms of service</h1>
        <p className="text-sm text-slate-500">Last updated: February 22, 2026</p>
        <div className="space-y-4 text-base leading-relaxed text-slate-700">
          <p>
            These terms govern access to NEOBANK account features, cards, and transfer tools. Specific capabilities may vary by region and partner availability.
          </p>
          <p>
            Use of card and banking rail services is subject to regulated partner terms. Users are responsible for account credentials, permissions, and policy configuration.
          </p>
          <h2 className="text-2xl font-semibold text-slate-900">Eligibility and account use</h2>
          <p>Users must complete required onboarding checks and keep account information accurate and current.</p>
          <h2 className="text-2xl font-semibold text-slate-900">Prohibited activity</h2>
          <p>Accounts may not be used for fraud, sanctions evasion, money laundering, or other unlawful activity.</p>
          <h2 className="text-2xl font-semibold text-slate-900">Service changes</h2>
          <p>We may change or discontinue features with notice when required by law or partner obligations.</p>
        </div>
      </div>
    </Section>
  );
}
