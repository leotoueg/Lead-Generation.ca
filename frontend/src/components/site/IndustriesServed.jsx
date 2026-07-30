import Reveal from "./Reveal";
import TrustedBy from "./TrustedBy";

const INDUSTRIES = [
  "Roofing",
  "Bathroom Remodeling",
  "Kitchen Remodeling",
  "General Contractors",
  "Law Firms",
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const IndustriesServed = () => {
  return (
    <section className="relative py-20 sm:py-24" data-testid="industries-section">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex items-center gap-3">
              <span className="font-display text-lg leading-none text-brand-accent">02</span>
              <span className="h-px w-10 bg-white/25" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/50">
                Industries Served
              </span>
              <span className="h-px w-10 bg-white/25" />
            </div>
            <h2 className="font-display text-3xl uppercase leading-[0.92] tracking-tight sm:text-4xl lg:text-5xl">
              The trades &amp; firms <span className="text-gold">we know how to grow</span>
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {INDUSTRIES.map((name) => (
              <span
                key={name}
                data-testid={`industry-${slug(name)}`}
                className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-semibold text-white/70 backdrop-blur-xl transition-colors duration-300 hover:border-white/20 hover:text-white"
              >
                {name}
              </span>
            ))}
          </div>
        </Reveal>

        <div className="mx-auto mt-12 w-full lg:w-4/5">
          <TrustedBy />
        </div>
      </div>
    </section>
  );
};

export default IndustriesServed;
