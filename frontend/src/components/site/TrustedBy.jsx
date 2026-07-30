// Real client logos rendered on subtle light chips so brand colors stay visible
// against the dark section background.
const LOGOS = [
  { src: "/logos/sv.png", name: "SV Developments" },
  { src: "/logos/rizzi.png", name: "Rizzi Law" },
  { src: "/logos/roofing-monkeys.png", name: "Roofing Monkeys" },
  { src: "/logos/apex.png", name: "Apex Bath & Remodeling" },
  { src: "/logos/prime-baths.png", name: "Prime Baths of NM" },
];

export const TrustedBy = () => {
  const items = [...LOGOS, ...LOGOS, ...LOGOS];
  return (
    <div className="mt-5 w-full" data-testid="trusted-by">
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">
        Trusted By
      </p>
      <div className="edge-fade-x relative mt-3 overflow-hidden">
        <div className="marquee-track marquee-slow items-center gap-6">
          {items.map((l, i) => (
            <div
              key={i}
              data-testid={`trusted-logo-${i}`}
              className="flex h-16 shrink-0 items-center justify-center rounded-xl bg-white px-6 shadow-sm ring-1 ring-black/5 transition-transform duration-300 hover:scale-[1.03]"
            >
              <img
                src={l.src}
                alt={l.name}
                loading="lazy"
                className="h-9 w-auto max-w-[160px] object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustedBy;
