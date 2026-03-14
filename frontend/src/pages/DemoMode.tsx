import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { demoScenarios } from "@/data/mockData";
import { Play, ArrowRight } from "lucide-react";

export default function DemoMode() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1"><Badge variant="info">Demo Mode</Badge></div>
        <h1 className="text-xl font-semibold tracking-tight">Interactive Demos</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Explore realistic knowledge capture scenarios with pre-built demo data</p>
      </div>
      <div className="space-y-4">
        {demoScenarios.map((s) => (
          <div key={s.id} className="bg-white border border-border p-6 hover:bg-foreground/[0.02] transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{s.title}</h3>
                  <StatusBadge status={s.riskLevel}/>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">{s.description}</p>
                <div className="grid grid-cols-2 gap-4 text-[13px]">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Expected Categories</p>
                    <div className="flex flex-wrap gap-1">{s.expectedCategories.map(c=>(<Badge key={c} variant="secondary" className="text-xs">{c}</Badge>))}</div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Expected Outputs</p>
                    <div className="flex flex-wrap gap-1">{s.expectedOutputs.map(o=>(<Badge key={o} variant="muted" className="text-xs">{o}</Badge>))}</div>
                  </div>
                </div>
              </div>
              <Link to="/app/sessions/interview" className="shrink-0 ml-6 h-8 px-4 bg-foreground text-background text-[13px] font-medium flex items-center gap-1.5 hover:bg-foreground/90 transition-colors">
                <Play className="w-3.5 h-3.5"/>Run Demo
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}