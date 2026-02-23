import { Badge } from "@/components/ui/badge";

const trustItems = [
  "Non custodial smart accounts",
  "Partner issued IBANs",
  "Global cards",
  "Gasless transactions",
  "24/7 support"
];

export function TrustStrip() {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      {trustItems.map((item) => (
        <Badge key={item} variant="outline" className="rounded-full bg-white/90 px-4 py-2 text-xs text-slate-700 shadow-sm">
          {item}
        </Badge>
      ))}
    </div>
  );
}
