import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const team = [
  { name: "Marcus Weber", role: "Co-Founder & CEO", bio: "Former Director of Engineering at a Fortune 500. Saw first-hand how critical knowledge walks out the door when senior engineers leave." },
  { name: "Sarah Kim", role: "Co-Founder & CTO", bio: "ML researcher turned builder. Spent 6 years working on large language models at a leading AI research lab." },
  { name: "Thomas Reiner", role: "Head of Product", bio: "Previously led product at two enterprise SaaS companies through Series A and B. Obsessed with making complex workflows feel simple." },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="grain absolute inset-0" />
        <div className="glow-blob animate-float-slow absolute -top-24 left-1/3 w-[500px] h-[400px] bg-blue-200/30" />
        <div className="glow-blob animate-float-slower absolute bottom-0 right-0 w-[400px] h-[350px] bg-violet-200/20" />
      </div>

      <header className="relative z-50 border-b border-border/60 bg-background/90 backdrop-blur-sm sticky top-0">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo-icon.svg" alt="LegacyAI" className="h-8 w-8 shrink-0 dark:invert" />
            <span className="text-sm font-semibold text-foreground">Legacy AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link to="/login">Sign In</Link></Button>
            <Button size="sm" variant="dark" asChild><Link to="/register">Get Started</Link></Button>
          </div>
        </div>
      </header>

      <section className="relative z-10 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl">
            <h1 className="text-5xl font-semibold tracking-tight leading-[1.1]">We're solving the invisible problem of knowledge loss.</h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              LegacyAI was founded in 2024 after watching critical infrastructure knowledge disappear with a single engineer's resignation. What took months to rebuild could have been captured in 90 minutes.
            </p>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              We believe that the expertise people build over years of work belongs to the organizations that helped them build it — and it shouldn't evaporate when they move on.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="rounded-2xl bg-foreground text-background p-10 md:p-16 grid md:grid-cols-3 gap-10">
            {[
              { stat: "2024", label: "Founded" },
              { stat: "500+", label: "Knowledge sessions captured" },
              { stat: "40+", label: "Enterprise customers" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-5xl font-bold">{s.stat}</p>
                <p className="mt-2 text-background/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-semibold tracking-tight">The team</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {team.map((m, i) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-border p-6 shadow-card"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-semibold text-foreground mb-4">
                  {m.name.split(" ").map(n => n[0]).join("")}
                </div>
                <h3 className="font-semibold text-foreground">{m.name}</h3>
                <p className="text-sm text-muted-foreground font-medium mt-0.5">{m.role}</p>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{m.bio}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <Button size="xl" variant="dark" asChild>
              <Link to="/register">Join Us — Try LegacyAI <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border py-8 bg-muted/30 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center text-sm text-muted-foreground">
          <span>© 2026 LegacyAI</span>
          <Link to="/" className="hover:text-foreground transition-colors">← Back to Home</Link>
        </div>
      </footer>
    </div>
  );
}
