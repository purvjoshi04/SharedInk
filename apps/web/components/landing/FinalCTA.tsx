"use client";

import { motion } from "motion/react";
import { ArrowRight, Github } from "lucide-react";
import Link from "next/link";

export function FinalCTA() {
  return (
    <section id="cta" className="py-32 md:py-40 border-t border-white/10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mx-auto max-w-3xl px-6 text-center"
      >
        <h2 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
          Ready to start
          <br />
          drawing together?
        </h2>
        <p className="mt-6 text-white/60 max-w-xl mx-auto">
          Open a canvas, share the link, and let the ideas land where everyone can see them.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="#"
            className="group inline-flex items-center gap-2 rounded-md bg-white text-black px-6 py-3.5 text-sm font-medium hover:bg-white/90 transition"
          >
            Launch SharedInk
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="https://github.com/purvjoshi04/sharedINk"
            className="inline-flex items-center gap-2 rounded-md border border-white/20 px-6 py-3.5 text-sm font-medium text-white hover:bg-white/5 transition"
          >
            <Github className="h-4 w-4" />
            GitHub Repository
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
