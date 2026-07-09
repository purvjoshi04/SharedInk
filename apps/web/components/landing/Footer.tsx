"use client";

import { Github, PenLine, Heart } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-12">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-white">
          <span className="grid place-items-center h-8 w-8 rounded-md border border-white/30">
            <PenLine className="h-4 w-4" />
          </span>
          <span className="font-semibold tracking-tight">SharedInk</span>
        </div>
        <div className="text-sm text-white/50">
          © {new Date().getFullYear()} SharedInk. All rights reserved.
        </div>
        <div className="flex items-center gap-6 text-sm text-white/60">
          <Link
            href="https://github.com/purvjoshi04/sharedINk"
            className="inline-flex items-center gap-2 hover:text-white transition-colors"
          >
            <Github className="h-4 w-4" />
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}
