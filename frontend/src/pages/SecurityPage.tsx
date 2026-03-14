import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Shield, Eye, Server, FileCheck, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const pillars = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    desc: "All data in transit is encrypted with TLS 1.3. Data at rest is encrypted with AES-256. Encryption keys are managed by your organization.",
  },
  {
    icon: Shield,
    title: "SOC 2 Type II",
    desc: "LegacyAI is SOC 2 Type II certified. Our security controls are independently audited annually to ensure they meet the highest standards.",
  },
  {
    icon: Eye,
    title: "Zero Knowledge Design",
    desc: "Our AI processes transcripts without storing raw audio. Sensitive terms can be redacted automatically before the review stage.",
  },
  {
    icon: Server,
    title: "Data Residency",
    desc: "Choose where your data lives — EU, US, or APAC. Enterprise customers can request on-premise deployment for full data sovereignty.",
  },
  {
    icon: FileCheck,
    title: "GDPR & CCPA Compliant",
    desc: "Built for global compliance from day one. Data subject access requests, deletion rights, and consent management are fully supported.",
  },
  {
    icon: RefreshCw,
    title: "99.9% Uptime SLA",
    desc: "Redundant infrastructure across multiple availability zones. Real-time status at status.legacyai.com. Enterprise SLAs available.",
  },
];

export default function Security() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="grain absolute inset-0" />
        <div className="glow-blob animate-float-slow absolute top-0 right-0 w-[500px] h-[400px] bg-blue-200/25" />
        <div className="glow-blob animate-float-slower absolute bottom-0 left-1/4 w-[400px] h-[350px] bg-indigo-200/20" />
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
              <Shield className="w-3.5 h-3.5" />
              Enterprise-Grade Security
            </div>
            <h1 className="text-5xl font-semibold tracking-tight leading-[1.1]">Your knowledge is too valuable to risk.</h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">We built LegacyAI with enterprise security requirements in mind from day one. Every architectural decision prioritizes the protection of your most sensitive institutional knowledge.</p>
            <Button size="xl" variant="dark" className="mt-8" asChild>
              <Link to="/register">Start Secure Trial <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-5">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-white rounded-2xl border border-border p-6 shadow-card hover:shadow-elevated transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center text-background mb-4">
                  <p.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-10 rounded-2xl bg-foreground text-background p-10 text-center"
          >
            <h2 className="text-2xl font-semibold">Have specific security requirements?</h2>
            <p className="mt-3 text-background/70 max-w-lg mx-auto">Our security team is happy to share our full security documentation, penetration test results, and answer any compliance questions.</p>
            <Button variant="outline" size="lg" className="mt-6" asChild>
              <Link to="/register">Contact Security Team</Link>
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
