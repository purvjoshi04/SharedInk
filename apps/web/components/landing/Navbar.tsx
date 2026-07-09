"use client";

import { useEffect, useState } from "react";
import { PenLine } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

const links = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how" },
  { label: "FAQ", href: "#faq" },
  { label: "GitHub", href: "https://github.com/purvjoshi04/sharedINk" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-black/70 backdrop-blur-md border-b border-white/10" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link href="#" className="flex items-center gap-2 text-white">
          <span className="grid place-items-center h-8 w-8 rounded-md border border-white/30">
            <PenLine className="h-4 w-4" />
          </span>
          <span className="font-semibold tracking-tight">SharedInk</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/70">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
        <Link
          href="/signup"
          className="hidden sm:inline-flex items-center rounded-md bg-white text-black text-sm font-medium px-4 py-2 hover:bg-white/90 transition"
        >
          Start Drawing
        </Link>
      </nav>
    </motion.header>
  );
}
