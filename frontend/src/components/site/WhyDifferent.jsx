import { motion } from "framer-motion";
import { X, Plane, Video, Layers, TrendingUp } from "lucide-react";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

const TRADITIONAL = [
  "Run generic ads",
  "Send you a dashboard",
  "Recycle stock footage",
  "Then quietly disappear",
];

const CHERRY = [
  { icon: Plane, title: "We actually come to you", body: "We fly to your location and embed with your team like an in-house department." },
  { icon: Video, title: "We film real content", body: "Your crews. Your trucks. Your finished jobs. Footage that stock can never replicate." },
  { icon: Layers, title: "We build the whole system", body: "Ads, landing pages, CRM, follow-up and booking — one connected acquisition machine." },
  { icon: TrendingUp, title: "We optimize continuously", body: "We test creative, tune campaigns and improve close rates every single week." },
];

export const WhyDifferent = () => {
  return (
    <section className="relative py-24 sm:py-32" data-testid="why-different-section">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          chapter="01"
          kicker="Why we're different"
          title={<>Most agencies run ads.<br />We become your growth team.</>}
          subtitle="There is a difference between renting attention and building an asset. We build the asset."
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-12">
          {/* Traditional */}
          <Reveal className="lg:col-span-4">
            <div className="h-full rounded-3xl border border-white/10 bg-white/[0.02] p-8">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">Traditional agencies</p>
              <ul className="mt-8 space-y-5">
                {TRADITIONAL.map((t) => (
                  <li key={t} className="flex items-center gap-3 text-white/45">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                      <X className="h-4 w-4 text-white/40" />
                    </span>
                    <span className="text-base line-through decoration-white/20">{t}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-10 text-sm leading-relaxed text-white/35">
                You end up paying a retainer for reports you don't read and results you can't feel.
              </p>
            </div>
          </Reveal>

          {/* Cherry Tree */}
          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-8">
            {CHERRY.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.01] p-8"
                >
                  <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand/25 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-accent shadow-[0_0_30px_-8px_rgba(44,92,229,0.9)]">
                    <item.icon className="h-6 w-6 text-white" />
                  </span>
                  <h3 className="relative mt-6 font-display text-xl uppercase tracking-tight text-white">
                    {item.title}
                  </h3>
                  <p className="relative mt-3 text-sm leading-relaxed text-white/55">{item.body}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyDifferent;
