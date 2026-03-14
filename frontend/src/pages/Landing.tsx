import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight, Mic, FileCheck, BookOpen, Upload, CheckCircle2, Shield, Users, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">LegacyAI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#use-cases" className="hover:text-foreground transition-colors">Use Cases</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link to="/login">Sign In</Link></Button>
            <Button size="sm" asChild><Link to="/register">Get Started</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div className="max-w-3xl" {...fadeUp}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Brain className="w-3.5 h-3.5" />
              AI-Powered Knowledge Preservation
            </div>
            <h1 className="text-5xl md:text-6xl font-medium tracking-tight text-foreground leading-[1.1]">
              Institutional memory shouldn't leave when they do.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
              LegacyAI captures critical organizational knowledge through AI-powered voice interviews before employees leave. From spoken expertise to structured, searchable company memory.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="xl" variant="hero" asChild>
                <Link to="/register">Start Capturing Knowledge <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button size="xl" variant="hero-outline" asChild>
                <Link to="/app/demo">See Demo</Link>
              </Button>
            </div>
          </motion.div>

          {/* Visual */}
          <motion.div 
            className="mt-16 rounded-2xl border border-border bg-card shadow-elevated overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="bg-muted/50 px-4 py-2 border-b border-border flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-border" />
                <div className="w-3 h-3 rounded-full bg-border" />
                <div className="w-3 h-3 rounded-full bg-border" />
              </div>
              <span className="text-xs text-muted-foreground ml-2">LegacyAI — Knowledge Capture Session</span>
            </div>
            <div className="p-8 grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">LegacyAI</span>
                </div>
                <p className="text-foreground leading-relaxed">
                  "You mentioned the 'Nightly Batch' often fails on Tuesdays. Can you walk me through the manual restart process and who needs to be notified?"
                </p>
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground italic">Sarah is speaking...</p>
                  <p className="text-sm text-foreground/70 mt-2">
                    "Right, so the Tuesday failure is usually due to the upstream vendor sync. You have to SSH into the production-jump box, then run the restart_sync.sh script..."
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detected Topics</p>
                {['Infrastructure', 'Vendor: Upstream', 'Manual Workarounds'].map((t, i) => (
                  <div key={t} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm flex items-center justify-between">
                    <span className="text-foreground">{t}</span>
                    <span className="text-xs text-muted-foreground">{98 - i * 6}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight">The knowledge problem is real.</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              When experienced employees leave, they take years of undocumented processes, vendor relationships, incident playbooks, and critical context with them. Traditional exit interviews capture a fraction. The rest disappears.
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { stat: '70%', label: 'of organizational knowledge is undocumented' },
              { stat: '42%', label: 'of institutional expertise is held by individuals' },
              { stat: '6 months', label: 'average time to recover lost knowledge' },
            ].map((item) => (
              <div key={item.label} className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <p className="text-3xl font-semibold text-primary">{item.stat}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-semibold tracking-tight">From spoken expertise to structured knowledge.</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl">Four steps to preserve institutional memory. Every step includes human oversight.</p>
          <div className="mt-12 grid md:grid-cols-4 gap-6">
            {[
              { step: '01', icon: Mic, title: 'Voice Interview', desc: 'AI guides structured conversations with departing employees, asking smart follow-up questions.' },
              { step: '02', icon: FileCheck, title: 'Transcript Review', desc: 'Human reviewers verify, edit, and approve the captured transcript before any processing.' },
              { step: '03', icon: BookOpen, title: 'Knowledge Extraction', desc: 'Approved transcripts are cleaned, categorized, and structured into searchable knowledge blocks.' },
              { step: '04', icon: Upload, title: 'Export & Integrate', desc: 'Finalized knowledge exports to your documentation, knowledge base, or RAG-powered assistant.' },
            ].map((item) => (
              <div key={item.step} className="relative">
                <span className="text-6xl font-bold text-muted/80 absolute -top-2 -left-1">{item.step}</span>
                <div className="pt-12">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Built for enterprise knowledge preservation.</h2>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { icon: Mic, title: 'Voice-First Interviews', desc: 'Natural conversation flow with AI-driven follow-up questions that probe for hidden knowledge.' },
              { icon: Shield, title: 'Human-in-the-Loop', desc: 'Transcript review and approval gates ensure accuracy before any knowledge processing begins.' },
              { icon: BookOpen, title: 'Structured Categories', desc: 'Knowledge automatically organized into workflows, stakeholders, systems, risks, and more.' },
              { icon: BarChart3, title: 'Coverage Analytics', desc: 'Track knowledge capture progress across departments and identify critical gaps.' },
              { icon: Users, title: 'Team Management', desc: 'Assign reviewers, track departing employees, and manage capture workflows at scale.' },
              { icon: Upload, title: 'RAG-Ready Export', desc: 'Export structured knowledge directly into your existing documentation or AI assistant systems.' },
            ].map((item) => (
              <div key={item.title} className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Designed for critical transitions.</h2>
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            {[
              { title: 'Engineering Handover', desc: 'Capture infrastructure knowledge, deployment procedures, incident playbooks, and undocumented system behaviors.' },
              { title: 'Operations Offboarding', desc: 'Preserve vendor relationships, procurement processes, compliance workflows, and operational exceptions.' },
              { title: 'Customer Success Transfer', desc: 'Document account histories, escalation patterns, renewal strategies, and key stakeholder relationships.' },
              { title: 'Executive Transition', desc: 'Capture strategic context, historical decisions, organizational relationships, and institutional vision.' },
            ].map((item) => (
              <div key={item.title} className="bg-card rounded-2xl border border-border p-6 shadow-card flex gap-4">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">The expertise stays. The person moves on.</h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            Start preserving institutional knowledge today. Set up in minutes.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="xl" variant="hero" asChild>
              <Link to="/register">Get Started Free <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <Brain className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <span className="font-semibold tracking-tight">LegacyAI</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">AI-powered institutional knowledge preservation.</p>
            </div>
            <div className="flex gap-12 text-sm text-muted-foreground">
              <div className="space-y-2">
                <p className="font-medium text-foreground">Product</p>
                <p className="hover:text-foreground cursor-pointer">Features</p>
                <p className="hover:text-foreground cursor-pointer">Pricing</p>
                <p className="hover:text-foreground cursor-pointer">Security</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-foreground">Company</p>
                <p className="hover:text-foreground cursor-pointer">About</p>
                <p className="hover:text-foreground cursor-pointer">Blog</p>
                <p className="hover:text-foreground cursor-pointer">Careers</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-foreground">Legal</p>
                <p className="hover:text-foreground cursor-pointer">Privacy</p>
                <p className="hover:text-foreground cursor-pointer">Terms</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-sm text-muted-foreground">
            © 2026 LegacyAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}