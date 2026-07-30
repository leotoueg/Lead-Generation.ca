import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import SectionHeading from "./SectionHeading";
import SectionCTA from "./SectionCTA";
import Reveal from "./Reveal";

const FAQS = [
  {
    q: "Why do you fly out to my business?",
    a: "Because real footage converts. Your crews, your trucks, your finished jobs and your reputation are impossible to fake with stock. We capture it in person so your ads look like nobody else's in your market.",
  },
  {
    q: "Do I need to sign a long contract?",
    a: "No multi-year handcuffs. We work in clear engagements and earn the relationship through results. We're confident in the work, so we don't need to trap you into it.",
  },
  {
    q: "What industries do you work with?",
    a: "Established home-service and construction contractors — primarily roofing, bathroom remodeling, kitchen remodeling and general contracting.",
  },
  {
    q: "How quickly can campaigns launch?",
    a: "Typically within a few weeks of the shoot. Once we've filmed and edited your assets, ads, landing pages and automations go live in quick succession.",
  },
  {
    q: "How much time do I need to invest?",
    a: "Very little after the shoot day. We handle production, ads, tech and follow-up. You approve the direction and take the qualified calls we generate.",
  },
  {
    q: "Is this coaching or a course?",
    a: "No. This is fully done-for-you. We build and run the entire acquisition system as your in-house growth team.",
  },
];

export const FAQ = () => {
  return (
    <section className="relative py-24 sm:py-32" data-testid="faq-section">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <SectionHeading
          chapter="07"
          kicker="Questions"
          title="Answers before you ask"
          align="center"
        />
        <Reveal className="mt-14">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((item, i) => (
              <AccordionItem
                key={item.q}
                value={`item-${i}`}
                className="border-b border-white/10"
                data-testid={`faq-item-${i + 1}`}
              >
                <AccordionTrigger className="py-6 text-left font-display text-xl uppercase tracking-tight text-white hover:text-brand-accent hover:no-underline sm:text-2xl">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-base leading-relaxed text-white/60">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
};

export default FAQ;
