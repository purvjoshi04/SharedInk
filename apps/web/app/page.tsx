"use client";

import { Button } from "@repo/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(white_1px,transparent_1px)] bg-size-[20px_20px] opacity-10"></div>
      <nav className="relative z-10 flex justify-between items-center px-8 py-6">
        <h1 className="text-2xl font-bold">SharedInk</h1>

        <div className="flex gap-2">
          <Button
            className="border border-white px-4 py-2 rounded-xl hover:bg-white hover:text-black transition transform hover:scale-105"
            onClick={() => router.push("/signin")}
          >
            Login
          </Button>
          <Button
            variant="custom"
            className="border bg-white text-black hover:bg-transparent hover:text-white px-4 py-2 rounded-xl transition transform hover:scale-105"
            onClick={() => router.push("/signup")}
          >
            SignUp
          </Button>
        </div>
      </nav>
      <section className="relative z-10 flex flex-col items-center text-center px-6 mt-20">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-bold mb-6"
        >
          Draw. Collaborate. Create.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl text-lg opacity-80 mb-10"
        >
          SharedInk is a fast and minimal collaborative whiteboard built for teams,
          students, creators, and anyone who wants to bring ideas to life.
        </motion.p>

        <motion.a
          whileHover={{ scale: 1.05 }}
          href="#"
          className="px-8 py-4 border border-white rounded-2xl text-xl font-medium hover:bg-white hover:text-black transition"
        >
          Start Drawing
        </motion.a>
      </section>

      <section className="relative z-10 mt-32 px-6">
        <h3 className="text-4xl font-semibold text-center mb-16">Why SharedInk?</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          <FeatureCard title="Real-time Sync" description="Your drawings update instantly for everyone in the room." />
          <FeatureCard title="Minimal UI" description="A clean workspace so you can focus on creating." />
          <FeatureCard title="Lightweight & Fast" description="Loads in seconds with smooth performance." />
        </div>
      </section>
      <section className="relative z-10 text-center mt-32 mb-32 px-6">
        <h3 className="text-4xl font-semibold mb-6">Ready to Sketch Your Ideas?</h3>
        <a
          href="#"
          className="px-8 py-4 border border-white rounded-2xl text-xl font-medium hover:bg-white hover:text-black transition"
        >
          Launch SharedInk
        </a>
      </section>
      <footer className="relative z-10 text-center py-6 opacity-60 text-sm">
        © {new Date().getFullYear()} SharedInk.
      </footer>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 border border-white/20 rounded-2xl backdrop-blur-sm bg-white/5 text-center">
      <h4 className="text-2xl font-bold mb-3">{title}</h4>
      <p className="opacity-70">{description}</p>
    </div>
  );
}
