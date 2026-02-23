"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Clock3, ShieldCheck, Zap } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sceneItems = [
  {
    icon: Clock3,
    title: "Time lock control",
    body: "Delay high risk actions with clear countdowns and explicit approvals."
  },
  {
    icon: ShieldCheck,
    title: "Policy by default",
    body: "Roles, limits, and allowlists are active before first spend."
  },
  {
    icon: Zap,
    title: "Fast when trusted",
    body: "Bounded sessions keep frequent actions smooth and predictable."
  }
];

export function SceneShift() {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.98]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.6]);

  return (
    <section ref={ref} className="page-section">
      <div className="container">
        <motion.div
          style={shouldReduceMotion ? undefined : { scale, opacity }}
          transition={shouldReduceMotion ? { duration: 0 } : undefined}
          className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-slate-950 px-6 py-12 text-white shadow-lift md:px-10 md:py-14"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(59,130,246,0.35),transparent_46%),radial-gradient(circle_at_88%_0%,rgba(6,182,212,0.28),transparent_40%)]" />
          <div className="relative z-10 space-y-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Scene shift</p>
            <h2 className="max-w-3xl text-[clamp(2rem,4.6vw,3.7rem)] font-semibold leading-[0.98] tracking-[-0.035em]">
              Control should feel invisible until the moment it matters.
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              {sceneItems.map((item) => (
                <Card key={item.title} className="border-white/15 bg-white/5 text-white shadow-none">
                  <CardHeader className="space-y-3">
                    <item.icon className="h-5 w-5 text-cyan-300" />
                    <CardTitle className="text-lg text-white">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-slate-300">{item.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
