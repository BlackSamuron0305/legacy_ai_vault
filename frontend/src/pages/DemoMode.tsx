import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { demoScenarios } from "@/data/mockData";
import { Play, ArrowRight } from "lucide-react";

export default function DemoMode() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1"><Badge variant="info">Demo Mode</Badge></div>
        <h1 className="text-2xl font-semibold tracking-tight">Interactive Demos</h1>
        <p className="text-sm text-muted-foreground mt-1">Explore realistic knowledge capture scenarios with pre-built demo data</p>
      </div>
      <div className="space-y-4">
        {demoScenarios.map((s) => (
          <div key={s.id} className="bg-card rounded-2xl border border-border shadow-card p-6 hover:shadow-elevated transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{s.title}</h3>
                  <StatusBadge status={s.riskLevel}/>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{s.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
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
              <Button size="sm" className="shrink-0 ml-6" asChild>
                <Link to="/app/sessions/interview"><Play className="w-4 h-4"/>Run Demo</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}