"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import { SectionHeader } from "./Features";

const faqs = [
  { q: "Is SharedInk free?", a: "Yes. SharedInk is free to use for personal boards and small teams. Paid plans for larger organizations are on the way." },
  { q: "Does it support collaboration?", a: "Real-time collaboration is the point. Share a link and multiple people can draw, edit, and comment on the same canvas at once." },
  { q: "Can I export drawings?", a: "Any board can be exported to PNG or SVG in one click, ready to drop into docs, tickets, or presentations." },
  { q: "Is login required?", a: "You can start drawing anonymously. Create an account only when you want to save boards or invite a team." },
  { q: "Which browsers are supported?", a: "SharedInk runs in any modern browser — Chrome, Edge, Firefox, Safari, and Brave — on desktop, tablet, and mobile." },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-28 md:py-36 border-t border-white/10">
      <div className="mx-auto max-w-4xl px-6">
        <SectionHeader eyebrow="FAQ" title="Answers before you ask." />
        <div className="mt-14 divide-y divide-white/10 border-y border-white/10">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between py-6 text-left group"
                >
                  <span className="text-lg font-medium text-white">{f.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="grid place-items-center h-8 w-8 rounded-full border border-white/20 text-white/70 group-hover:text-white group-hover:border-white/50 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pr-12 text-white/60 leading-relaxed">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
