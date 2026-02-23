import { ArrowUpRight, CheckCircle2, Copy, Fingerprint, Globe, Lock, PauseCircle, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PhoneVariant = "home" | "cards" | "iban" | "transfer" | "shared" | "policies" | "subscriptions";

type PhoneMockProps = {
  variant?: PhoneVariant;
  className?: string;
};

function InlineToggle({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-9 items-center rounded-full p-0.5 transition",
        enabled ? "bg-primary" : "bg-slate-300"
      )}
    >
      <span className={cn("h-4 w-4 rounded-full bg-white transition", enabled ? "translate-x-4" : "translate-x-0")} />
    </span>
  );
}

function Row({ label, value, active }: { label: string; value?: string; active?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
      <span className="text-slate-700">{label}</span>
      {value ? <span className="font-medium text-slate-900">{value}</span> : <InlineToggle enabled={Boolean(active)} />}
    </div>
  );
}

function HomeContent() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-blue-50 p-3">
        <p className="text-xs font-medium text-slate-500">Total balance</p>
        <p className="text-2xl font-semibold text-slate-900">€12,480</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-xl bg-white p-2">
            <p className="text-slate-500">EUR</p>
            <p className="font-semibold text-slate-800">€8,220</p>
          </div>
          <div className="rounded-xl bg-white p-2">
            <p className="text-slate-500">USD</p>
            <p className="font-semibold text-slate-800">$2,900</p>
          </div>
          <div className="rounded-xl bg-white p-2">
            <p className="text-slate-500">GBP</p>
            <p className="font-semibold text-slate-800">£1,140</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 p-3 text-white">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>Primary card</span>
          <span>•••• 7421</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs">Freeze</span>
          <InlineToggle enabled />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-3">
        <p className="text-xs font-medium text-slate-500">Pots</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-xl bg-slate-100 p-2 text-center">
            <p className="text-slate-600">Bills</p>
            <p className="font-medium">€1,200</p>
          </div>
          <div className="rounded-xl bg-slate-100 p-2 text-center">
            <p className="text-slate-600">Savings</p>
            <p className="font-medium">€4,650</p>
          </div>
          <div className="rounded-xl bg-slate-100 p-2 text-center">
            <p className="text-slate-600">Holiday</p>
            <p className="font-medium">€980</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-3">
        <p className="text-xs font-medium text-slate-500">Activity</p>
        <div className="mt-2 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">Nord Cafe</p>
              <p className="text-slate-500">Dining · 11:42</p>
            </div>
            <p className="font-semibold text-slate-900">-€18.40</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">Metro Line 7</p>
              <p className="text-slate-500">Transport · 09:15</p>
            </div>
            <p className="font-semibold text-slate-900">-€2.20</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">Payroll</p>
              <p className="text-slate-500">Income · 08:55</p>
            </div>
            <p className="font-semibold text-emerald-600">+€3,400.00</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardsContent() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-slate-900 p-4 text-white">
        <p className="text-xs text-slate-300">Card settings</p>
        <p className="mt-1 font-semibold">Travel card •••• 7421</p>
      </div>
      <div className="space-y-2 rounded-2xl bg-white p-3">
        <Row label="Freeze" active={false} />
        <Row label="ATM limits" value="€300/day" />
        <Row label="Online payments" active />
        <Row label="Travel mode" active />
        <Row label="Merchant allowlist" value="Enabled" />
      </div>
    </div>
  );
}

function IbanContent() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">IBAN account</p>
        <p className="mt-2 rounded-xl bg-slate-100 p-3 font-mono text-xs text-slate-800">DE12 5566 7788 9900 1122 33</p>
        <div className="mt-3 flex gap-2">
          <span className="inline-flex h-8 items-center gap-1 rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground">
            <Copy className="h-3.5 w-3.5" />
            Copy details
          </span>
          <span className="inline-flex h-8 items-center rounded-full border border-border bg-background px-3 text-xs font-medium text-foreground">
            Share bank details
          </span>
        </div>
      </div>
      <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
        Receive salary, client payments, and transfers from saved beneficiaries.
      </div>
    </div>
  );
}

function TransferContent() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-3">
        <p className="text-xs font-medium text-slate-500">Transfer preview</p>
        <div className="mt-2 space-y-2 text-sm">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <span>Send</span>
            <span className="font-semibold">€1,000.00</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <span>Receive</span>
            <span className="font-semibold">$1,082.00</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Rate</span>
            <span>1 EUR = 1.089 USD</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Fee</span>
            <span>€2.40</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Arrival</span>
            <span>Today, 14:10</span>
          </div>
        </div>
      </div>
      <div className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        <Fingerprint className="h-4 w-4" />
        Confirm with biometrics
      </div>
    </div>
  );
}

