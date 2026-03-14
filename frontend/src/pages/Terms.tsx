import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing or using LegacyAI ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.

These Terms constitute a legally binding agreement between you and LegacyAI GmbH ("Company", "we", "us", or "our"). If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization to these Terms.`,
  },
  {
    title: "2. Use of the Service",
    content: `You may use LegacyAI only for lawful purposes and in accordance with these Terms. You agree not to:

- Use the Service in any way that violates applicable laws or regulations
- Upload or transmit content that infringes intellectual property rights of others
- Attempt to gain unauthorized access to any portion of the Service
- Use the Service to conduct interviews without the knowledge and consent of the interviewee
- Reverse engineer, decompile, or disassemble any part of the Service
- Use automated means to access the Service beyond what our official API permits`,
  },
  {
    title: "3. Your Content",
    content: `You retain ownership of all content you upload or generate through LegacyAI, including interview transcripts and extracted knowledge ("Your Content").

By using the Service, you grant LegacyAI a limited, non-exclusive license to process Your Content solely to provide the Service. We do not claim ownership of Your Content and will not use it to train AI models without your explicit written consent.

You are responsible for ensuring that you have obtained all necessary consents from individuals whose information is captured through the Service.`,
  },
  {
    title: "4. Subscriptions & Payment",
    content: `Paid features of the Service are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law or as explicitly stated in these Terms.

If your payment fails, we will notify you and provide a 7-day grace period before suspending access. Downgrading your plan takes effect at the next billing cycle. Upgrading takes effect immediately with prorated billing.`,
  },
  {
    title: "5. Confidentiality",
    content: `Both parties agree to maintain the confidentiality of proprietary information shared in connection with the Service. LegacyAI will treat Your Content as confidential and will not disclose it to third parties except as required to provide the Service or as required by law.`,
  },
  {
    title: "6. Disclaimers & Limitation of Liability",
    content: `THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, LEGACYAI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.

Our total liability to you for any claim arising from these Terms or your use of the Service shall not exceed the amounts paid by you to LegacyAI in the 12 months preceding the claim.`,
  },
  {
    title: "7. Termination",
    content: `Either party may terminate this agreement at any time. Upon termination, your access to the Service will cease. You may export Your Content before termination. LegacyAI will retain Your Content for 30 days after termination, after which it will be permanently deleted.

We may suspend or terminate your account immediately if you violate these Terms or if we reasonably believe your use of the Service poses a legal or security risk.`,
  },
  {
    title: "8. Governing Law",
    content: `These Terms are governed by the laws of Germany, without regard to its conflict of laws principles. Any disputes arising from these Terms shall be resolved in the courts of Berlin, Germany, and you consent to exclusive jurisdiction and venue in such courts.`,
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="grain absolute inset-0" />
        <div className="glow-blob absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-200/20" />
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

      <section className="relative z-10 pt-20 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl font-semibold tracking-tight">Terms of Service</h1>
            <p className="mt-3 text-sm text-muted-foreground">Last updated: March 1, 2026. Effective: March 1, 2026.</p>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Please read these Terms of Service carefully before using LegacyAI. By using the Service you agree to these Terms.
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
                <div className="mt-3 text-muted-foreground leading-relaxed text-sm">
                  {section.content.split("\n").map((line, j) => {
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
            Questions about these Terms? Email us at{" "}
            <a href="mailto:legal@legacyai.com" className="text-foreground underline underline-offset-2">legal@legacyai.com</a>
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
