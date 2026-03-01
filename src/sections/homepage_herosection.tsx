"use client";

import { AnimatePresence, motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";
import { HomepageSearchWithSuggestions } from "./homepage_searchbar";

// ─── GradualSpacing Component ───────────────────────────────────────────────

interface GradualSpacingProps {
  text: string;
  duration?: number;
  delayMultiple?: number;
  framerProps?: Variants;
  className?: string;
}

function GradualSpacing({
  text,
  duration = 0.5,
  delayMultiple = 0.04,
  framerProps = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },
  className,
}: GradualSpacingProps) {
  return (
    <div className="flex justify-start space-x-1">
      <AnimatePresence>
        {text.split("").map((char, i) => (
          <motion.h1
            key={i}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={framerProps}
            transition={{ duration, delay: i * delayMultiple }}
            className={cn("drop-shadow-sm", className)}
          >
            {char === " " ? <span>&nbsp;</span> : char}
          </motion.h1>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Hero Section ────────────────────────────────────────────────────────────

interface HomepageHeroSectionProps {
  onSearch?: (value: string) => void;
}

export const HomepageHeroSection: React.FC<HomepageHeroSectionProps> = () => {
  return (
    <section className="hero-section-bg relative z-50 flex items-center justify-center min-h-screen pt-24 md:pt-28">
      <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/40 to-transparent" />

      <div className="relative z-10 w-full max-w-5xl px-4 sm:px-6 flex flex-col items-center">
        <div className="text-center md:text-left w-full">

          {/* "Explore" — animated letter by letter via GradualSpacing */}
          <GradualSpacing
            text="Explore"
            duration={0.6}
            delayMultiple={0.06}
            className="text-foreground text-6xl sm:text-7xl md:text-8xl font-semibold leading-tight"
          />

          {/* Subtitle — fades in after "Explore" finishes (~7 letters × 0.06 + 0.6 ≈ 1.02s) */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.1 }}
            className="text-hero-gradient text-transparent text-3xl sm:text-6xl md:text-7xl font-semibold mt-3 md:mt-2 drop-shadow-black drop-shadow-xl leading-tight"
          >
            2nd District of Ilocos Sur
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="text-foreground text-base sm:text-lg md:text-xl mt-4"
          >
            "Explore, Taste, and Enjoy the culture of every town."
          </motion.p>
        </div>

        {/* Search bar with suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.8 }}
          className="mt-7 sm:mt-8 md:mt-10 w-full flex justify-center relative z-[100]"
        >
          <HomepageSearchWithSuggestions />
        </motion.div>
      </div>
    </section>
  );
};