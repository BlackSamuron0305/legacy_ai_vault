import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Free",
    price: "€0",
    period: "",
    desc: "Try LegacyAI risk-free. No credit card required.",
    features: [
      "3 capture sessions total",
      "1 team seat",
      "AI voice interviews",
      "Human-in-the-loop review",
      "Basic knowledge export",
    ],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    name: "Starter",
    price: "€299",
    period: "/month",
    desc: "For teams starting their knowledge preservation journey.",
    features: [
      "Up to 50 employees",
      "Unlimited interviews",
      "AI voice interviews",
      "Human-in-the-loop review",
      "Structured knowledge export",
      "Semantic search",
      "Email support",
    ],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Business",
    price: "€699",
    period: "/month",
    desc: "For scaling companies with regular employee transitions.",
    features: [
      "Up to 250 employees",
      "Unlimited interviews",
      "Everything in Starter",
      "CRM & ERP integration",
      "Coverage analytics dashboard",
      "Slack + Notion integration",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "€1,999",
    period: "/month+",
    desc: "For large organizations with complex knowledge management needs.",
    features: [
      "Unlimited employees",
      "Unlimited interviews",
      "Everything in Business",
      "Custom SSO & SAML",
      "On-premise deployment option",
      "Dedicated success manager",
      "SLA guarantee",
      "Custom RAG export pipeline",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

const gradients = ['pricing-card-gradient-1', 'pricing-card-gradient-3', 'pricing-card-gradient-2'];
const [freePlan, ...paidPlans] = plans;

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="grain absolute inset-0" />
        <div className="glow-blob animate-float-slow absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-200/30" />
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

      <section className="relative z-10 pt-24 pb-16 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-5xl font-semibold tracking-tight">Simple, transparent pricing.</h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">Start with a 14-day free trial on any plan. No credit card required.</p>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 pb-24">
        <div className="max-w-5xl mx-auto px-6 space-y-6">

          {/* Free banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="group relative rounded-2xl overflow-hidden border border-border shadow-card cursor-default select-none"
          >
            <div className="absolute inset-0 bg-white transition-opacity duration-500 group-hover:opacity-0" />
            <div className="absolute inset-0 pricing-card-gradient-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative z-10 px-8 py-7 flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-white/60 transition-colors duration-500">Free — Introduction</p>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-4xl font-bold text-foreground group-hover:text-white transition-colors duration-500">€0</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground group-hover:text-white/70 transition-colors duration-500">Try LegacyAI risk-free. No credit card required.</p>
              </div>
              <ul className="flex flex-wrap gap-x-8 gap-y-2 flex-1">
                {freePlan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 flex-shrink-0 text-foreground group-hover:text-white/80 transition-colors duration-500" />
                    <span className="text-muted-foreground group-hover:text-white/80 transition-colors duration-500">{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="dark" size="lg" className="shrink-0 group-hover:bg-white group-hover:text-foreground transition-colors duration-500">
                <Link to="/register">Get Started Free <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </div>
          </motion.div>

          {/* Paid plans */}
          <div className="grid md:grid-cols-3 gap-5 items-stretch">
            {paidPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group relative rounded-2xl overflow-hidden border border-border shadow-card cursor-default select-none h-full"
              >
                {/* white base */}
                <div className="absolute inset-0 bg-white transition-opacity duration-500 group-hover:opacity-0" />
                {/* wild grain gradient on hover */}
                <div className={`absolute inset-0 ${gradients[i]} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />

                <div className="relative z-10 p-8 flex flex-col min-h-[520px]">
                  {plan.highlight && (
                    <span className="absolute top-4 right-4 text-xs font-semibold bg-foreground text-background px-2.5 py-1 rounded-full group-hover:bg-white group-hover:text-foreground transition-colors duration-500">
                      Most Popular
                    </span>
                  )}
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-white/60 transition-colors duration-500">{plan.name}</p>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="text-4xl font-bold text-foreground group-hover:text-white transition-colors duration-500">{plan.price}</span>
                    {plan.period && <span className="text-sm mb-1 text-muted-foreground group-hover:text-white/60 transition-colors duration-500">{plan.period}</span>}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground group-hover:text-white/70 transition-colors duration-500">{plan.desc}</p>
                  <ul className="mt-6 space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-foreground group-hover:text-white/80 transition-colors duration-500" />
                        <span className="text-muted-foreground group-hover:text-white/80 transition-colors duration-500">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="mt-8 w-full group-hover:bg-white group-hover:text-foreground transition-colors duration-500"
                    variant="dark"
                    size="lg"
                  >
                    <Link to={plan.name === 'Enterprise' ? '/register' : '/register'}>
                      {plan.cta} {<ArrowRight className="w-4 h-4" />}
                    </Link>
                  </Button>
                </div>
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
