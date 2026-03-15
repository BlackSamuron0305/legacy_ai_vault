import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  PenLine,
  Users,
  FileText,
  UserRound,
  Clock,
  BookOpen,
  Search,
  Cpu,
  TrendingDown,
  Zap,
  ChevronDown,
  ArrowRight,
  Check,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

function fmt(n: number): string {
  return n.toLocaleString("de-DE") + " €";
}

function SliderControl({
  label, value, min, max, step = 1, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-sm font-semibold text-foreground tabular-nums">{value}{unit}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

function CostLine({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        {note && <span className="text-[10px] text-muted-foreground/50 block leading-tight">{note}</span>}
      </div>
      <span className="text-xs font-semibold text-foreground shrink-0 tabular-nums">{fmt(value)}</span>
    </div>
  );
}

function FactItem({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 bg-muted/60 flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <span className="text-sm font-bold text-foreground">{value}</span>
        <span className="text-[11px] text-muted-foreground block leading-tight">{label}</span>
      </div>
    </div>
  );
}

function DetailSection({ title, children, defaultOpen = false }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-border/40">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-xs font-semibold text-foreground hover:text-primary transition-colors"
      >
        {title}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pb-4 space-y-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const PLAN_RECS = [
  {
    name: "Starter",
    price: "€299",
    period: "/mo",
    condition: (n: number) => n <= 4,
    gradient: "pricing-card-gradient-4",
    features: ["Up to 50 employees", "Unlimited interviews", "Semantic search"],
  },
  {
    name: "Business",
    price: "€699",
    period: "/mo",
    condition: (n: number) => n > 4 && n <= 12,
    gradient: "pricing-card-gradient-2",
    features: ["Up to 250 employees", "CRM & ERP integration", "Analytics dashboard"],
  },
  {
    name: "Enterprise",
    price: "€1,999",
    period: "/mo+",
    condition: (n: number) => n > 12,
    gradient: "pricing-card-gradient-3",
    features: ["Unlimited employees", "SSO & SAML", "Dedicated success manager"],
  },
];

export default function CostSimulation() {
  const [expertRate, setExpertRate] = useState(150);
  const [expertTime, setExpertTime] = useState(40);
  const [numEmployees, setNumEmployees] = useState(5);
  const [employeeRate, setEmployeeRate] = useState(70);
  const [docPages, setDocPages] = useState(80);

  const costs = useMemo(() => {
    const mentorCapture = expertTime * expertRate;
    const mentorReplicationExpert = expertTime * numEmployees * expertRate;
    const mentorReplicationEmployee = expertTime * numEmployees * employeeRate;
    const mentorTotal = mentorCapture + mentorReplicationExpert + mentorReplicationEmployee;

    const docWritingHours = docPages * 4;
    const docCapture = docWritingHours * expertRate;
    const docReview = docWritingHours * 0.2 * expertRate;
    const docEmployeeRead = numEmployees * (docWritingHours * 0.2) * employeeRate;
    const docTotal = docCapture + docReview + docEmployeeRead;

    const legacyCaptureHours = Math.round(docWritingHours * (17.5 / 130) * 10) / 10;
    const legacyCaptureCost = legacyCaptureHours * expertRate;
    const legacyInfraCost = 422;
    const legacyAIRate = 7.20;
    const legacyTrainingTime = Math.round(expertTime * 0.5 * 10) / 10;
    const legacyReplicationEmployee = legacyTrainingTime * employeeRate * numEmployees;
    const legacyReplicationAI = legacyTrainingTime * legacyAIRate * numEmployees;
    const legacyTotal = legacyCaptureCost + legacyReplicationEmployee + legacyReplicationAI + legacyInfraCost;

    const maxTotal = Math.max(mentorTotal, docTotal);
    const savingsVsMentor = mentorTotal - legacyTotal;
    const savingsVsDoc = docTotal - legacyTotal;
    const savingsPctMentor = Math.round((savingsVsMentor / mentorTotal) * 100);
    const savingsPctDoc = Math.round((savingsVsDoc / docTotal) * 100);

    return {
      mentorCapture, mentorReplicationExpert, mentorReplicationEmployee, mentorTotal,
      docCapture, docWritingHours, docReview, docEmployeeRead, docTotal,
      legacyCaptureHours, legacyCaptureCost, legacyInfraCost,
      legacyTrainingTime, legacyReplicationEmployee, legacyReplicationAI,
      legacyTotal, legacyAIRate,
      maxTotal, savingsVsMentor, savingsVsDoc, savingsPctMentor, savingsPctDoc,
    };
  }, [expertRate, expertTime, numEmployees, employeeRate, docPages]);

  const barScale = (v: number) => Math.max(6, Math.round((v / costs.maxTotal) * 100));
  const recommendedPlan = PLAN_RECS.find(p => p.condition(numEmployees)) ?? PLAN_RECS[1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Cost comparison</p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
          Compare knowledge transfer costs
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Adjust the parameters for your organization — see the real cost difference in real time.
        </p>
      </div>

      {/* Sliders — eckig gap-px grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
        <div className="bg-background p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <UserRound className="w-4 h-4 text-primary" /> Expert / Senior
          </h3>
          <SliderControl label="Hourly rate" value={expertRate} min={120} max={200} step={5} unit=" €/h" onChange={setExpertRate} />
          <SliderControl label="Capture time" value={expertTime} min={30} max={60} step={5} unit=" h" onChange={setExpertTime} />
        </div>
        <div className="bg-background p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Employees to train
            </h3>
            <span className="text-2xl font-bold tabular-nums text-foreground leading-none">{numEmployees}</span>
          </div>
          <SliderControl label="Number of employees" value={numEmployees} min={1} max={20} unit="" onChange={setNumEmployees} />
          <SliderControl label="Employee hourly rate" value={employeeRate} min={50} max={90} step={5} unit=" €/h" onChange={setEmployeeRate} />
        </div>
        <div className="bg-background p-6 space-y-4 sm:col-span-2 lg:col-span-1">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Documentation scope
          </h3>
          <SliderControl label="Pages" value={docPages} min={40} max={120} step={5} unit=" pages" onChange={setDocPages} />
          <p className="text-[10px] text-muted-foreground/50">≈ {costs.docWritingHours} h writing time at 4 h/page</p>
        </div>
      </div>

      {/* Bar comparison — sharp, grain gradient fills */}
      <div className="border-x border-b border-border bg-background p-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                <UserRound className="w-4 h-4 text-muted-foreground" /> Classical Mentoring
              </span>
              <span className="text-sm font-bold text-foreground tabular-nums">{fmt(costs.mentorTotal)}</span>
            </div>
            <div className="h-8 bg-muted/30 overflow-hidden">
              <motion.div
                className="h-full bar-fill-1"
                initial={{ width: 0 }}
                animate={{ width: `${barScale(costs.mentorTotal)}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" /> Exhaustive Documentation
              </span>
              <span className="text-sm font-bold text-foreground tabular-nums">{fmt(costs.docTotal)}</span>
            </div>
            <div className="h-8 bg-muted/30 overflow-hidden">
              <motion.div
                className="h-full bar-fill-3"
                initial={{ width: 0 }}
                animate={{ width: `${barScale(costs.docTotal)}%` }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" /> LegacyAI
              </span>
              <span className="text-sm font-bold text-primary tabular-nums">{fmt(costs.legacyTotal)}</span>
            </div>
            <div className="h-8 bg-muted/30 overflow-hidden">
              <motion.div
                className="h-full bar-fill-2"
                initial={{ width: 0 }}
                animate={{ width: `${barScale(costs.legacyTotal)}%` }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
              />
            </div>
          </div>
        </div>

        {/* Savings strip */}
        <div className="mt-8 border-t border-border pt-6 grid sm:grid-cols-2 divide-x divide-border">
          <div className="pr-4 text-center">
            <p className="text-2xl font-bold text-foreground tabular-nums">{fmt(costs.savingsVsMentor)}</p>
            <p className="text-xs text-muted-foreground mt-1">saved vs. Mentoring ({costs.savingsPctMentor}%)</p>
          </div>
          <div className="pl-4 text-center">
            <p className="text-2xl font-bold text-foreground tabular-nums">{fmt(costs.savingsVsDoc)}</p>
            <p className="text-xs text-muted-foreground mt-1">saved vs. Documentation ({costs.savingsPctDoc}%)</p>
          </div>
        </div>
      </div>

      {/* Detail breakdown — eckig gap-px grid */}
      <div className="grid md:grid-cols-3 gap-px bg-border border-x border-b border-border">
        <div className="bg-background p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
            <UserRound className="w-4 h-4 text-muted-foreground" /> Classical Mentoring
          </h3>
          <p className="text-lg font-bold text-foreground tabular-nums">{fmt(costs.mentorTotal)}</p>
          <DetailSection title="Assumptions">
            <FactItem icon={<Clock className="w-4 h-4 text-muted-foreground" />} value="1 : 1" label="Expert per trainee" />
            <FactItem icon={<MessageSquare className="w-4 h-4 text-muted-foreground" />} value="~130 wpm" label="Talking speed" />
          </DetailSection>
          <DetailSection title="Knowledge capture">
            <CostLine label="Expert time" value={costs.mentorCapture} note={`${expertTime} h × ${expertRate} €/h`} />
          </DetailSection>
          <DetailSection title="Replication">
            <CostLine label="Expert per employee" value={costs.mentorReplicationExpert} note={`${expertTime} h × ${numEmployees} × ${expertRate} €/h`} />
            <CostLine label="Employee training" value={costs.mentorReplicationEmployee} note={`${expertTime} h × ${numEmployees} × ${employeeRate} €/h`} />
          </DetailSection>
        </div>

        <div className="bg-background p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-muted-foreground" /> Exhaustive Documentation
          </h3>
          <p className="text-lg font-bold text-foreground tabular-nums">{fmt(costs.docTotal)}</p>
          <DetailSection title="Assumptions">
            <FactItem icon={<PenLine className="w-4 h-4 text-muted-foreground" />} value="~4 h/page" label="Writing time" />
            <FactItem icon={<BookOpen className="w-4 h-4 text-muted-foreground" />} value="20%" label="Review overhead" />
            <FactItem icon={<Search className="w-4 h-4 text-muted-foreground" />} value="20%" label="Search & read time" />
          </DetailSection>
          <DetailSection title="Knowledge capture">
            <CostLine label="Expert writing" value={costs.docCapture} note={`${docPages} pg × 4 h × ${expertRate} €/h`} />
            <CostLine label="Senior review" value={costs.docReview} note={`${costs.docWritingHours} h × 0.2 × ${expertRate} €/h`} />
          </DetailSection>
          <DetailSection title="Replication">
            <CostLine label="Employee read time" value={costs.docEmployeeRead} note={`${numEmployees} × ${(costs.docWritingHours * 0.2).toFixed(0)} h × ${employeeRate} €/h`} />
          </DetailSection>
        </div>

        <div className="bg-primary/5 border-l-2 border-l-primary p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4 text-primary" /> LegacyAI
          </h3>
          <p className="text-lg font-bold text-primary tabular-nums">{fmt(costs.legacyTotal)}</p>
          <DetailSection title="Assumptions" defaultOpen>
            <FactItem icon={<Cpu className="w-4 h-4 text-primary" />} value="422 €/mo" label="Infrastructure" />
            <FactItem icon={<TrendingDown className="w-4 h-4 text-primary" />} value="50%" label="Training time reduction" />
            <FactItem icon={<Zap className="w-4 h-4 text-primary" />} value="7,20 €/h" label="AI usage cost" />
          </DetailSection>
          <DetailSection title="Knowledge capture">
            <CostLine label="Expert talking time" value={costs.legacyCaptureCost} note={`${costs.legacyCaptureHours} h × ${expertRate} €/h`} />
          </DetailSection>
          <DetailSection title="Replication">
            <CostLine label="Employee training" value={costs.legacyReplicationEmployee} note={`${costs.legacyTrainingTime} h × ${numEmployees} × ${employeeRate} €/h`} />
            <CostLine label="AI usage" value={costs.legacyReplicationAI} note={`${costs.legacyTrainingTime} h × ${numEmployees} × ${costs.legacyAIRate} €/h`} />
            <CostLine label="Infrastructure" value={costs.legacyInfraCost} note="Fixed monthly" />
          </DetailSection>
        </div>
      </div>

      {/* ── Dynamic Plan Recommendation ── */}
      <div className="mt-14 pt-10 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Based on your numbers</p>
            <p className="text-foreground font-medium">
              We recommend{" "}
              <span className="font-bold text-primary">{recommendedPlan.name}</span>
              {" "}for{" "}
              <span className="font-semibold">{numEmployees} {numEmployees === 1 ? "employee" : "employees"}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Save {fmt(costs.savingsVsMentor)} vs. traditional methods
            </p>
          </div>

          <div className="flex items-stretch divide-x divide-border border border-border">
            {PLAN_RECS.map((plan) => {
              const isRec = plan.name === recommendedPlan.name;
              return (
                <div
                  key={plan.name}
                  className={`px-5 py-3 flex flex-col items-center gap-0.5 transition-colors duration-300 ${
                    isRec ? "bg-foreground" : "bg-background"
                  }`}
                >
                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                    isRec ? "text-white/60" : "text-muted-foreground"
                  }`}>{plan.name}</span>
                  <span className={`text-base font-bold tabular-nums ${
                    isRec ? "text-white" : "text-foreground/40"
                  }`}>{plan.price}<span className={`text-xs font-normal ml-0.5 ${
                    isRec ? "text-white/50" : "text-muted-foreground/40"
                  }`}>{plan.period}</span></span>
                </div>
              );
            })}
          </div>
          <Link
            to="/register"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mt-1"
          >
            Start free trial with {recommendedPlan.name} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
