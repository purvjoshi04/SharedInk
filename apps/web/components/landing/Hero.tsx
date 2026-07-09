"use client";

import { motion } from "motion/react";
import { ArrowRight, Github } from "lucide-react";
import { WhiteboardMockup } from "./WhiteboardMockup";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative pt-36 pb-24 md:pt-44 md:pb-32">
      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-14 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs text-white/70 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Now in open beta
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
            Collaborative
            <br />
            Whiteboard
            <br />
            <span className="text-white/50">for Teams</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/60 leading-relaxed">
            SharedInk is a real-time collaborative whiteboard that lets teams sketch ideas, create
            diagrams, brainstorm, and work together seamlessly.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-md bg-white text-black px-5 py-3 text-sm font-medium hover:bg-white/90 transition"
            >
              Start Drawing
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="https://github.com/purvjoshi04/sharedINk"
              className="inline-flex items-center gap-2 rounded-md border border-white/20 px-5 py-3 text-sm font-medium text-white hover:bg-white/5 transition"
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
          className="relative"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <WhiteboardMockup />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
