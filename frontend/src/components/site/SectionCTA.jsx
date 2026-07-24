import { ArrowRight } from "lucide-react";
import CTAButton from "./CTAButton";
import Reveal from "./Reveal";

export const SectionCTA = ({ testid = "section-cta", className = "" }) => (
  <Reveal className={`mt-16 flex justify-center ${className}`}>
    <CTAButton to="apply" data-testid={testid}>
      Book Your Strategy Call <ArrowRight className="h-4 w-4" />
    </CTAButton>
  </Reveal>
);

export default SectionCTA;