function SharedContent() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-3">
        <p className="text-xs font-medium text-slate-500">Shared account</p>
        <div className="mt-2 space-y-2 text-xs">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <span className="font-medium text-slate-700">A. Ruiz</span>
            <Badge variant="outline" className="text-[10px]">
              Owner
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <span className="font-medium text-slate-700">D. Kim</span>
            <Badge variant="outline" className="text-[10px]">
              Approver
            </Badge>
          </div>
        </div>
      </div>
      <div className="rounded-2xl bg-white p-3 text-xs">
        <div className="flex items-center justify-between text-slate-600">
          <span>Approval threshold</span>
          <span className="font-semibold text-slate-800">€1,500</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-slate-600">
          <span>Per member limit</span>
          <span className="font-semibold text-slate-800">€600/day</span>
        </div>
        <div className="mt-3 rounded-xl bg-slate-50 p-2 text-slate-600">
          Activity log: Team subscription approved at 12:04
        </div>
      </div>
    </div>
  );
}

function PoliciesContent() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-3">
        <p className="text-xs font-medium text-slate-500">Policies</p>
        <div className="mt-2 space-y-3 text-xs">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-slate-600">Per transaction cap</span>
              <span className="font-medium text-slate-800">€500</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200">
              <div className="h-2 w-2/3 rounded-full bg-primary" />
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-slate-600">Daily limit</span>
              <span className="font-medium text-slate-800">€2,000</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200">
              <div className="h-2 w-4/5 rounded-full bg-primary" />
            </div>
          </div>
          <Row label="Recipient allowlist" active />
          <Row label="Category controls" value="Dining paused" />
        </div>
      </div>
    </div>
  );
}

function SubscriptionsContent() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-3">
        <p className="text-xs font-medium text-slate-500">Subscriptions</p>
        <div className="mt-2 space-y-2 text-xs">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <div>
              <p className="font-medium text-slate-800">Design Suite</p>
              <p className="text-slate-500">€24 monthly</p>
            </div>
            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-slate-100 px-2 text-[11px] font-medium text-slate-700">
              <PauseCircle className="h-3.5 w-3.5" />
              Pause
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <div>
              <p className="font-medium text-slate-800">Cloud Storage</p>
              <p className="text-slate-500">€9 monthly</p>
            </div>
            <span className="inline-flex h-7 items-center rounded-full border border-border bg-background px-2 text-[11px] font-medium text-foreground">
              Edit cap
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getContentByVariant(variant: PhoneVariant) {
  switch (variant) {
    case "cards":
      return <CardsContent />;
    case "iban":
      return <IbanContent />;
    case "transfer":
      return <TransferContent />;
    case "shared":
      return <SharedContent />;
    case "policies":
      return <PoliciesContent />;
    case "subscriptions":
      return <SubscriptionsContent />;
    case "home":
    default:
      return <HomeContent />;
  }
}

export function PhoneMock({ variant = "home", className }: PhoneMockProps) {
  return (
    <div className={cn("mx-auto w-full max-w-[360px] rounded-[2.6rem] border border-slate-200 bg-slate-950 p-2 shadow-lift", className)}>
      <div className="relative h-[640px] overflow-hidden rounded-[2.2rem] bg-gradient-to-b from-slate-100 to-slate-50 p-4">
        <div className="absolute left-1/2 top-2 h-6 w-36 -translate-x-1/2 rounded-full bg-slate-950" aria-hidden />

        <div className="mt-8 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">{variant === "home" ? "Overview" : "Controls"}</span>
          <div className="flex items-center gap-1 text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Secure</span>
          </div>
        </div>

        <div className="mt-3">{getContentByVariant(variant)}</div>

        {variant === "home" ? (
          <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-slate-200 bg-white/80 p-3 backdrop-blur">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Quick actions</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2 text-[10px]">
              <div className="rounded-xl bg-slate-100 p-2 text-center text-slate-700">
                <Globe className="mx-auto mb-1 h-3.5 w-3.5" />
                Transfer
              </div>
              <div className="rounded-xl bg-slate-100 p-2 text-center text-slate-700">
                <Lock className="mx-auto mb-1 h-3.5 w-3.5" />
                Freeze
              </div>
              <div className="rounded-xl bg-slate-100 p-2 text-center text-slate-700">
                <CheckCircle2 className="mx-auto mb-1 h-3.5 w-3.5" />
                Approve
              </div>
              <div className="rounded-xl bg-slate-100 p-2 text-center text-slate-700">
                <ArrowUpRight className="mx-auto mb-1 h-3.5 w-3.5" />
                Top up
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
