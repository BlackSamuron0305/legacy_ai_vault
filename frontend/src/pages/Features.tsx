import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, FileCheck, BookOpen, Upload, Shield, Users, BarChart3, Search, Zap, Globe } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Mic, title: "Voice-First Interviews", desc: "Natural conversation flow with AI-driven follow-up questions that probe for hidden knowledge. No forms, no effort from departing employees — just a conversation." },
  { icon: Shield, title: "Human-in-the-Loop", desc: "Every transcript goes through a human review and approval gate before processing. You control what gets captured and how it's categorized." },
  { icon: BookOpen, title: "Structured Categories", desc: "Knowledge automatically organized into workflows, stakeholders, systems, risks, SOPs, and more — ready to search and share." },
  { icon: BarChart3, title: "Coverage Analytics", desc: "Track knowledge capture progress across departments and identify critical gaps before they become expensive problems." },
  { icon: Users, title: "Team Management", desc: "Assign reviewers, track departing employees, and manage capture workflows at scale. Role-based access for HR, managers, and reviewers." },
  { icon: Upload, title: "RAG-Ready Export", desc: "Export structured knowledge directly into your Notion, Confluence, or AI assistant systems. JSON, Markdown, or webhook — your choice." },
  { icon: Search, title: "Semantic Search", desc: "Ask questions in plain language and surface the right knowledge instantly. Powered by vector embeddings for high-precision retrieval." },
  { icon: Zap, title: "Instant Setup", desc: "Invite an employee, start an interview. No lengthy onboarding or configuration. First capture session live in under 5 minutes." },
  { icon: Globe, title: "Multi-Language Support", desc: "Interviews and extraction in 20+ languages. Knowledge is preserved regardless of where your teams are located." },
];

export default function Features() {
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-white/70 backdrop-blur-sm text-sm font-medium mb-6 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/60" />
              Product Features
            </div>
            <h1 className="text-5xl font-semibold tracking-tight leading-[1.1]">Everything you need to preserve institutional knowledge.</h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">Built for enterprises facing knowledge loss from employee transitions. Every feature designed to make capture effortless and retrieval instant.</p>
            <Button size="xl" variant="dark" className="mt-8" asChild>
              <Link to="/register">Start Free Trial <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="bg-white rounded-2xl border border-border p-6 shadow-card hover:shadow-elevated transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center text-background mb-4">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
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
