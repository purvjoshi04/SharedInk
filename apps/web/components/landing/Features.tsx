"use client";

import { motion } from "motion/react";
import {
  Users,
  Infinity as InfinityIcon,
  Pencil,
  Shapes,
  Download,
  Zap,
  type LucideIcon,
} from "lucide-react";

const features: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Users, title: "Real-time Collaboration", desc: "See cursors, edits, and ideas from your team appear the moment they happen." },
  { icon: InfinityIcon, title: "Infinite Canvas", desc: "Pan and zoom across an endless surface built for the messiest of thoughts." },
  { icon: Pencil, title: "Drawing Tools", desc: "Freehand, arrows, text, and precise shapes with a hand-drawn feel." },
  { icon: Shapes, title: "Shape Library", desc: "Rectangles, circles, diamonds, sticky notes, and connectors out of the box." },
  { icon: Download, title: "Export to PNG & SVG", desc: "Ship your boards straight into docs, decks, or your codebase." },
  { icon: Zap, title: "Fast & Lightweight", desc: "Instant load, no bloat. Feels native even with hundreds of shapes." },
];

export function Features() {
  return (
    <section id="features" className="py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader eyebrow="Features" title="Everything a team needs to think visually." />
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
              className="group relative rounded-2xl border border-white/15 bg-black p-8 transition-all duration-300 hover:border-white/40 hover:-translate-y-1"
            >
              <div className="grid h-11 w-11 place-items-center rounded-lg border border-white/20 text-white">
                <f.icon className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SectionHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="max-w-2xl"
    >
      <div className="text-xs uppercase tracking-[0.2em] text-white/40">{eyebrow}</div>
      <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight leading-tight">{title}</h2>
      {sub && <p className="mt-4 text-white/60 leading-relaxed">{sub}</p>}
    </motion.div>
  );
}
