"use client";

import { motion } from "motion/react";
import { SectionHeader } from "./Features";

const steps = [
  {
    title: "Create a board",
    desc: "Spin up a fresh canvas in one click. No setup, no templates to pick.",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
        <path d="M14 16 C 60 12, 100 18, 106 16 L 106 64 C 100 68, 60 62, 14 66 Z" />
        <path d="M60 30 L 60 52 M 49 41 L 71 41" />
      </svg>
    ),
  },
  {
    title: "Share the room",
    desc: "Send a link. Anyone can join and start contributing instantly.",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
        <path d="M38 40 C 38 30, 46 22, 56 22 L 66 22" />
        <path d="M82 40 C 82 50, 74 58, 64 58 L 54 58" />
        <path d="M28 40 L 48 40 M 42 34 L 48 40 L 42 46" />
        <path d="M92 40 L 72 40 M 78 34 L 72 40 L 78 46" />
      </svg>
    ),
  },
  {
    title: "Draw together instantly",
    desc: "Live cursors, live shapes, live thinking. No refresh, no lag.",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
        <path d="M18 58 C 30 40, 50 66, 62 46 S 92 30, 104 50" />
        <path d="M92 22 l 10 4 l -4 3 l 3 8 l -3 1 l -3 -8 l -5 2 z" fill="white" stroke="none" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-28 md:py-36 border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader eyebrow="How it works" title="From empty canvas to shared thinking in seconds." />
        <div className="mt-16 relative grid md:grid-cols-3 gap-10">
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-px border-t border-dashed border-white/20" />
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative z-10 h-32 w-32 rounded-full border border-white/20 bg-black p-6 flex items-center justify-center">
                {s.illustration}
              </div>
              <div className="mt-6 text-xs uppercase tracking-[0.2em] text-white/40">Step 0{i + 1}</div>
              <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-white/55 max-w-xs">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
