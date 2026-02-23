import { Section } from "@/components/Section";
import { Badge } from "@/components/ui/badge";

export default function PrivacyPage() {
  return (
    <Section className="pt-24">
      <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-border/80 bg-white/95 p-8 shadow-soft md:p-10">
        <Badge variant="outline" className="bg-white text-slate-700">
          Legal
        </Badge>
        <h1 className="text-4xl font-semibold text-slate-950 md:text-5xl">Privacy policy</h1>
        <p className="text-sm text-slate-500">Last updated: February 22, 2026</p>
        <div className="space-y-4 text-base leading-relaxed text-slate-700">
          <p>
            We collect only the information required to provide account services, comply with regulations, and improve reliability. Sensitive actions are logged for user transparency.
          </p>
          <p>
            Data processing for card issuance and fiat rails is performed with regulated partners under contractual safeguards and applicable local laws.
          </p>
          <h2 className="text-2xl font-semibold text-slate-900">How we use data</h2>
          <p>Data is used to deliver account functionality, prevent abuse, and provide support when you contact us.</p>
          <h2 className="text-2xl font-semibold text-slate-900">Data retention</h2>
          <p>Records are retained only as long as necessary for legal, operational, and security requirements.</p>
          <h2 className="text-2xl font-semibold text-slate-900">Your controls</h2>
          <p>You can request access, correction, and deletion where permitted by applicable law.</p>
        </div>
      </div>
    </Section>
  );
}
