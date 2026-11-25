"use client";

import { motion } from "motion/react";

export function Reveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="portfolio-reveal"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
