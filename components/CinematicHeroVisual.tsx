"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Globe2, ShieldCheck } from "lucide-react";

import { PhoneMock } from "@/components/PhoneMock";

const floatTransition = {
  duration: 7,
  ease: "easeInOut" as const,
  repeat: Infinity,
  repeatType: "mirror" as const
};

export function CinematicHeroVisual() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-[460px]">
      <motion.div
        className="hero-light hero-light-a"
        animate={shouldReduceMotion ? undefined : { x: [0, 24, 0], y: [0, 14, 0] }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="hero-light hero-light-b"
        animate={shouldReduceMotion ? undefined : { x: [0, -20, 0], y: [0, 16, 0] }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="relative z-10 rounded-[2.4rem] border border-white/70 bg-white/65 p-4 shadow-lift backdrop-blur-xl"
        initial={shouldReduceMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      >
        <PhoneMock variant="home" className="max-w-[360px]" />
      </motion.div>

      <motion.div
        className="scene-card absolute -left-7 top-[14%] z-20 hidden items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-700 shadow-soft md:flex"
        animate={shouldReduceMotion ? undefined : { y: [0, -8, 0] }}
        transition={shouldReduceMotion ? { duration: 0 } : floatTransition}
      >
        <ShieldCheck className="h-4 w-4 text-blue-600" />
        Policy protected
      </motion.div>

      <motion.div
        className="scene-card absolute -right-7 top-[36%] z-20 hidden items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-700 shadow-soft md:flex"
        animate={shouldReduceMotion ? undefined : { y: [0, 8, 0] }}
        transition={shouldReduceMotion ? { duration: 0 } : { ...floatTransition, duration: 6.2 }}
      >
        <Globe2 className="h-4 w-4 text-cyan-600" />
        Global rails ready
      </motion.div>

      <motion.div
        className="scene-card absolute left-8 bottom-[6%] z-20 hidden items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-700 shadow-soft md:flex"
        animate={shouldReduceMotion ? undefined : { y: [0, -6, 0] }}
        transition={shouldReduceMotion ? { duration: 0 } : { ...floatTransition, duration: 8 }}
      >
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        Account deployed
      </motion.div>
    </div>
  );
}
