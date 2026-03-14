import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { transcriptSegments, extractedTopics } from "@/data/mockData";
import { ArrowLeft, Clock, FileText, BookOpen, MessageSquare, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";

export default function SessionDetail() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link to="/app/sessions"><ArrowLeft className="w-4 h-4" /></Link></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Engineering Lead Offboarding</h1>
            <StatusBadge status="finalized" />
          </div>
          <p className="text-sm text-muted-foreground">Sarah Jenkins · Senior Staff Engineer · Engineering</p>
        </div>
        <Button variant="outline" size="sm" asChild><Link to="/app/reports/r1"><FileText className="w-4 h-4" /> View Report</Link></Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Duration', value: '1h 24m', icon: Clock },
          { label: 'Topics Extracted', value: '18', icon: BookOpen },
          { label: 'Transcript Status', value: 'Approved', icon: CheckCircle2 },
          { label: 'Report Status', value: 'Finalized', icon: FileText },
        ].map((c) => (
          <div key={c.label} className="bg-card rounded-2xl border border-border p-4 shadow-card">
            <div className="flex items-center gap-2 mb-1">
              <c.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{c.label}</span>
            </div>
            <p className="text-lg font-semibold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Transcript */}
        <div className="md:col-span-2 bg-card rounded-2xl border border-border shadow-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm">Transcript</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/sessions/s1/review">Full Review <ExternalLink className="w-3 h-3" /></Link>
            </Button>
          </div>
          <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
            {transcriptSegments.slice(0, 8).map((seg, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-xs font-mono text-muted-foreground mt-1 shrink-0 w-14">{seg.timestamp}</span>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground">{seg.speaker === 'ai' ? 'LegacyAI' : 'Sarah Jenkins'}</span>
                  <p className="text-sm text-foreground mt-0.5 leading-relaxed">{seg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Topics */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-4">
            <h3 className="font-semibold text-sm mb-3">Extracted Knowledge Topics</h3>
            <div className="space-y-2">
              {extractedTopics.map((t) => (
                <div key={t.name} className="flex items-center justify-between py-1.5">
                  <span className="text-sm">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{Math.round(t.confidence * 100)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Unresolved */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-warning" /> Unresolved Areas</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• CloudMetrics adapter repo ownership transfer</p>
              <p>• Complete list of manual workaround scripts</p>
              <p>• Budget approval chain for vendor contracts</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-4">
            <h3 className="font-semibold text-sm mb-3">Session Timeline</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Session created', time: 'Mar 6, 2026' },
                { label: 'Interview completed', time: 'Mar 6, 2026' },
                { label: 'Transcript generated', time: 'Mar 7, 2026' },
                { label: 'Transcript approved', time: 'Mar 8, 2026' },
                { label: 'Processing complete', time: 'Mar 9, 2026' },
                { label: 'Report finalized', time: 'Mar 10, 2026' },
              ].map((e, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <div className="flex-1 flex justify-between">
                    <span>{e.label}</span>
                    <span className="text-muted-foreground text-xs">{e.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}