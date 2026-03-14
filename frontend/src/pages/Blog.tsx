import { Link } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, X, DollarSign, TrendingDown, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PublicHeader } from "@/components/layout/PublicHeader";

interface Post {
  tag: string;
  title: string;
  desc: string;
  date: string;
  readTime: string;
  slug: string;
  financialLoss: { label: string; value: string; note: string }[];
  fullContent: string[];
}

const posts: Post[] = [
  {
    tag: "Engineering",
    title: "The $2M Mistake: What Happens When Your Only DevOps Engineer Quits",
    desc: "A case study on how one mid-sized SaaS company lost 14 months of deployment automation knowledge in a single resignation — and how they recovered.",
    date: "March 10, 2026",
    readTime: "8 min read",
    slug: "devops-engineer-quit",
    financialLoss: [
      { label: "Direct Replacement Cost", value: "$180,000", note: "Recruiter fees + onboarding for a senior DevOps hire" },
      { label: "Productivity Loss (6 months)", value: "$420,000", note: "Estimated from delayed deployments and manual workarounds" },
      { label: "Incident Cost", value: "$340,000", note: "3 major outages caused by undocumented infra configs" },
      { label: "Total Estimated Loss", value: "$2,100,000+", note: "Over the 14-month recovery period" },
    ],
    fullContent: [
      "When Marcus, the sole DevOps engineer at a 120-person SaaS company, handed in his notice, he gave two weeks. He'd been there four years. His calendar was full of undocumented rituals — a Slack bot that pages the on-call team only if you say the right phrase, a Jenkins pipeline that silently skips tests unless a specific environment variable is set, a Terraform module that absolutely cannot be run twice without a manual state unlock.",
      "The engineering team didn't realize how bad it was until the first deployment post-Marcus. It took three senior engineers six hours to push a minor feature to staging. They were reading through 14 months of commit history, Slack threads, and half-finished Confluence pages.",
      "Three weeks in, a misconfigured auto-scaling rule caused a cascade failure during a marketing push. 4 hours of downtime. A Fortune 500 enterprise client filed a breach-of-SLA claim. Legal fees alone ran to $80,000.",
      "The real damage wasn't technical — it was trust. The CEO had to personally call their top 5 accounts. Two of them asked for contract renegotiations.",
      "The company eventually recovered, but it took $2.1M in direct and indirect costs to get back to baseline. They now use LegacyAI to capture every engineer's operational knowledge — not just the code, but the reasoning behind every architectural decision.",
      "The lesson: single points of human failure are just as catastrophic as single points of infrastructure failure. Your runbooks don't capture why a decision was made. Your new hire will make the same mistake your predecessor made in 2022 — unless that knowledge is captured before they leave.",
    ],
  },
  {
    tag: "Product",
    title: "Why Documentation Fails (And What You Should Do Instead)",
    desc: "Traditional documentation assumes people will write things down. They won't. We built LegacyAI around how knowledge actually works.",
    date: "February 28, 2026",
    readTime: "6 min read",
    slug: "why-documentation-fails",
    financialLoss: [
      { label: "Avg. Time Wasted on Knowledge Search", value: "$19,200/yr", note: "Per knowledge worker at $60/hr spending 8hrs/week searching" },
      { label: "Duplicate Work Due to Lost Context", value: "$34,000/yr", note: "Per team of 10, based on McKinsey data" },
      { label: "Onboarding Delays from Poor Docs", value: "$12,000/hire", note: "Productivity gap during extended onboarding" },
      { label: "Total Org-Wide Loss (100 employees)", value: "$2.7M/yr", note: "Conservative estimate across all knowledge worker functions" },
    ],
    fullContent: [
      "Every engineering leader has said it: 'We need better documentation.' And every engineering team has nodded, created a new Notion workspace, and gone back to Slack. Three months later, the Notion workspace has seven pages — four of which are drafts — and someone has left the company.",
      "Documentation fails because it's built on a broken assumption: that knowledge exists in isolation and can be transferred by writing it down. It can't. Knowledge is contextual, relational, and deeply tied to the person who holds it.",
      "A 2024 study by IDC found that knowledge workers spend 26% of their day searching for information they can't find. That's not a documentation quality problem. It's a documentation model problem.",
      "Traditional wikis capture what people want others to know. But the most valuable knowledge — the workarounds, the failure modes, the 'never deploy on Fridays because the CDN cache doesn't clear until Monday' — never gets written down because nobody thinks to write it down. It's just... known.",
      "LegacyAI approaches this differently. Instead of waiting for employees to document, we extract knowledge through structured AI-led interviews. The system asks the right questions based on the employee's role, tenure, and team context. The output isn't a wall of text — it's a queryable, connected knowledge graph.",
      "The result: companies using LegacyAI recover institutional knowledge that would otherwise leave with every resignation, retirement, or restructure. The ROI is measured in avoided incidents and faster onboarding — not in pages written.",
    ],
  },
  {
    tag: "Research",
    title: "The Hidden Cost of Employee Offboarding: A Data-Driven Analysis",
    desc: "We analyzed 200+ offboarding processes to quantify the true cost of knowledge loss. The numbers are worse than most leaders assume.",
    date: "February 14, 2026",
    readTime: "12 min read",
    slug: "hidden-cost-of-offboarding",
    financialLoss: [
      { label: "Average Cost per Departing Employee", value: "$47,000", note: "Across all seniority levels; rises to $213,000 for senior leaders" },
      { label: "Knowledge Loss Component", value: "38%", note: "Of total replacement cost is attributable to lost institutional knowledge" },
      { label: "Median Time to Productivity (New Hire)", value: "8.1 months", note: "Without structured knowledge transfer; 3.2 months with it" },
      { label: "Annual US Economy Loss", value: "$1.1 Trillion", note: "Estimated annual cost of employee turnover (Gallup, 2023)" },
    ],
    fullContent: [
      "Most CFOs can tell you the cost of recruiting and training a replacement employee. Very few can tell you what that employee will forget to tell their replacement before they leave.",
      "In our analysis of 200+ offboarding processes across 14 industries, we found a consistent pattern: companies dramatically underestimate the knowledge component of employee departure. The average offboarding checklist covers IT access revocation, benefits processing, and maybe a two-hour 'knowledge transfer meeting.' That's not enough.",
      "Senior engineers carry an average of 4.3 years of undocumented decisions in their heads. Customer success managers know the quirks of 30+ client relationships that no CRM captures. Finance leads hold the context for every budget negotiation for the past three years.",
      "Our data shows that for every dollar spent on visible replacement costs (recruiting, training, salary ramp-up), companies lose an additional $0.62 in invisible knowledge costs — slower decision-making, repeated mistakes, and degraded client relationships.",
      "The industries hardest hit: financial services ($89K average knowledge loss per departure), healthcare IT ($76K), and enterprise software ($68K). These are sectors where context depth directly determines outcome quality.",
      "The good news: the knowledge gap is recoverable. Companies that implement structured pre-departure knowledge capture reduce new-hire time-to-productivity by 60% and cut first-year incident rates by 43%. The investment is a fraction of the cost of letting that knowledge walk out the door.",
      "The methodology for this analysis involved structured exit interviews, successor performance tracking over 18 months, and incident attribution modeling to isolate knowledge-loss-driven failures from other performance variables.",
    ],
  },
  {
    tag: "How-To",
    title: "Running Your First AI Knowledge Capture Session: A Step-by-Step Guide",
    desc: "From scheduling the interview to publishing the knowledge base entry — everything you need to run a successful capture session with LegacyAI.",
    date: "January 30, 2026",
    readTime: "5 min read",
    slug: "first-knowledge-capture-session",
    financialLoss: [
      { label: "Cost of Skipping Capture (per role)", value: "$47,000+", note: "Average knowledge loss cost when no capture is performed" },
      { label: "Time Investment per Session", value: "~2 hours", note: "One structured AI interview captures 80%+ of critical knowledge" },
      { label: "ROI of First Session", value: "23x", note: "Based on average incident reduction and onboarding acceleration" },
      { label: "Payback Period", value: "< 30 days", note: "Typically realized within the first month post-hire" },
    ],
    fullContent: [
      "The most common question we get from new LegacyAI customers is: 'Where do we start?' The answer is always the same: start with whoever is most likely to leave next.",
      "Step 1 — Identify the priority employee. This could be someone planning retirement, a key engineer who's been job-hunting (LinkedIn activity is a signal), or simply the person whose departure would cause the most disruption. Run a knowledge risk assessment if you're unsure.",
      "Step 2 — Schedule the session. A standard LegacyAI capture session is 90 minutes. Block 2 hours to be safe. The employee doesn't need to prepare anything — the AI does the preparation based on their role profile and tenure data.",
      "Step 3 — Let the AI lead. Our interviewer AI asks open-ended questions tuned to the employee's specific domain. It probes for decision history, failure modes, client context, technical debt rationale, and team dynamics. The employee talks; the system structures.",
      "Step 4 — Review and enrich. After the session, you'll get a draft knowledge graph. Route it to relevant stakeholders for a 20-minute async review. They can flag gaps or add context. This step typically uncovers 15-20% additional knowledge that wasn't surfaced in the interview.",
      "Step 5 — Publish and connect. The final knowledge artifact gets linked to the employee's profile, their projects, and any related documents in your existing system. It's searchable immediately.",
      "The companies that get the most value from LegacyAI run capture sessions not just for departing employees, but quarterly for all senior staff. Knowledge degrades and evolves — a session from 18 months ago may be 40% stale. Treat knowledge capture like a maintenance task, not a one-time event.",
    ],
  },
  {
    tag: "Industry",
    title: "The Baby Boomer Brain Drain: 16.5 Million Experts Are Leaving the Workforce",
    desc: "By 2036, 30% of the most experienced workers in the US will have retired. Is your organization prepared for what they'll take with them?",
    date: "January 15, 2026",
    readTime: "7 min read",
    slug: "baby-boomer-brain-drain",
    financialLoss: [
      { label: "Knowledge Assets Leaving by 2036", value: "$8.9 Trillion", note: "Estimated value of institutional knowledge held by retiring Boomers (Deloitte)" },
      { label: "Average Tenure of Retiring Boomer", value: "22 years", note: "Compared to 4.1 years for Gen Z workforce entrants" },
      { label: "Industries Most at Risk", value: "Healthcare, Gov, Mfg", note: "Sectors with highest Boomer concentration and lowest knowledge capture" },
      { label: "Cost of Unmanaged Retirement Wave", value: "$680B+/yr", note: "US productivity loss attributable to unplanned senior exits (2025–2036)" },
    ],
    fullContent: [
      "Between 2024 and 2036, approximately 16.5 million Baby Boomers will retire from the US workforce. Many of them have been with their organizations for two or three decades. They know where the bodies are buried — metaphorically speaking.",
      "In manufacturing, a retiring floor supervisor might carry 20 years of machine calibration knowledge, supplier relationships, and institutional workarounds that keep production running. In healthcare, a senior nurse practitioner holds clinical judgment patterns that no training manual captures. In government, a department head holds the context for every policy decision made over a career.",
      "The problem isn't retirement itself — it's the pace and the lack of preparation. The Bureau of Labor Statistics projects that 10,000 Boomers will turn 65 every day through 2030. Organizations that planned on a 5-year runway suddenly have 18 months.",
      "The financial stakes are enormous. Deloitte's 2025 workforce study estimated that the total value of institutional knowledge held by retiring Boomers exceeds $8.9 trillion — and that less than 12% of it will be formally captured before departure.",
      "The generational knowledge gap compounds the problem. The incoming workforce — predominantly Millennials and Gen Z — has median tenure of under 4 years. They're not going to accumulate the same depth of institutional knowledge, and they're not going to stay long enough to pass it on the old way.",
      "The organizations that will navigate this transition successfully are those building systematic knowledge infrastructure now, before the wave hits. That means AI-assisted capture, structured offboarding, and knowledge graphs that outlast any individual employee.",
      "LegacyAI was built specifically for this moment. Our enterprise clients in healthcare and manufacturing are already running quarterly capture sessions for all employees over 55. It's not morbid — it's operational continuity.",
    ],
  },
  {
    tag: "Engineering",
    title: "How We Built a Vector Search Pipeline for Enterprise Knowledge Retrieval",
    desc: "A deep dive into the technical architecture behind LegacyAI's semantic search — from embeddings to hybrid retrieval at scale.",
    date: "December 20, 2025",
    readTime: "10 min read",
    slug: "vector-search-pipeline",
    financialLoss: [
      { label: "Cost of Poor Search in Enterprise", value: "$19,200/yr", note: "Per employee spending 8hrs/week on fruitless knowledge lookups" },
      { label: "Productivity Gain with Semantic Search", value: "34%", note: "Reduction in time-to-answer for cross-functional queries" },
      { label: "Support Ticket Deflection", value: "41%", note: "Of internal IT/HR tickets resolved by AI search before human escalation" },
      { label: "Org-Wide Savings (500 employees)", value: "$4.8M/yr", note: "Estimated productivity recovery with LegacyAI semantic retrieval" },
    ],
    fullContent: [
      "When we set out to build LegacyAI's search layer, we made a deliberate decision: keyword search was not sufficient. Enterprise knowledge is messy, contextual, and often expressed differently by different teams. A query for 'how do we handle refunds' might need to surface a Slack exchange from 2022, a CRM note, and a section of a knowledge capture transcript — none of which contain the word 'refunds'.",
      "Our pipeline starts with ingestion. Every knowledge artifact — transcripts, documents, notes, structured fields — is chunked using a semantic chunking strategy that preserves context boundaries. We use overlapping windows with a 15% overlap to avoid cutting off reasoning mid-sentence.",
      "Each chunk is embedded using a fine-tuned variant of a multilingual sentence transformer, optimized for enterprise vocabulary. We run embeddings at ingest time and store them in pgvector, which lets us keep everything in Postgres and avoid managing a separate vector store for most deployments.",
      "The retrieval layer uses hybrid search: a weighted combination of BM25 keyword matching and cosine similarity on the vector embeddings. The blend ratio is dynamically adjusted based on query type — short, specific queries weight keyword higher; longer, conceptual queries weight semantic higher.",
      "Re-ranking is done with a cross-encoder model that scores each candidate chunk against the full query in context. This step eliminates false positives that slip through the initial retrieval. We typically return the top-5 re-ranked results to the generation layer.",
      "The generation layer uses a retrieval-augmented prompt that includes the query, retrieved context, and a structured instruction set that tells the model to cite sources and flag uncertainty. This gives users traceable answers, not hallucinations.",
      "The result is a system that answers 'what did Sarah from finance say about the Q3 budget process?' with a precise, attributed response — even if Sarah left the company 6 months ago. That's the whole point.",
    ],
  },
];

