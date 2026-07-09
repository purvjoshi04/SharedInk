"use client";

import { motion } from "motion/react";

const stats = [
  { label: "Canvas", value: "Unlimited" },
  { label: "Sync", value: "Real-time" },
  { label: "Sharing", value: "Instant" },
  { label: "Interface", value: "Minimal UI" },
];

export function WhySharedInk() {
  return (
    <section className="py-28 md:py-36 border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="text-xs uppercase tracking-[0.2em] text-white/40">Why SharedInk</div>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            Built for teams that
            <br />
            think out loud.
          </h2>
          <p className="mt-6 text-white/60 leading-relaxed max-w-xl">
            Meetings turn into blank stares. Docs bury ideas. SharedInk gives your team a place to
            draw the thing you're trying to say — the diagram, the flow, the messy sketch — and
            watch it come together with everyone in the room.
          </p>
          <p className="mt-4 text-white/60 leading-relaxed max-w-xl">
            No accounts to invite. No plugins to install. Just a link, a canvas, and the people who
            need to be in it.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
              className="rounded-2xl border border-white/15 bg-black p-8 hover:border-white/40 transition-colors"
            >
              <div className="text-3xl md:text-4xl font-bold tracking-tight">{s.value}</div>
              <div className="mt-2 text-xs uppercase tracking-[0.2em] text-white/40">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
