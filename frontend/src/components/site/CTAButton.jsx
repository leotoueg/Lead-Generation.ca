import { scrollToId } from "../../lib/scroll";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-bold uppercase tracking-[0.12em] transition-[transform,background-color,box-shadow] duration-300 will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950";

const sizes = {
  lg: "px-8 py-4 text-sm",
  md: "px-6 py-3 text-xs",
};

const variants = {
  primary:
    "text-white bg-gradient-to-r from-brand to-brand-accent shadow-[0_0_44px_-10px_rgba(44,92,229,0.8)] hover:scale-[1.03] hover:shadow-[0_0_60px_-8px_rgba(44,92,229,0.95)]",
  glass:
    "text-white border border-white/15 bg-white/[0.04] backdrop-blur-xl hover:bg-white/[0.09] hover:scale-[1.02]",
};

export const CTAButton = ({
  children,
  to,
  onClick,
  variant = "primary",
  size = "lg",
  className = "",
  ...rest
}) => {
  const handle = (e) => {
    if (onClick) onClick(e);
    if (to) scrollToId(to);
  };
  return (
    <button
      onClick={handle}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

export default CTAButton;
