import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WhySharedInk } from "@/components/landing/WhySharedInk";
import { Screenshot } from "@/components/landing/Screenshot";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="relative min-h-screen text-white overflow-x-hidden">
      <div
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{
          backgroundColor: "#000000",
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div
        aria-hidden
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <WhySharedInk />
        <Screenshot />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}