import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Quote } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import VideoPlayer from "./VideoPlayer";

const TESTIMONIALS = [
  {
    name: "Marcus Bennett",
    company: "Bennett Roofing Co.",
    industry: "Roofing",
    quote: "We booked more qualified jobs in 90 days than the previous year combined.",
    image:
      "https://images.unsplash.com/photo-1672748341520-6a839e6c05bb?crop=entropy&cs=srgb&fm=jpg&w=900&q=85",
    videoId: "aqz-KE-bpKQ",
  },
  {
    name: "Devon Carter",
    company: "Carter Kitchen & Bath",
    industry: "Remodeling",
    quote: "The footage they shot on-site outperformed everything we'd ever run.",
    image:
      "https://images.unsplash.com/photo-1621905252472-943afaa20e20?crop=entropy&cs=srgb&fm=jpg&w=900&q=85",
    videoId: "aqz-KE-bpKQ",
  },
  {
    name: "Ryan Mitchell",
    company: "Mitchell Concrete",
    industry: "Concrete",
    quote: "It feels like we hired a full marketing department without the overhead.",
    image:
      "https://images.unsplash.com/photo-1742844019488-12a9356a7ace?crop=entropy&cs=srgb&fm=jpg&w=900&q=85",
    videoId: "aqz-KE-bpKQ",
  },
  {
    name: "Andre Coleman",
    company: "Coleman HVAC",
    industry: "HVAC",
    quote: "Our calendar stays full and the leads finally match the work we want.",
    image:
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?crop=entropy&cs=srgb&fm=jpg&w=900&q=85",
    videoId: "aqz-KE-bpKQ",
  },
];

export const VideoTestimonials = () => {
  const [active, setActive] = useState(null);

  return (
    <section className="relative border-y border-white/10 bg-black/40 py-24 sm:py-32" data-testid="testimonials-section">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          chapter="03"
          kicker="Results"
          title="Contractors in their own words"
          subtitle="Real owners. Real jobs. Real growth. Press play."
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.07}>
              <motion.button
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => setActive(t)}
                className="group block w-full text-left"
                data-testid={`testimonial-card-${i + 1}`}
                aria-label={`Play testimonial from ${t.name}`}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10">
                  <img
                    src={t.image}
                    alt={t.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  <span className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-colors group-hover:bg-brand">
                    <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
                  </span>
                  <span className="absolute bottom-0 left-0 right-0 p-5">
                    <Quote className="mb-2 h-5 w-5 text-brand-accent" />
                    <p className="text-sm leading-snug text-white/90">{t.quote}</p>
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="font-display text-lg uppercase tracking-tight text-white">{t.name}</p>
                    <p className="text-xs text-white/50">{t.company}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/50">
                    {t.industry}
                  </span>
                </div>
              </motion.button>
            </Reveal>
          ))}
        </div>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl border-white/10 bg-ink-900 p-3" data-testid="testimonial-modal">
          <DialogTitle className="sr-only">{active?.name} testimonial</DialogTitle>
          {active && (
            <VideoPlayer videoId={active.videoId} poster={active.image} label={active.name} autoPlay testid="testimonial-video" />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default VideoTestimonials;
