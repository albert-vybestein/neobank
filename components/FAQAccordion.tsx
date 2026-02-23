import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type FAQItem = {
  question: string;
  answer: string;
};

type FAQAccordionProps = {
  items: FAQItem[];
};

export function FAQAccordion({ items }: FAQAccordionProps) {
  return (
    <Accordion type="single" collapsible className="rounded-3xl border border-border/80 bg-white px-6 py-2 shadow-soft">
      {items.map((item, index) => (
        <AccordionItem value={`item-${index}`} key={item.question}>
          <AccordionTrigger className="text-base md:text-lg">{item.question}</AccordionTrigger>
          <AccordionContent className="text-base leading-relaxed">{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
