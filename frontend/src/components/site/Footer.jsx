import { scrollToId } from "../../lib/scroll";

export const Footer = () => {
  return (
    <footer className="relative border-t border-white/10 bg-black" data-testid="site-footer">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-10 sm:flex-row sm:items-center">
          <div>
            <img src="/logo-white.png" alt="Lead-Generation.ca" className="h-7 w-auto" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/45">
              Your in-house growth team. We fly to established contractors, film professional ads and run the
              systems that generate more profitable jobs.
            </p>
          </div>
          <button
            onClick={() => scrollToId("apply")}
            data-testid="footer-cta-button"
            className="rounded-full bg-gradient-to-b from-white to-[#c2c6cd] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-black shadow-[0_0_40px_-12px_rgba(255,255,255,0.6)] transition-transform hover:scale-[1.03]"
          >
            Book Your Strategy Call
          </button>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-white/35">© {new Date().getFullYear()} Lead-Generation.ca. All rights reserved.</p>
          <p className="text-xs uppercase tracking-[0.18em] text-white/30">
            Done-for-you growth · Toronto, Canada
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
