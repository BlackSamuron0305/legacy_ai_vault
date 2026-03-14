import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { PublicHeader } from "@/components/layout/PublicHeader";

const posts = [
  {
    tag: "Engineering",
    title: "The $2M Mistake: What Happens When Your Only DevOps Engineer Quits",
    desc: "A case study on how one mid-sized SaaS company lost 14 months of deployment automation knowledge in a single resignation — and how they recovered.",
    date: "March 10, 2026",
    readTime: "8 min read",
    slug: "devops-engineer-quit",
  },
  {
    tag: "Product",
    title: "Why Documentation Fails (And What You Should Do Instead)",
    desc: "Traditional documentation assumes people will write things down. They won't. We built LegacyAI around how knowledge actually works.",
    date: "February 28, 2026",
    readTime: "6 min read",
    slug: "why-documentation-fails",
  },
  {
    tag: "Research",
    title: "The Hidden Cost of Employee Offboarding: A Data-Driven Analysis",
    desc: "We analyzed 200+ offboarding processes to quantify the true cost of knowledge loss. The numbers are worse than most leaders assume.",
    date: "February 14, 2026",
    readTime: "12 min read",
    slug: "hidden-cost-of-offboarding",
  },
  {
    tag: "How-To",
    title: "Running Your First AI Knowledge Capture Session: A Step-by-Step Guide",
    desc: "From scheduling the interview to publishing the knowledge base entry — everything you need to run a successful capture session with LegacyAI.",
    date: "January 30, 2026",
    readTime: "5 min read",
    slug: "first-knowledge-capture-session",
  },
  {
    tag: "Industry",
    title: "The Baby Boomer Brain Drain: 16.5 Million Experts Are Leaving the Workforce",
    desc: "By 2036, 30% of the most experienced workers in the US will have retired. Is your organization prepared for what they'll take with them?",
    date: "January 15, 2026",
    readTime: "7 min read",
    slug: "baby-boomer-brain-drain",
  },
  {
    tag: "Engineering",
    title: "How We Built a Vector Search Pipeline for Enterprise Knowledge Retrieval",
    desc: "A deep dive into the technical architecture behind LegacyAI's semantic search — from embeddings to hybrid retrieval at scale.",
    date: "December 20, 2025",
    readTime: "10 min read",
    slug: "vector-search-pipeline",
  },
];

const tagColors: Record<string, string> = {
  Engineering: "bg-blue-50 text-blue-700 border-blue-100",
  Product: "bg-violet-50 text-violet-700 border-violet-100",
  Research: "bg-amber-50 text-amber-700 border-amber-100",
  "How-To": "bg-green-50 text-green-700 border-green-100",
  Industry: "bg-rose-50 text-rose-700 border-rose-100",
};

export default function Blog() {
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
            {posts.map((post, i) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="bg-white rounded-2xl border border-border p-6 shadow-card hover:shadow-elevated transition-shadow flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${tagColors[post.tag] ?? "bg-muted text-muted-foreground border-border"}`}>
                    {post.tag}
                  </span>
                  <span className="text-xs text-muted-foreground">{post.readTime}</span>
                </div>
                <h2 className="font-semibold text-foreground leading-snug flex-1">{post.title}</h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">{post.desc}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{post.date}</span>
                  <button className="text-sm font-medium text-foreground flex items-center gap-1 hover:gap-2 transition-all">
                    Read <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.article>
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
