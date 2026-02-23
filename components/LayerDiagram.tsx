import { Card } from "@/components/ui/card";

const layers = [
  {
    title: "App layer",
    body: "Mobile app, cards, IBAN, statements",
    note: "This is where users spend, transfer, and review activity in a familiar interface."
  },
  {
    title: "Account layer",
    body: "Safe smart account, modules, guard",
    note: "Ownership and policy logic are enforced here, with explicit permissions and limits."
  },
  {
    title: "Rails layer",
    body: "Stable settlement, FX routing, payments partners",
    note: "Regulated partners and routing systems execute payments and local rails where available."
  }
];

export function LayerDiagram() {
  return (
    <div className="relative mx-auto max-w-4xl space-y-4">
      {layers.map((layer, index) => (
        <Card
          key={layer.title}
          className="relative overflow-hidden border-white/60 bg-gradient-to-r from-white to-slate-50 p-6 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-primary/70 md:p-8"
          style={{ transform: `translateX(${index * 8}px)` }}
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Layer {index + 1}</p>
            <h3 className="text-2xl font-semibold text-slate-900">{layer.title}</h3>
            <p className="text-base font-medium text-slate-700">{layer.body}</p>
            <p className="text-sm leading-relaxed text-slate-600">{layer.note}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
