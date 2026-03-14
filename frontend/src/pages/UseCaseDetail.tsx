import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { PublicHeader } from "@/components/layout/PublicHeader";

const useCases: Record<string, { title: string; image: string; subtitle: string; description: string; benefits: string[] }> = {
  "engineering-handover": {
    title: "Engineering Handover",
    image: "/usecase-engineering.png",
    subtitle: "Preserve infrastructure knowledge before engineers move on.",
    description: "When senior engineers leave, they take years of undocumented system architecture decisions, deployment quirks, incident playbooks, and tribal knowledge with them. LegacyAI conducts deep AI-powered interviews that surface hidden operational knowledge — from why certain config values exist to how to handle edge-case failures.",
    benefits: [
      "Capture deployment procedures and rollback strategies",
      "Document undocumented system behaviors and workarounds",
      "Preserve incident response playbooks and escalation paths",
      "Extract infrastructure architecture decisions and rationale",
    ],
  },
  "operations-offboarding": {
    title: "Operations Offboarding",
    image: "/use-case-operations.png",
    subtitle: "Don't lose vendor relationships and compliance workflows.",
    description: "Operations teams hold critical knowledge about vendor contracts, procurement exceptions, compliance workarounds, and process optimizations that rarely make it into documentation. LegacyAI ensures this operational intelligence is captured, structured, and preserved for the next person.",
    benefits: [
      "Document vendor relationships and key contacts",
      "Capture procurement processes and exception handling",
      "Preserve compliance workflows and audit procedures",
      "Extract operational optimizations and cost-saving strategies",
    ],
  },
  "customer-success-transfer": {
    title: "Customer Success Transfer",
    image: "/usecase-customer-success.png",
    subtitle: "Keep client relationships strong through transitions.",
    description: "Customer success managers build deep relationships and context over months or years. When they leave, account histories, escalation patterns, renewal strategies, and stakeholder dynamics are at risk. LegacyAI captures this relationship intelligence so transitions feel seamless to your clients.",
    benefits: [
      "Preserve detailed account histories and context",
      "Document escalation patterns and resolution strategies",
      "Capture renewal and upsell intelligence",
      "Extract key stakeholder relationships and communication preferences",
    ],
  },
  "executive-transition": {
    title: "Executive Transition",
    image: "/usecase-executive.png",
    subtitle: "Preserve strategic context and institutional vision.",
    description: "Executives carry strategic context that shaped the organization — why certain partnerships were formed, how past crises were navigated, and what long-term vision guided decisions. LegacyAI captures this high-level institutional memory to ensure strategic continuity.",
    benefits: [
      "Capture strategic decision rationale and context",
      "Document organizational relationship dynamics",
      "Preserve historical crisis management approaches",
      "Extract long-term vision and strategic priorities",
    ],
  },
};

export default function UseCaseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const useCase = slug ? useCases[slug] : null;

  if (!useCase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Use case not found</h1>
          <Button asChild className="mt-4"><Link to="/#use-cases">Back to Use Cases</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-clip">
      {/* Blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="grain absolute inset-0" />
        <div className="glow-blob animate-float-slow absolute -top-24 right-1/4 w-[500px] h-[500px] bg-blue-200/30" />
        <div className="glow-blob animate-float-slower absolute bottom-20 left-0 w-[400px] h-[400px] bg-violet-200/20" />
        <div className="glow-blob absolute top-1/2 right-0 w-[320px] h-[320px] bg-indigo-200/20" />
      </div>

      <PublicHeader />

      <section className="relative z-10 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">{useCase.title}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{useCase.subtitle}</p>
          </motion.div>

          <motion.div
            className="mt-12 rounded-2xl overflow-hidden border border-border/50 shadow-elevated relative"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <img src={useCase.image} alt={useCase.title} className="w-full h-64 md:h-96 object-cover" />
          </motion.div>

          <motion.div
            className="mt-12 grid md:grid-cols-2 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white rounded-2xl border border-border p-8 shadow-card">
              <h2 className="text-2xl font-semibold text-foreground">The Challenge</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">{useCase.description}</p>
            </div>
            <div className="bg-white rounded-2xl border border-border p-8 shadow-card">
              <h2 className="text-2xl font-semibold text-foreground">What LegacyAI Captures</h2>
              <ul className="mt-4 space-y-3">
                {useCase.benefits.map((b) => (
                  <li key={b} className="flex gap-3 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button size="xl" variant="dark" asChild>
              <Link to="/register">Get Started Free <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
