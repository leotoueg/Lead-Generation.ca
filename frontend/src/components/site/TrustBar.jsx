const ITEMS = [
  "Professionally Filmed Ads",
  "Google Ads",
  "Facebook Ads",
  "CRM Automation",
  "Landing Pages",
  "Appointment Booking",
  "Sales Systems",
];

export const TrustBar = () => {
  const loop = [...ITEMS, ...ITEMS];
  return (
    <section
      className="relative border-y border-white/10 bg-black/40 py-8"
      data-testid="trust-bar"
      aria-label="Capabilities"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-ink-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-ink-950 to-transparent" />
      <div className="marquee-track items-center gap-12">
        {loop.map((item, i) => (
          <div key={i} className="flex items-center gap-12" aria-hidden={i >= ITEMS.length}>
            <span className="whitespace-nowrap font-display text-2xl uppercase tracking-tight text-white/25 transition-colors hover:text-white/70 sm:text-3xl">
              {item}
            </span>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent/70" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrustBar;
