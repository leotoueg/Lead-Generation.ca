import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import CTAButton from "./CTAButton";
import VideoPlayer from "./VideoPlayer";

const EASE = [0.22, 1, 0.36, 1];

const HEADLINE = [
  { text: "We become your", accent: false },
  { text: "in-house", accent: false },
  { text: "growth team.", accent: true },
];

const lineVariants = {
  hidden: { y: "110%" },
  visible: (i) => ({
    y: "0%",
    transition: { duration: 0.9, delay: 0.15 + i * 0.12, ease: EASE },
  }),
};

const VSL_POSTER =
  "https://images.pexels.com/photos/3062541/pexels-photo-3062541.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const videoY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);

  return (
    <section id="top" ref={ref} className="relative overflow-hidden pt-16 sm:pt-20" data-testid="hero-section">
      <div className="glow-radial pointer-events-none absolute inset-x-0 top-0 h-[720px]" />
      <div className="pointer-events-none absolute left-1/2 top-24 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-brand/20 blur-[160px]" />

      {/* Centered qualifier badge */}
      <div className="relative mx-auto flex max-w-7xl justify-center px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="whitespace-nowrap rounded-full bg-yellow-400 px-4 py-1 text-center text-[10px] font-bold uppercase tracking-[0.06em] text-white shadow-[0_0_30px_-8px_rgba(250,204,21,0.7)] sm:rounded-xl sm:py-2 sm:text-sm sm:tracking-[0.12em]"
          data-testid="hero-qualifier-badge"
        >
          ⚠️ For Contractors doing over 1M+ Per Year ⚠️
        </motion.div>
      </div>

      <div className="relative mx-auto mt-6 grid max-w-7xl grid-cols-1 items-start gap-8 px-5 pb-12 text-center sm:px-8 sm:pb-16 lg:grid-cols-2 lg:gap-12 lg:text-left">
        {/* Left: copy */}
        <div className="flex flex-col items-center lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 backdrop-blur-xl"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
            <span className="text-[11px] uppercase tracking-[0.24em] text-white/70">
              Done-for-you growth for established contractors
            </span>
          </motion.div>

          <h1 className="font-display uppercase leading-[0.9] tracking-tight text-4xl sm:text-5xl lg:text-6xl">
            {HEADLINE.map((line, i) => (
              <span key={i} className="block overflow-hidden py-0.5">
                <motion.span
                  className={`block ${line.accent ? "text-gold" : "text-white"}`}
                  custom={i}
                  variants={lineVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {line.text}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease: EASE }}
            className="mt-5 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base"
          >
            We help established contractors generate more profitable jobs with professionally filmed ads,
            paid advertising, CRM automation and sales systems. We fly to you. We build it all. We run it.
          </motion.p>

          {/* Mobile VSL — sits between the paragraph and the primary CTA on small screens */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: EASE }}
            className="mt-6 w-full lg:hidden"
          >
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-2 shadow-[0_40px_120px_-40px_rgba(255,255,255,0.25)] backdrop-blur-xl">
              <VideoPlayer poster={VSL_POSTER} label="Watch how it works" testid="hero-vsl-mobile" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7, ease: EASE }}
            className="mt-6 flex flex-col items-center gap-4 sm:flex-row lg:justify-start"
          >
            <CTAButton to="apply" data-testid="hero-primary-cta">
              Book Your Strategy Call <ArrowRight className="h-4 w-4" />
            </CTAButton>
            <CTAButton
              to="vsl"
              variant="glass"
              className="hidden lg:inline-flex"
              data-testid="hero-secondary-cta"
            >
              Watch The Video
            </CTAButton>
          </motion.div>
        </div>

        {/* Right: VSL (desktop only) */}
        <div className="hidden w-full lg:mt-10 lg:block">
          <motion.div
            id="vsl"
            style={{ y: videoY, scale: videoScale }}
            className="relative w-full"
          >
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-2 shadow-[0_40px_120px_-40px_rgba(255,255,255,0.25)] backdrop-blur-xl sm:p-3">
              <VideoPlayer poster={VSL_POSTER} label="Watch how it works" testid="hero-vsl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
