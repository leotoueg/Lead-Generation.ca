import { useState } from "react";
import { Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_VIDEO = "aqz-KE-bpKQ";

export const VideoPlayer = ({
  videoId = DEFAULT_VIDEO,
  poster,
  label = "Watch the video",
  autoPlay = false,
  testid = "video-player",
}) => {
  const [playing, setPlaying] = useState(autoPlay);

  return (
    <div
      className="relative w-full aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black"
      data-testid={testid}
    >
      <AnimatePresence mode="wait">
        {playing ? (
          <motion.iframe
            key="frame"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={label}
            allow="accelerated-media; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <motion.button
            key="poster"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full"
            data-testid={`${testid}-play`}
            aria-label={label}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {poster && (
              <img
                src={poster}
                alt={label}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-[1200ms] ease-out group-hover:scale-105"
              />
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-white to-[#c2c6cd] shadow-[0_0_50px_-6px_rgba(255,255,255,0.6)] transition-transform duration-300 group-hover:scale-110">
                <Play className="ml-1 h-8 w-8 fill-black text-black" />
              </span>
            </span>
            <span className="absolute bottom-5 left-6 text-left">
              <span className="block text-[11px] uppercase tracking-[0.28em] text-white/60">Video Sales Letter</span>
              <span className="mt-1 block font-display text-xl uppercase text-white">{label}</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoPlayer;
