import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CTAButton from "./CTAButton";
import { scrollToId } from "../../lib/scroll";

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-black/70 backdrop-blur-2xl border-b border-white/10" : "bg-transparent"
      }`}
      data-testid="site-header"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <button
          onClick={() => scrollToId("top")}
          className="flex items-center"
          data-testid="header-logo"
          aria-label="Lead-Generation.ca home"
        >
          <img src="/logo-white.png" alt="Lead-Generation.ca" className="h-6 w-auto sm:h-7" />
        </button>
        <CTAButton to="apply" size="md" data-testid="header-cta-button">
          Book Your Strategy Call
        </CTAButton>
      </div>
    </motion.header>
  );
};

export default Header;
