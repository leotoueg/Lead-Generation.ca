import { motion } from "framer-motion";
import {
  Clapperboard, Search, Facebook, LayoutTemplate, Database, Workflow,
  MessageSquareText, Star, KanbanSquare, LineChart, FileBarChart, FlaskConical,
} from "lucide-react";
import SectionHeading from "./SectionHeading";

const FEATURES = [
  { icon: Clapperboard, title: "Professional Video Production", body: "Cinematic commercials and ad creative filmed on-site with your team.", span: true },
  { icon: Search, title: "Google Ads", body: "High-intent search campaigns built to capture buyers ready now." },
  { icon: Facebook, title: "Facebook & Instagram Ads", body: "Scroll-stopping paid social that fills the top of your funnel." },
  { icon: LayoutTemplate, title: "Landing Pages", body: "Conversion-engineered pages that turn clicks into booked calls." },
  { icon: Database, title: "CRM Setup", body: "A single source of truth for every lead, job and conversation." },
  { icon: Workflow, title: "Lead Nurture Automation", body: "Automated follow-up that works your pipeline around the clock.", span: true },
  { icon: MessageSquareText, title: "Missed Call Text Back", body: "Never lose a lead — every missed call gets an instant text." },
  { icon: Star, title: "Review Automation", body: "Systematically build the reputation that wins your market." },
  { icon: KanbanSquare, title: "Pipeline Management", body: "See every opportunity and exactly where it stands." },
  { icon: LineChart, title: "Campaign Optimization", body: "Weekly tuning to lower cost per job and lift close rates." },
  { icon: FileBarChart, title: "Monthly Reporting", body: "Clear numbers tied to revenue — not vanity metrics." },
  { icon: FlaskConical, title: "Creative Testing", body: "Always testing new angles to keep performance climbing." },
];

export const FeatureGrid = () => {
  return (
    <section className="relative py-24 sm:py-32" data-testid="features-section">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          chapter="04"
          kicker="What you get"
          title="One team. The entire system."
          subtitle="Everything required to generate, nurture and close more profitable jobs — done for you."
        />

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: (i % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -5 }}
              className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 transition-colors hover:border-brand/40 ${
                f.span ? "lg:col-span-2" : ""
              }`}
              data-testid={`feature-${i + 1}`}
            >
              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-brand/20 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-ink-900 text-brand-accent">
                <f.icon className="h-6 w-6" />
              </span>
              <h3 className="relative mt-6 font-display text-xl uppercase tracking-tight text-white">
                {f.title}
              </h3>
              <p className="relative mt-2 max-w-md text-sm leading-relaxed text-white/55">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
