import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Clock, ArrowRight, Loader2, CheckCircle2, Globe } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SERVICES = ["Roofing", "Bathroom Remodeling", "Kitchen Remodeling", "General Contractor", "Other"];

const EMPTY = { name: "", email: "", company: "", phone: "", service: "", notes: "" };

const inputCls =
  "bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-0";

const tzShort = (tz) => {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value || tz;
  } catch {
    return tz;
  }
};

export const BookingCalendar = () => {
  const [avail, setAvail] = useState(null);
  const [selDate, setSelDate] = useState(null);
  const [selTime, setSelTime] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setVal = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    axios
      .get(`${API}/booking/availability`)
      .then(({ data }) => {
        const days = Array.isArray(data?.days) ? data.days : [];
        setAvail({ timezone: data?.timezone, days });
        const firstOpen = days.find((d) => Array.isArray(d?.slots) && d.slots.some((s) => s.available));
        if (firstOpen) setSelDate(firstOpen.date);
      })
      .catch(() => {
        setAvail({ days: [] });
        toast.error("Couldn't load available times. Please refresh.");
      });
  }, []);

  const days = Array.isArray(avail?.days) ? avail.days : [];
  const currentDay = days.find((d) => d.date === selDate);
  const tzLabel = avail ? tzShort(avail.timezone) : "";

  const chooseDate = (date) => {
    setSelDate(date);
    setSelTime(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!selDate || !selTime) {
      toast.error("Please pick a day and time.");
      return;
    }
    const required = ["name", "email", "company", "phone", "service"];
    if (required.find((k) => !form[k].trim())) {
      toast.error("Please complete all required fields.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/booking`, { ...form, date: selDate, time: selTime });
      const slotLabel = (currentDay?.slots ?? []).find((s) => s.time === selTime)?.label;
      setDone({ label: currentDay?.label, time: slotLabel, tz: tzLabel });
      setForm(EMPTY);
      setSelTime(null);
      toast.success("Your strategy call is booked.");
    } catch (err) {
      const msg = err?.response?.data?.detail || "Something went wrong. Please try again.";
      toast.error(msg);
      // refresh availability in case the slot was just taken
      axios.get(`${API}/booking/availability`).then(({ data }) => setAvail(data)).catch(() => {});
      setSelTime(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="apply" className="relative overflow-hidden py-24 sm:py-32" data-testid="booking-section">
      <div className="glow-radial pointer-events-none absolute inset-x-0 top-0 h-[500px]" />
      <div className="pointer-events-none absolute left-1/2 top-10 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-white/[0.06] blur-[150px]" />

      <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
        <SectionHeading
          chapter="07"
          kicker="Book a call"
          title={<>Ready to become the go-to<br />contractor in your market?</>}
          subtitle="Pick a time that works and lock in your strategy call. It's the fastest way to see if we're a fit."
          align="center"
        />

        <Reveal className="mt-14">
          {done ? (
            <div className="mx-auto max-w-xl rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.08] to-transparent p-12 text-center" data-testid="booking-success">
              <CheckCircle2 className="mx-auto h-14 w-14 text-white" />
              <h3 className="mt-6 font-display text-3xl uppercase tracking-tight text-white">You're booked</h3>
              <p className="mx-auto mt-3 max-w-md text-white/70">
                {done.label} at {done.time} ({done.tz}). Your slot is locked in — our team will reach out to confirm the details. Talk soon.
              </p>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="grid gap-6 rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl sm:p-8 lg:grid-cols-2"
              data-testid="booking-form"
            >
              {/* Left: scheduling */}
              <div className="lg:border-r lg:border-white/10 lg:pr-8">
                <div className="flex items-center gap-2 text-white">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">Select a day</span>
                </div>

                {avail === null ? (
                  <div className="mt-6 flex h-40 items-center justify-center text-white/40">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : days.length === 0 ? (
                  <p className="mt-6 text-sm text-white/50" data-testid="booking-no-times">
                    No times available right now — please check back soon or reach out directly.
                  </p>
                ) : (
                  <>
                    <div className="mt-5 grid grid-cols-4 gap-2" data-testid="booking-days">
                      {days.map((d) => {
                        const anyOpen = Array.isArray(d.slots) && d.slots.some((s) => s.available);
                        const activeDay = d.date === selDate;
                        return (
                          <button
                            key={d.date}
                            type="button"
                            disabled={!anyOpen}
                            onClick={() => chooseDate(d.date)}
                            data-testid={`day-${d.date}`}
                            className={`flex flex-col items-center rounded-2xl border px-2 py-3 transition-all ${
                              activeDay
                                ? "border-white bg-white text-black"
                                : anyOpen
                                ? "border-white/10 bg-white/[0.03] text-white hover:border-white/40"
                                : "cursor-not-allowed border-white/5 bg-white/[0.01] text-white/25"
                            }`}
                          >
                            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">{d.weekday}</span>
                            <span className="mt-1 font-display text-2xl leading-none">{d.day}</span>
                            <span className="mt-1 text-[10px] uppercase tracking-[0.14em]">{d.month}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-8 flex items-center gap-2 text-white">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-[0.16em]">Select a time</span>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3" data-testid="booking-slots">
                      <AnimatePresence mode="popLayout">
                        {(currentDay?.slots ?? []).map((s) => (
                          <motion.button
                            key={`${selDate}-${s.time}`}
                            type="button"
                            layout
                            disabled={!s.available}
                            onClick={() => setSelTime(s.time)}
                            data-testid={`slot-${s.time}`}
                            className={`rounded-xl border px-4 py-3.5 text-sm font-semibold tracking-wide transition-all ${
                              selTime === s.time
                                ? "border-white bg-white text-black"
                                : s.available
                                ? "border-white/12 bg-white/[0.03] text-white hover:border-white/40"
                                : "cursor-not-allowed border-white/5 bg-white/[0.01] text-white/25 line-through"
                            }`}
                          >
                            {s.label}
                          </motion.button>
                        ))}
                      </AnimatePresence>
                    </div>
                    <p className="mt-4 flex items-center gap-1.5 text-[11px] text-white/40">
                      <Globe className="h-3 w-3" /> Times shown in {tzLabel}. Each call is 60 minutes.
                    </p>
                  </>
                )}
              </div>

              {/* Right: details */}
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full Name" required>
                    <Input data-testid="booking-name" className={inputCls} value={form.name} onChange={set("name")} placeholder="John Smith" />
                  </Field>
                  <Field label="Company" required>
                    <Input data-testid="booking-company" className={inputCls} value={form.company} onChange={set("company")} placeholder="Smith Roofing Co." />
                  </Field>
                  <Field label="Email" required>
                    <Input data-testid="booking-email" type="email" className={inputCls} value={form.email} onChange={set("email")} placeholder="john@company.com" />
                  </Field>
                  <Field label="Phone" required>
                    <Input data-testid="booking-phone" className={inputCls} value={form.phone} onChange={set("phone")} placeholder="(555) 123-4567" />
                  </Field>
                </div>
                <Field label="Industry" required>
                  <Select value={form.service} onValueChange={setVal("service")}>
                    <SelectTrigger data-testid="booking-service" className={inputCls}>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-ink-900 text-white">
                      {SERVICES.map((s) => (
                        <SelectItem key={s} value={s} className="focus:bg-white/15 focus:text-white">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Anything we should know?">
                  <Textarea
                    data-testid="booking-notes"
                    className="min-h-[92px] rounded-xl border-white/10 bg-white/[0.03] text-white placeholder:text-white/30 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-0"
                    value={form.notes}
                    onChange={set("notes")}
                    placeholder="Your goals, current revenue, timeline…"
                  />
                </Field>

                {selDate && selTime && (
                  <div className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white/80" data-testid="booking-selection-summary">
                    <span className="text-white/50">Selected:</span> {currentDay?.label} · {(currentDay?.slots ?? []).find((s) => s.time === selTime)?.label}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  data-testid="confirm-booking-button"
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-white to-[#c2c6cd] hover:to-[#dfe3e9] px-8 py-4 text-sm font-bold uppercase tracking-[0.14em] text-black shadow-[0_0_50px_-10px_rgba(255,255,255,0.6)] transition-transform duration-300 hover:scale-[1.02] disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Confirm Strategy Call <ArrowRight className="h-4 w-4" /></>}
                </button>
                <p className="text-center text-xs text-white/40">
                  No obligation. We'll only reach out if we can genuinely help you grow.
                </p>
              </div>
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
      {label} {required && <span className="text-white/70">*</span>}
    </Label>
    {children}
  </div>
);

export default BookingCalendar;
