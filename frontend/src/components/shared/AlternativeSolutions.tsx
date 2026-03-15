import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, DollarSign, UserRound, GraduationCap, FileText, Monitor } from "lucide-react";

type SchemaNode =
  | { label: string; icon: React.ElementType; color: string }
  | { arrow: string };

const APPROACHES: {
  title: string;
  icon: React.ElementType;
  schema: SchemaNode[];
  pros: string[];
  cons: string[];
  cost: string;
}[] = [
  {
    title: "Classical Mentoring",
    icon: UserRound,
    schema: [
      { label: "Expert", icon: UserRound, color: "text-blue-600 bg-blue-50" },
      { arrow: "1 : 1 per trainee" },
      { label: "Trainee \u00d7 n", icon: GraduationCap, color: "text-red-500 bg-red-50" },
    ],
    pros: ["Interactive \u2014 answers adapt to the trainee's specific needs."],
    cons: [
      "Both must be available simultaneously \u2014 scheduling bottleneck.",
      "If the trainee leaves, knowledge leaves again.",
    ],
    cost: "Expert's mentoring time is revenue-generating capacity lost.",
  },
  {
    title: "Exhaustive Documentation",
    icon: FileText,
    schema: [
      { label: "Expert", icon: Monitor, color: "text-amber-600 bg-amber-50" },
      { arrow: "Draft \u2192 Revise \u2192 Publish" },
      { label: "Document", icon: FileText, color: "text-red-500 bg-red-50" },
    ],
    pros: ["Persistent \u2014 available to the entire org, not bound to individuals."],
    cons: [
      "No interactivity \u2014 finding specific knowledge requires tedious searches.",
      "Experts miss tacit knowledge that only surfaces in conversation.",
    ],
    cost: "Writing often takes weeks of expert effort away from core work.",
  },
];

export default function AlternativeSolutions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Why LegacyAI?</p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
          Traditional approaches to knowledge transfer
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Before LegacyAI, organizations relied on these methods — each with significant trade-offs.
        </p>
      </div>

      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border border border-border">
        {APPROACHES.map((a) => (
          <div key={a.title} className="p-8 space-y-6">
            {/* Title */}
            <div className="flex items-center gap-2.5">
              <a.icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <h3 className="text-base font-semibold text-foreground">{a.title}</h3>
            </div>

            {/* Schema */}
            <div className="flex items-center gap-3 py-3 px-4 bg-muted/30">
              {a.schema.map((node, i) =>
                "arrow" in node ? (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="w-full flex items-center gap-1">
                      <div className="flex-1 h-px bg-border" />
                      <svg viewBox="0 0 8 8" className="w-2 h-2 text-muted-foreground/50 shrink-0">
                        <path d="M0,0 L8,4 L0,8" fill="currentColor" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 text-center leading-tight">{node.arrow}</span>
                  </div>
                ) : (
                  <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${node.color}`}>
                      <node.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">{node.label}</span>
                  </div>
                )
              )}
            </div>

            {/* Points */}
            <ul className="space-y-2.5 pt-2 border-t border-border">
              {a.pros.map((p) => (
                <li key={p} className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed">
                  <ThumbsUp className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{p}</span>
                </li>
              ))}
              {a.cons.map((c) => (
                <li key={c} className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed">
                  <ThumbsDown className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
                  <span>{c}</span>
                </li>
              ))}
              <li className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed">
                <DollarSign className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                <span>{a.cost}</span>
              </li>
            </ul>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
