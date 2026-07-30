import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ClipboardList, PhoneCall, Plane, Clapperboard, Rocket, TrendingUp } from "lucide-react";
import SectionHeading from "./SectionHeading";
import SectionCTA from "./SectionCTA";

const STEPS = [
  { icon: ClipboardList, title: "Apply", body: "Tell us about your business. We only take on contractors we know we can grow." },
  { icon: PhoneCall, title: "Strategy Call", body: "We map your market, your numbers and the exact system we'd build for you." },
  { icon: Plane, title: "We Fly Out", body: "Our team travels to your location. No outsourcing, no stock, no shortcuts." },
  { icon: Clapperboard, title: "Film Everything", body: "Commercials and ad creative — professionally produced on-site." },
  { icon: Rocket, title: "Launch Campaigns", body: "Google Ads, Meta Ads, landing pages and CRM automations go live." },
  { icon: TrendingUp, title: "Scale", body: "We optimize weekly and pour fuel on what converts into profitable jobs." },
];

export const ProcessTimeline = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 65%", "end 60%"],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="relative py-24 sm:py-32" data-testid="process-section">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          chapter="02"
          kicker="The process"
          title="Six steps to a full pipeline"
          subtitle="A clear, proven path from application to a market-leading acquisition system."
        />

        <div ref={ref} className="relative mt-16 pl-2">
          {/* Track */}
          <div className="absolute left-[27px] top-2 bottom-2 w-px bg-white/10 sm:left-[31px]" />
          <motion.div
            style={{ scaleY: lineScale }}
            className="absolute left-[27px] top-2 bottom-2 w-px origin-top bg-gradient-to-b from-brand to-brand-accent sm:left-[31px]"
          />

          <div className="space-y-10 sm:space-y-14">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex items-start gap-6 sm:gap-8"
                data-testid={`process-step-${i + 1}`}
              >
                <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#E6B43C]/25 bg-ink-900 shadow-[0_0_30px_-10px_rgba(230,180,60,0.5)]">
                  <step.icon className="h-6 w-6 text-[#E6B43C]" />
                </div>
                <div className="pt-1">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-sm text-white/30">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-display text-2xl uppercase tracking-tight text-gold sm:text-3xl">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/55 sm:text-base">
                    {step.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <SectionCTA testid="process-cta" />
      </div>
    </section>
  );
};

export default ProcessTimeline;
