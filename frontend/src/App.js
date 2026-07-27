import { useEffect } from "react";
import "./App.css";
import Lenis from "lenis";

import Header from "./components/site/Header";
import Hero from "./components/site/Hero";
import TrustBar from "./components/site/TrustBar";
import CTABand from "./components/site/CTABand";
import WhyDifferent from "./components/site/WhyDifferent";
import ProcessTimeline from "./components/site/ProcessTimeline";
import VideoTestimonials from "./components/site/VideoTestimonials";
import FeatureGrid from "./components/site/FeatureGrid";
import WhoThisIsFor from "./components/site/WhoThisIsFor";
import FAQ from "./components/site/FAQ";
import AppointmentForm from "./components/site/AppointmentForm";
import Footer from "./components/site/Footer";
import StickyCTA from "./components/site/StickyCTA";
import { Toaster } from "./components/ui/sonner";

function App() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    window.__lenis = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);

  return (
    <div className="App grain relative bg-ink-950 text-white overflow-x-hidden" data-testid="landing-page">
      <Header />
      <main>
        <Hero />
        <TrustBar />
        <CTABand text="We become your in-house growth team." testid="cta-band-top" />
        <WhyDifferent />
        <ProcessTimeline />
        <VideoTestimonials />
        <FeatureGrid />
        <WhoThisIsFor />
        <FAQ />
        <AppointmentForm />
      </main>
      <Footer />
      <StickyCTA />
      <Toaster position="top-center" theme="dark" richColors />
    </div>
  );
}

export default App;
