import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, BookOpen, Upload, Shield, Users, BarChart3, Search, Zap, Globe } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { PublicHeader } from "@/components/layout/PublicHeader";

type FeatureStyle = "gradient-blue" | "dark" | "gradient-orange" | "tint-blue" | "tint-violet" | "accent-border" | "numbered" | "default";

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
  span?: 2;
  style: FeatureStyle;
  num?: string;
}

const features: Feature[] = [
  {
    icon: Mic,
    title: "Voice-First Interviews",
    desc: "Natural conversation flow with AI-driven follow-up questions that probe for hidden knowledge. No forms, no effort from departing employees — just a conversation.",
    span: 2,
    style: "gradient-blue",
  },
  {
    icon: Shield,
    title: "Human-in-the-Loop",
    desc: "Every transcript goes through a human review gate before processing. You control what gets captured and how it's categorized.",
    style: "numbered",
    num: "01",
  },
  {
    icon: BookOpen,
    title: "Structured Categories",
    desc: "Knowledge organized into workflows, stakeholders, systems, risks, and SOPs — ready to search and share.",
    style: "default",
  },
  {
    icon: BarChart3,
    title: "Coverage Analytics",
    desc: "Track knowledge capture across departments. Identify critical gaps before they become expensive problems.",
    span: 2,
    style: "dark",
  },
  {
    icon: Users,
    title: "Team Management",
    desc: "Assign reviewers, track departing employees, and manage workflows at scale with role-based access.",
    style: "tint-blue",
  },
  {
    icon: Upload,
    title: "RAG-Ready Export",
    desc: "Push to Notion, Confluence, or your AI assistant. JSON, Markdown, or webhook — your choice.",
    style: "accent-border",
  },
  {
    icon: Search,
    title: "Semantic Search",
    desc: "Ask in plain language and surface the right knowledge instantly. Vector-powered, high-precision retrieval.",
    style: "tint-violet",
  },
  {
    icon: Zap,
    title: "Instant Setup",
    desc: "Invite an employee, start an interview. First capture session live in under 5 minutes — no config needed.",
    span: 2,
    style: "gradient-orange",
  },
  {
    icon: Globe,
    title: "Multi-Language",
    desc: "Interviews and extraction in 20+ languages. Knowledge preserved regardless of where your teams are.",
    style: "default",
  },
];

export default function Features() {
  return (
    <div className="min-h-screen bg-background overflow-x-clip">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="grain absolute inset-0" />
        <div className="glow-blob animate-float-slow absolute -top-24 left-1/3 w-[500px] h-[400px] bg-blue-200/30" />
        <div className="glow-blob animate-float-slower absolute bottom-0 right-0 w-[400px] h-[350px] bg-violet-200/20" />
      </div>

      <PublicHeader />

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
            {features.map((f, i) => {
              const isDark = f.style === "gradient-blue" || f.style === "dark" || f.style === "gradient-orange";
              const bgClass: Record<FeatureStyle, string> = {
                "gradient-blue": "bg-gradient-to-br from-blue-600 to-violet-700",
                "dark": "bg-zinc-900",
                "gradient-orange": "bg-gradient-to-br from-orange-500 to-rose-600",
                "tint-blue": "bg-blue-50/70 border-blue-100",
                "tint-violet": "bg-violet-50/70 border-violet-100",
                "accent-border": "bg-white border-l-[3px] border-l-violet-500",
                "numbered": "bg-white overflow-hidden",
                "default": "bg-white",
              };
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className={`rounded-2xl border border-border p-6 shadow-card relative${
                    f.span === 2 ? " md:col-span-2" : ""
                  } ${bgClass[f.style]}`}
                >
                  {f.style === "numbered" && (
                    <span className="absolute top-2 right-4 text-8xl font-bold text-foreground/[0.04] select-none leading-none pointer-events-none">
                      {f.num}
                    </span>
                  )}
                  {f.span === 2 && isDark && (
                    <div className="absolute bottom-4 right-5 opacity-[0.06] pointer-events-none">
                      <f.icon className="w-28 h-28" />
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                    isDark ? "bg-white/20 text-white" : "bg-foreground text-background"
                  }`}>
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h3 className={`font-semibold text-base ${
                    isDark ? "text-white" : "text-foreground"
                  }`}>{f.title}</h3>
                  <p className={`mt-2 text-sm leading-relaxed ${
                    isDark ? "text-white/70" : "text-muted-foreground"
                  }`}>{f.desc}</p>
                </motion.div>
              );
            })}
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
