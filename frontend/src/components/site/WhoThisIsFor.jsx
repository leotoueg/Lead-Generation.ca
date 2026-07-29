import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import SectionHeading from "./SectionHeading";
import SectionCTA from "./SectionCTA";
import Reveal from "./Reveal";

const IDEAL = [
  "You're doing $1M+ in annual revenue",
  "You want more profitable jobs",
  "You already have crews in place",
  "You can handle more work",
  "You want long-term, compounding growth",
];

const NOT_IDEAL = [
  "You're a brand-new startup",
  "You're shopping for the cheapest marketing",
  "You expect overnight, instant results",
];

export const WhoThisIsFor = () => {
  return (
    <section className="relative border-y border-white/10 bg-black/40 py-24 sm:py-32" data-testid="who-section">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          chapter="05"
          kicker="Who this is for"
          title="Built for established contractors"
          subtitle="We do our best work with owners ready to scale — not those looking for a quick fix."
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-3xl border border-brand/30 bg-gradient-to-b from-brand/[0.12] to-transparent p-8 sm:p-10">
              <p className="text-[11px] uppercase tracking-[0.28em] text-brand-accent">This is for you if</p>
              <ul className="mt-8 space-y-5">
                {IDEAL.map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.06 }}
                    className="flex items-start gap-4"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white to-[#c2c6cd]">
                      <Check className="h-4 w-4 text-black" />
                    </span>
                    <span className="text-base text-white/85 sm:text-lg">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="h-full rounded-3xl border border-white/10 bg-white/[0.02] p-8 sm:p-10">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">This is not for you if</p>
              <ul className="mt-8 space-y-5">
                {NOT_IDEAL.map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.06 }}
                    className="flex items-start gap-4"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                      <X className="h-4 w-4 text-white/40" />
                    </span>
                    <span className="text-base text-white/45 sm:text-lg">{item}</span>
                  </motion.li>
                ))}
              </ul>
              <p className="mt-10 text-sm leading-relaxed text-white/35">
                No hard feelings. We'd rather be honest than take on a partnership that won't win.
              </p>
            </div>
          </Reveal>
        </div>

        <SectionCTA testid="who-cta" />
      </div>
    </section>
  );
};

export default WhoThisIsFor;
