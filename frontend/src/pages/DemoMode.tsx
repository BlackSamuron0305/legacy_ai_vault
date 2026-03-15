import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { motion } from "framer-motion";
import { ArrowRight, Mic, User, Briefcase, Building2, LogOut, UserPlus } from "lucide-react";

const scenarios = [
  {
    id: "offboarding",
    label: "Offboarding",
    description: "Wissen sichern bevor ein Mitarbeiter das Unternehmen verlässt.",
    Icon: LogOut,
  },
  {
    id: "onboarding",
    label: "Onboarding",
    description: "Einen neuen Mitarbeiter begrüßen und einführen.",
    Icon: UserPlus,
  },
];

const personas = [
  { id: "engineer", role: "Senior Engineer", department: "Engineering", tenure: "8 Jahre" },
  { id: "cs-lead", role: "Customer Success Lead", department: "Customer Success", tenure: "4 Jahre" },
  { id: "ops-manager", role: "VP of Operations", department: "Operations", tenure: "6 Jahre" },
  { id: "cto", role: "CTO / Founder", department: "Executive", tenure: "10 Jahre" },
];

export default function DemoMode() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [scenario, setScenario] = useState("offboarding");
  const [persona, setPersona] = useState("engineer");

  const selectedPersona = personas.find((p) => p.id === persona)!;

  const handleStart = () => {
    if (!name.trim()) return;
    const params = new URLSearchParams({
      name: name.trim(),
      scenario,
      role: selectedPersona.role,
      department: selectedPersona.department,
    });
    navigate(`/demo/session?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="grain absolute inset-0" />
          <div className="glow-blob animate-float-slow absolute -top-24 left-1/3 w-[560px] h-[480px] bg-blue-300/30" />
          <div className="glow-blob animate-float-slower absolute top-10 right-0 w-[420px] h-[400px] bg-violet-300/20" />
        </div>

        <div className="relative max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-white/70 backdrop-blur-sm text-foreground text-sm font-medium mb-6 shadow-sm">
              <Mic className="w-3.5 h-3.5" />
              Live Demo — KI-Interview testen
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.1]">
              Erlebe LegacyAI<br />in Aktion.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Gib deinen Namen ein, wähle ein Szenario und eine Rolle — unser KI-Interviewer begrüßt dich persönlich in einer kurzen Demo.
            </p>
          </motion.div>

          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="bg-white/80 backdrop-blur-sm border border-border rounded-2xl shadow-elevated p-8 space-y-8"
          >
            {/* Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Dein Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Max Mustermann"
                className="w-full h-12 px-4 rounded-xl border border-border bg-white text-foreground text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 transition-all"
                maxLength={60}
                autoFocus
              />
            </div>

            {/* Scenario */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                Szenario
              </label>
              <div className="grid grid-cols-2 gap-3">
                {scenarios.map((s) => {
                  const active = scenario === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setScenario(s.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        active
                          ? "bg-foreground text-background border-foreground"
                          : "bg-white border-border hover:border-foreground/30"
                      }`}
                    >
                      <s.Icon className={`w-5 h-5 mb-2.5 ${
                        active ? "text-background/70" : "text-muted-foreground"
                      }`} />
                      <div className={`font-semibold text-sm ${active ? "text-background" : "text-foreground"}`}>{s.label}</div>
                      <div className={`text-xs mt-1 leading-relaxed ${active ? "text-background/60" : "text-muted-foreground"}`}>{s.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Persona / Role */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Rolle & Hintergrund
              </label>
              <div className="grid grid-cols-2 gap-2">
                {personas.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPersona(p.id)}
                    className={`px-4 py-3 rounded-xl border text-left transition-all ${
                      persona === p.id
                        ? "bg-foreground/[0.04] border-foreground/30 ring-2 ring-foreground/10"
                        : "bg-white border-border hover:border-foreground/20"
                    }`}
                  >
                    <div className="font-medium text-sm text-foreground">{p.role}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{p.department} · {p.tenure}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <Button
              size="xl"
              variant="dark"
              className="w-full"
              onClick={handleStart}
              disabled={!name.trim()}
            >
              Demo starten <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Keine Anmeldung nötig. Der KI-Bot spricht ca. 5 Sekunden mit dir.
          </p>
        </div>
      </section>
    </div>
  );
}