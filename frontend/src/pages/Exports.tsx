import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Upload, FileText, BookOpen, Database, ExternalLink, Package, Loader2 } from "lucide-react";
import { useReports } from "@/hooks/useApi";
import { useKnowledgeCards } from "@/hooks/useApi";

export default function Exports() {
  const { data: reports = [], isLoading: loadingReports } = useReports();
  const { data: cards = [], isLoading: loadingCards } = useKnowledgeCards();

  const isLoading = loadingReports || loadingCards;

  // Group knowledge cards by employee as export packs
  const exportPacks = reports.map((r: any) => ({
    id: r.id,
    title: r.title,
    employee: r.employee || '—',
    categories: cards.filter((c: any) => c.sessionId === r.sessionId).length || 0,
    blocks: cards.filter((c: any) => c.sessionId === r.sessionId).length || 0,
    status: r.exportStatus || r.status || 'pending',
    format: r.type || 'Handover Report',
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Exports & Integrations</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Export structured knowledge to your documentation and AI systems</p>
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { icon: Database, title: 'RAG-Ready Chunks', desc: 'Export as embeddings-ready content' },
          { icon: FileText, title: 'Structured Documents', desc: 'Markdown, PDF, or DOCX' },
          { icon: BookOpen, title: 'Knowledge Base', desc: 'Push to internal knowledge base' },
          { icon: ExternalLink, title: 'Agent Integration', desc: 'Connect to AI assistant' },
        ].map((c) => (
          <div key={c.title} className="bg-white border border-border p-5 hover:border-foreground/20 transition-colors cursor-pointer">
            <c.icon className="w-4 h-4 text-foreground mb-3" />
            <h3 className="font-medium text-[13px]">{c.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
          </div>
        ))}
      </div>
      <div className="bg-white border border-border">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Export Packages</h2>
          <span className="text-xs text-muted-foreground">{exportPacks.length} reports · {cards.length} knowledge blocks total</span>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : exportPacks.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-muted-foreground">No reports yet. Complete a session to generate export packages.</div>
        ) : (
          <div className="divide-y divide-border">
            {exportPacks.map((p) => (
              <div key={p.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-foreground/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-foreground/[0.06] flex items-center justify-center"><Package className="w-4 h-4 text-foreground" /></div>
                  <div>
                    <p className="font-medium text-[13px]">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.employee} · {p.format}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={p.status} />
                  <button disabled={p.status !== 'ready' && p.status !== 'finalized'} className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[13px] font-medium disabled:opacity-40 hover:bg-foreground/[0.04] transition-colors">
                    <Upload className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}