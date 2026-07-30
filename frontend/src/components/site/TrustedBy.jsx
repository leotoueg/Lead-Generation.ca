// Real client logos with transparent backgrounds, rendered directly on the
// dark section (no chips). Brand colors preserved.
const LOGOS = [
  { src: "/logos/globe.png", name: "Global", h: "h-14" },
  { src: "/logos/sv.png", name: "SV Developments", h: "h-9" },
  { src: "/logos/rizzi.png", name: "Rizzi Law", h: "h-12" },
  { src: "/logos/roofing-monkeys.png", name: "Roofing Monkeys", h: "h-14" },
  { src: "/logos/apex.png", name: "Apex Bath & Remodeling", h: "h-14" },
  { src: "/logos/prime-baths.png", name: "Prime Baths of NM", h: "h-11" },
  { src: "/logos/sage.png", name: "Sage Kitchen & Bath", h: "h-14" },
];

export const TrustedBy = () => {
  const items = [...LOGOS, ...LOGOS, ...LOGOS];
  return (
    <div className="mt-5 w-full" data-testid="trusted-by">
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">
        Trusted By
      </p>
      <div className="edge-fade-x relative mt-4 overflow-hidden">
        <div className="marquee-track marquee-slow items-center gap-14">
          {items.map((l, i) => (
            <div
              key={i}
              data-testid={`trusted-logo-${i}`}
              className="flex shrink-0 items-center justify-center opacity-90 transition-opacity duration-300 hover:opacity-100"
            >
              <img
                src={l.src}
                alt={l.name}
                loading="lazy"
                className={`${l.h} w-auto max-w-[200px] object-contain`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustedBy;
