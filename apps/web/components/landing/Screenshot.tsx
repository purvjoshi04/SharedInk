"use client";

import { motion } from "motion/react";
import { WhiteboardMockup } from "./WhiteboardMockup";

export function Screenshot() {
  return (
    <section className="py-28 md:py-36 border-t border-white/10">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <div className="text-xs uppercase tracking-[0.2em] text-white/40">A look inside</div>
        <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight leading-tight max-w-3xl mx-auto">
          Familiar canvas. Serious depth.
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mt-14"
        >
          <WhiteboardMockup />
        </motion.div>
      </div>
    </section>
  );
}
