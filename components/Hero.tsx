import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type HeroProps = {
  eyebrow?: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  visual?: ReactNode;
  className?: string;
};

export function Hero({ eyebrow, title, description, actions, visual, className }: HeroProps) {
  return (
    <section className={cn("relative overflow-hidden pt-28 pb-14 md:pt-36 md:pb-20", className)}>
      <div className="container grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-8">
          {eyebrow}
          <div className="space-y-5">
            <h1 className="headline-xl max-w-3xl">{title}</h1>
            <p className="body-lg max-w-2xl">{description}</p>
          </div>
          {actions}
        </div>
        {visual ? <div className="mx-auto w-full max-w-md lg:ml-auto lg:mr-0">{visual}</div> : null}
      </div>
    </section>
  );
}
