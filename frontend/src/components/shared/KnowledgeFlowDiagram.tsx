import { motion } from "framer-motion";

/* ── Sankey-style time-allocation bars ── */

interface SankeyBar {
  label: string;
  pct: number;
  color: string;
}

function SankeyChart({ bars, title }: { bars: SankeyBar[]; title: string }) {
  return (
    <div className="mt-6">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">{title}</p>
      <div className="space-y-2">
        {bars.map((b) => (
          <div key={b.label} className="flex items-center gap-3">
            <span className="text-[11px] text-muted-foreground w-28 shrink-0 text-right">{b.label}</span>
            <div className="flex-1 h-4 bg-muted/40 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: b.color }}
                initial={{ width: 0 }}
                whileInView={{ width: `${b.pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="text-[11px] font-semibold text-foreground tabular-nums w-10">{b.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MentoringSankey() {
  return (
    <SankeyChart
      title="Time allocation"
      bars={[
        { label: "Expert time", pct: 50, color: "hsl(221 83% 53%)" },
        { label: "Trainee time", pct: 50, color: "hsl(0 84% 60%)" },
      ]}
    />
  );
}

export function DocumentationSankey() {
  return (
    <SankeyChart
      title="Time allocation"
      bars={[
        { label: "Writing", pct: 60, color: "hsl(221 83% 53%)" },
        { label: "Review", pct: 20, color: "hsl(38 92% 50%)" },
        { label: "Search & read", pct: 20, color: "hsl(0 84% 60%)" },
      ]}
    />
  );
}
