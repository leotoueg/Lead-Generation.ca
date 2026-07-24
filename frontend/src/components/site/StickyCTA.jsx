import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { scrollToId } from "../../lib/scroll";

export const StickyCTA = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const apply = document.getElementById("apply");
      const past = window.scrollY > window.innerHeight * 0.9;
      const nearForm = apply && apply.getBoundingClientRect().top < window.innerHeight * 0.9;
      setShow(past && !nearForm);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/80 p-3 backdrop-blur-2xl lg:hidden"
          data-testid="sticky-cta"
        >
          <button
            onClick={() => scrollToId("apply")}
            data-testid="sticky-cta-button"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#285EE0] px-8 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_40px_-12px_rgba(40,94,224,0.9)]"
          >
            Book Your Strategy Call <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyCTA;
