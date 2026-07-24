import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SERVICES = ["Roofing", "Bathroom Remodeling", "Kitchen Remodeling", "Painting", "Concrete", "Landscaping", "HVAC", "Windows & Doors", "Flooring", "Pools", "Home Services", "Other"];
const REVENUE = ["$1M – $2M", "$2M – $5M", "$5M – $10M", "$10M – $25M", "$25M+", "Under $1M"];

const EMPTY = {
  owner_name: "", company_name: "", email: "", phone: "",
  service_offered: "", annual_revenue: "", postal_code: "", website: "", notes: "",
};

const inputCls =
  "bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0";

export const AppointmentForm = () => {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setVal = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const required = ["owner_name", "company_name", "email", "phone", "service_offered", "annual_revenue", "postal_code"];
    const missing = required.find((k) => !form[k].trim());
    if (missing) {
      toast.error("Please complete all required fields.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/leads`, form);
      setDone(true);
      toast.success("Request received. We'll be in touch shortly.");
      setForm(EMPTY);
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="apply" className="relative overflow-hidden py-24 sm:py-32" data-testid="apply-section">
      <div className="glow-radial pointer-events-none absolute inset-x-0 top-0 h-[500px]" />
      <div className="pointer-events-none absolute left-1/2 top-10 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-brand/15 blur-[150px]" />

      <div className="relative mx-auto max-w-4xl px-5 sm:px-8">
        <SectionHeading
          chapter="07"
          kicker="Apply"
          title={<>Ready to become the go-to<br />contractor in your market?</>}
          subtitle="Tell us about your business. If it's a fit, we'll book your strategy call."
          align="center"
        />

        <Reveal className="mt-14">
          {done ? (
            <div className="rounded-3xl border border-brand/30 bg-gradient-to-b from-brand/[0.12] to-transparent p-12 text-center" data-testid="apply-success">
              <CheckCircle2 className="mx-auto h-14 w-14 text-brand-accent" />
              <h3 className="mt-6 font-display text-3xl uppercase tracking-tight text-white">Request received</h3>
              <p className="mx-auto mt-3 max-w-md text-white/60">
                Thanks for applying. Our team will review your business and reach out to schedule your strategy call.
              </p>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl sm:p-10"
              data-testid="appointment-form"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Owner Name" required>
                  <Input data-testid="input-owner-name" className={inputCls} value={form.owner_name} onChange={set("owner_name")} placeholder="John Smith" />
                </Field>
                <Field label="Company Name" required>
                  <Input data-testid="input-company-name" className={inputCls} value={form.company_name} onChange={set("company_name")} placeholder="Smith Roofing Co." />
                </Field>
                <Field label="Email" required>
                  <Input data-testid="input-email" type="email" className={inputCls} value={form.email} onChange={set("email")} placeholder="john@company.com" />
                </Field>
                <Field label="Phone Number" required>
                  <Input data-testid="input-phone" className={inputCls} value={form.phone} onChange={set("phone")} placeholder="(555) 123-4567" />
                </Field>
                <Field label="Service Offered" required>
                  <Select value={form.service_offered} onValueChange={setVal("service_offered")}>
                    <SelectTrigger data-testid="select-service" className={inputCls}>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-ink-900 text-white">
                      {SERVICES.map((s) => (
                        <SelectItem key={s} value={s} className="focus:bg-brand/20 focus:text-white">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Annual Revenue" required>
                  <Select value={form.annual_revenue} onValueChange={setVal("annual_revenue")}>
                    <SelectTrigger data-testid="select-revenue" className={inputCls}>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-ink-900 text-white">
                      {REVENUE.map((r) => (
                        <SelectItem key={r} value={r} className="focus:bg-brand/20 focus:text-white">{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Postal Code" required>
                  <Input data-testid="input-postal" className={inputCls} value={form.postal_code} onChange={set("postal_code")} placeholder="90210" />
                </Field>
                <Field label="Website">
                  <Input data-testid="input-website" className={inputCls} value={form.website} onChange={set("website")} placeholder="https://" />
                </Field>
              </div>

              <div className="mt-5">
                <Field label="Additional Notes">
                  <Textarea
                    data-testid="input-notes"
                    className="min-h-[110px] rounded-xl border-white/10 bg-white/[0.03] text-white placeholder:text-white/30 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0"
                    value={form.notes}
                    onChange={set("notes")}
                    placeholder="Anything we should know about your goals?"
                  />
                </Field>
              </div>

              <button
                type="submit"
                disabled={loading}
                data-testid="submit-lead-button"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-accent px-8 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_50px_-10px_rgba(44,92,229,0.9)] transition-transform duration-300 hover:scale-[1.02] disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Request Strategy Call <ArrowRight className="h-4 w-4" /></>}
              </button>
              <p className="mt-4 text-center text-xs text-white/40">
                No obligation. We'll only reach out if we can genuinely help you grow.
              </p>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
};

const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-2">
    <Label className="text-xs uppercase tracking-[0.16em] text-white/50">
      {label} {required && <span className="text-brand-accent">*</span>}
    </Label>
    {children}
  </div>
);

export default AppointmentForm;
