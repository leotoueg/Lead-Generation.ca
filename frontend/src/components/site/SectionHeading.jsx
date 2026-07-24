import Reveal from "./Reveal";

export const SectionHeading = ({ chapter, kicker, title, subtitle, align = "left" }) => {
  const alignCls = align === "center" ? "items-center text-center mx-auto" : "items-start text-left";
  return (
    <div className={`flex flex-col ${alignCls} max-w-3xl`}>
      <Reveal>
        <div className="flex items-center gap-3 mb-5">
          {chapter && (
            <span className="font-display text-brand-accent text-lg leading-none">{chapter}</span>
          )}
          <span className="h-px w-10 bg-white/25" />
          <span className="text-[11px] uppercase tracking-[0.28em] text-white/50 font-semibold">
            {kicker}
          </span>
        </div>
      </Reveal>
      <Reveal delay={0.05}>
        <h2 className="font-display uppercase leading-[0.92] tracking-tight text-4xl sm:text-5xl lg:text-6xl">
          {title}
        </h2>
      </Reveal>
      {subtitle && (
        <Reveal delay={0.1}>
          <p className={`mt-6 text-base sm:text-lg text-white/60 leading-relaxed ${align === "center" ? "max-w-2xl" : "max-w-xl"}`}>
            {subtitle}
          </p>
        </Reveal>
      )}
    </div>
  );
};

export default SectionHeading;
