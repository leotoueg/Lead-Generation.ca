import { useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import SectionHeading from "./SectionHeading";
import SectionCTA from "./SectionCTA";
import Reveal from "./Reveal";
import VideoPlayer from "./VideoPlayer";

// type: "loom" -> loomId | "mp4" -> src
const TESTIMONIALS = [
  {
    name: "Stephen Cruey",
    company: "Apex Bath Remodeling",
    location: "Cleburne, TX",
    type: "loom",
    loomId: "586c3a1df10c4ff1b2773b68ccd3c4e9",
    poster: "https://cdn.loom.com/sessions/thumbnails/586c3a1df10c4ff1b2773b68ccd3c4e9-4c44c1a400634fe1.gif",
  },
  {
    name: "Clint Roberts",
    company: "Prime Baths of New Mexico",
    location: "Albuquerque, NM",
    type: "mp4",
    src: "/testimonials/clint.mp4",
    poster: "/testimonials/clint.jpg",
  },
  {
    name: "Emilio Talavera",
    company: "Roofing Monkeys",
    location: "Toronto, ON",
    type: "vimeo",
    vimeoId: "1214123088",
    poster: "https://i.vimeocdn.com/video/2184966481-191d31006fbfeecb0398819488f3080451587cd875ec02aaad63ee0f32b15878-d_640",
  },
];

export const VideoTestimonials = () => {
  const [active, setActive] = useState(null);

  return (
    <section className="relative border-y border-white/10 bg-black/40 py-24 sm:py-32" data-testid="testimonials-section">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          chapter="04"
          kicker="Results"
          title="Contractors in their own words"
          subtitle="Real owners. Real jobs. Real growth. Press play."
        />

        <div className="mt-16 flex flex-wrap justify-center gap-6">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.07}>
              <motion.button
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => setActive(t)}
                className="group block w-[300px] max-w-full text-left"
                data-testid={`testimonial-card-${i + 1}`}
                aria-label={`Play testimonial from ${t.name}`}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-ink-900">
                  {t.poster && (
                    <img
                      src={t.poster}
                      alt={t.name}
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
                    />
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
                  <span className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-colors group-hover:bg-white/25">
                    <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
                  </span>
                  <span className="absolute bottom-0 left-0 right-0 p-5">
                    <span className="block text-[10px] uppercase tracking-[0.24em] text-white/60">Client Story</span>
                    <p className="mt-1 font-display text-lg uppercase tracking-tight text-white">{t.name}</p>
                    <p className="text-xs text-white/60">{t.company}</p>
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">{t.company}</p>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/50">
                    {t.location}
                  </span>
                </div>
              </motion.button>
            </Reveal>
          ))}
        </div>

        <SectionCTA testid="results-cta" />
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl border-white/10 bg-ink-900 p-3" data-testid="testimonial-modal">
          <DialogTitle className="sr-only">{active?.name} testimonial</DialogTitle>
          {active && (
            <VideoPlayer
              type={active.type}
              loomId={active.loomId}
              vimeoId={active.vimeoId}
              src={active.src}
              poster={active.poster}
              label={active.name}
              autoPlay
              testid="testimonial-video"
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default VideoTestimonials;
