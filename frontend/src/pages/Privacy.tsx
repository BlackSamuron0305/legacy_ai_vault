import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { PublicHeader } from "@/components/layout/PublicHeader";

const sections = [
  {
    title: "1. Information We Collect",
    content: `We collect information you provide directly to us, such as when you create an account, start a knowledge capture session, or contact us for support.

**Account Information:** Name, email address, company name, and password when you register.

**Session Data:** Voice recordings, transcripts, and structured knowledge extracted during capture sessions. This data belongs to your organization and is processed solely to provide the service.

**Usage Data:** Information about how you interact with LegacyAI, including pages visited, features used, and session durations. This helps us improve the product.

**Payment Information:** Billing details processed securely through our payment provider (Stripe). We never store raw card numbers.`,
  },
  {
    title: "2. How We Use Your Information",
    content: `We use the information we collect to operate, maintain, and improve LegacyAI. Specifically:

- Provide, personalize, and improve our services
- Process transactions and send related information
- Send technical notices, updates, and security alerts
- Respond to your comments, questions, and support requests
- Monitor and analyze usage patterns to improve user experience

We do not sell your personal information to third parties. We do not use your knowledge session data to train AI models without explicit written consent.`,
  },
  {
    title: "3. Data Storage & Security",
    content: `All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Voice recordings are processed and then deleted within 30 days unless you explicitly choose to retain them. Transcripts and structured knowledge are retained until you delete them or close your account.

We store data in SOC 2 Type II certified data centers. Enterprise customers may choose their data region (EU, US, APAC).`,
  },
  {
    title: "4. Your Rights",
    content: `Depending on your location, you may have the right to:

- **Access:** Request a copy of the personal data we hold about you
- **Correction:** Request correction of inaccurate personal data
- **Deletion:** Request deletion of your personal data (right to be forgotten)
- **Portability:** Request a machine-readable copy of your data
- **Objection:** Object to processing of your personal data

To exercise any of these rights, contact us at privacy@legacyai.com. We will respond within 30 days.`,
  },
  {
    title: "5. Cookies",
    content: `We use cookies and similar technologies to operate our service, remember your preferences, and understand how you use LegacyAI. You can control cookie settings through your browser.

We do not use third-party advertising cookies. Analytics are handled by privacy-respecting tools that do not share your data with ad networks.`,
  },
  {
    title: "6. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of material changes by email or through a notice on our website at least 14 days before the change takes effect. Your continued use of LegacyAI after the effective date constitutes acceptance of the updated policy.`,
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background overflow-x-clip">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="grain absolute inset-0" />
        <div className="glow-blob absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-200/20" />
      </div>

      <PublicHeader />

      <section className="relative z-10 pt-20 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl font-semibold tracking-tight">Privacy Policy</h1>
            <p className="mt-3 text-sm text-muted-foreground">Last updated: March 1, 2026</p>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              LegacyAI ("we", "our", or "us") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and share information about you when you use our services.
            </p>
          </motion.div>

          <div className="mt-10 space-y-10">
            {sections.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
                <div className="mt-3 text-muted-foreground leading-relaxed text-sm whitespace-pre-line">
                  {section.content.split("\n").map((line, j) => {
                    if (line.startsWith("**") && line.endsWith("**")) {
                      return <p key={j} className="font-semibold text-foreground mt-3">{line.replace(/\*\*/g, "")}</p>;
                    }
                    if (line.startsWith("- **")) {
                      const [bold, rest] = line.slice(2).split(":** ");
                      return <p key={j} className="mt-1.5">• <strong className="text-foreground">{bold.replace(/\*\*/g, "")}</strong>: {rest}</p>;
                    }
                    if (line.startsWith("- ")) {
                      return <p key={j} className="mt-1">• {line.slice(2)}</p>;
                    }
                    return line ? <p key={j} className="mt-2">{line}</p> : <div key={j} className="h-1" />;
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-border text-sm text-muted-foreground">
            Questions about this policy? Email us at{" "}
            <a href="mailto:privacy@legacyai.com" className="text-foreground underline underline-offset-2">privacy@legacyai.com</a>
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