const tagColors: Record<string, string> = {
  Engineering: "bg-blue-50 text-blue-700 border-blue-100",
  Product: "bg-violet-50 text-violet-700 border-violet-100",
  Research: "bg-amber-50 text-amber-700 border-amber-100",
  "How-To": "bg-green-50 text-green-700 border-green-100",
  Industry: "bg-rose-50 text-rose-700 border-rose-100",
};

const tagAccent: Record<string, string> = {
  Engineering: "bg-blue-600",
  Product: "bg-violet-600",
  Research: "bg-amber-500",
  "How-To": "bg-green-600",
  Industry: "bg-rose-600",
};

export default function Blog() {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const toggleExpand = (slug: string) => {
    setExpandedSlug((prev) => (prev === slug ? null : slug));
  };

  return (
    <div className="min-h-screen bg-background overflow-x-clip">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="grain absolute inset-0" />
        <div className="glow-blob animate-float-slow absolute -top-24 left-1/3 w-[500px] h-[400px] bg-blue-200/30" />
        <div className="glow-blob animate-float-slower absolute bottom-0 right-0 w-[400px] h-[350px] bg-violet-200/20" />
      </div>

      <PublicHeader />

      <section className="relative z-10 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-5xl font-semibold tracking-tight">Blog</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl">Insights on knowledge management, enterprise offboarding, and the future of institutional memory.</p>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => {
              const isExpanded = expandedSlug === post.slug;
              return (
                <motion.article
                  key={post.slug}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: expandedSlug ? 0 : i * 0.07, layout: { duration: 0.35, ease: "easeInOut" } }}
                  className={`bg-white rounded-2xl border border-border shadow-card flex flex-col overflow-hidden ${
                    isExpanded ? "md:col-span-2 lg:col-span-3 shadow-elevated" : "hover:shadow-elevated transition-shadow"
                  }`}
                >
                  {/* Collapsed / header area */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${tagColors[post.tag] ?? "bg-muted text-muted-foreground border-border"}`}>
                          {post.tag}
                        </span>
                        <span className="text-xs text-muted-foreground">{post.readTime}</span>
                      </div>
                      {isExpanded && (
                        <button
                          onClick={() => toggleExpand(post.slug)}
                          aria-label="Schließen"
                          className="rounded-full p-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <h2 className={`font-semibold text-foreground leading-snug ${isExpanded ? "text-xl" : "flex-1"}`}>{post.title}</h2>
                    <p className={`mt-3 text-sm text-muted-foreground leading-relaxed ${isExpanded ? "" : "line-clamp-3 flex-1"}`}>{post.desc}</p>
                    {!isExpanded && (
                      <div className="mt-5 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{post.date}</span>
                        <button
                          onClick={() => toggleExpand(post.slug)}
                          className="text-sm font-medium text-foreground flex items-center gap-1 hover:gap-2 transition-all"
                        >
                          Read more <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        key="expanded"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        {/* Financial Loss Banner */}
                        <div className="mx-6 mb-6 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden">
                          <div className={`px-4 py-2 ${tagAccent[post.tag] ?? "bg-slate-600"} flex items-center gap-2`}>
                            <TrendingDown className="w-4 h-4 text-white" />
                            <span className="text-xs font-semibold text-white uppercase tracking-wide">Financial Impact</span>
                          </div>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                            {post.financialLoss.map((item) => (
                              <div key={item.label} className="px-4 py-3">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <DollarSign className="w-3 h-3 text-slate-400" />
                                  <span className="text-xs text-slate-500 font-medium">{item.label}</span>
                                </div>
                                <div className="text-lg font-bold text-slate-900">{item.value}</div>
                                <div className="text-xs text-slate-400 mt-0.5 leading-snug">{item.note}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Article body */}
                        <div className="px-6 pb-8 space-y-4">
                          {post.fullContent.map((para, idx) => (
                            <p key={idx} className="text-sm text-foreground leading-relaxed">{para}</p>
                          ))}
                          <div className="pt-4 flex items-center justify-between border-t border-border">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              {post.date} · {post.readTime}
                            </div>
                            <button
                              onClick={() => toggleExpand(post.slug)}
                              className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" /> Schließen
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
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
