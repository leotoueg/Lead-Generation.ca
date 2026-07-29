import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import CTAButton from "./CTAButton";

export const CTABand = ({ text = "Ready to fill your pipeline with profitable jobs?", testid = "cta-band" }) => (
  <section className="relative py-12 sm:py-16" data-testid={testid}>
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-70px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-r from-white/[0.10] via-white/[0.02] to-transparent px-6 py-10 sm:px-12"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/15 blur-[100px]" />
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <p className="max-w-xl font-display text-2xl uppercase leading-[0.95] tracking-tight text-white sm:text-3xl">
            {text}
          </p>
          <CTAButton to="apply" data-testid={`${testid}-button`} className="shrink-0">
            Book Your Strategy Call <ArrowRight className="h-4 w-4" />
          </CTAButton>
        </div>
      </motion.div>
    </div>
  </section>
);

export default CTABand;
