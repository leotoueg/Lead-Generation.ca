import {
  Building2,
  Hammer,
  HardHat,
  Home,
  Wrench,
  PaintRoller,
  Ruler,
  Truck,
  Factory,
  TreePine,
  Warehouse,
  Landmark,
} from "lucide-react";

// Preview placeholders — swap these for real client logos later.
const LOGOS = [
  { icon: Building2, name: "Summit Build" },
  { icon: Hammer, name: "IronWorks Co." },
  { icon: HardHat, name: "Apex Contractors" },
  { icon: Home, name: "Homestead Reno" },
  { icon: Wrench, name: "ProFit Trades" },
  { icon: PaintRoller, name: "TrueCoat" },
  { icon: Ruler, name: "Precision Bath" },
  { icon: Truck, name: "Haul & Co." },
  { icon: Factory, name: "Northgate" },
  { icon: TreePine, name: "Evergreen Exteriors" },
  { icon: Warehouse, name: "BuildRight" },
  { icon: Landmark, name: "Cornerstone" },
];

export const TrustedBy = () => {
  const items = [...LOGOS, ...LOGOS];
  return (
    <div className="mt-5 w-full" data-testid="trusted-by">
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">
        Trusted By
      </p>
      <div className="edge-fade-x relative mt-3 overflow-hidden">
        <div className="marquee-track items-center gap-10">
          {items.map((l, i) => (
            <div
              key={i}
              className="flex shrink-0 items-center gap-2 text-white/50 transition-colors hover:text-white/80"
            >
              <l.icon className="h-5 w-5" strokeWidth={1.75} />
              <span className="whitespace-nowrap text-sm font-semibold tracking-wide">
                {l.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustedBy;
