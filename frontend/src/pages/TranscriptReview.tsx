import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { transcriptSegments, extractedTopics } from "@/data/mockData";
import { AlertTriangle, CheckCircle2, Edit3, Flag, RotateCcw, Save, ArrowRight, Shield } from "lucide-react";

export default function TranscriptReview() {
  const [approved, setApproved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (showConfirm) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-card rounded-2xl border border-border shadow-elevated p-8 space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Approve transcript for processing?</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Once approved, the system will begin structuring knowledge, generating categories, and preparing outputs from this transcript.
            </p>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Transcript segments</span><span className="font-medium">{transcriptSegments.length}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Topics detected</span><span className="font-medium">{extractedTopics.length}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Low confidence sections</span><span className="font-medium text-warning">2</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Duration</span><span className="font-medium">1h 24m</span></div>
          </div>
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-foreground">2 segments have lower confidence scores and may need manual verification after processing.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>Go Back & Review</Button>
            <Button className="flex-1" asChild><Link to="/app/sessions/s1/processing"><CheckCircle2 className="w-4 h-4" /> Confirm & Process</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex">
      {/* Transcript Panel */}
      <div className="flex-1 overflow-y-auto">
        {/* Status Banner */}
        <div className="bg-warning/10 border-b border-warning/20 px-6 py-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <div>
            <p className="text-sm font-medium">Transcript captured — awaiting your review</p>
            <p className="text-xs text-muted-foreground">No knowledge extraction will happen until this transcript is approved.</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto py-8 px-6">
          <div className="flex items-center gap-3 mb-6">
            <Badge variant="warning">Step 2: Review</Badge>
            <h1 className="text-xl font-semibold">Verify Knowledge Capture</h1>
          </div>

          <div className="space-y-4">
            {transcriptSegments.map((seg, i) => (
              <div key={i} className="group relative">
                <div className={`rounded-xl border p-4 transition-colors ${
                  i === 3 || i === 7 ? 'border-warning/30 bg-warning/5' : 'border-border hover:border-border/80'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                      i === 3 || i === 7 ? 'bg-warning/20 text-warning border border-warning/30' : 'bg-muted text-muted-foreground'
                    }`}>{seg.timestamp}</span>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      {seg.speaker === 'ai' ? 'LegacyAI' : 'Sarah Jenkins'}
                    </span>
                    {(i === 3 || i === 7) && (
                      <span className="text-xs text-warning flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Low confidence</span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{seg.text}</p>
                </div>
                <div className="absolute right-2 top-2 hidden group-hover:flex gap-1">
                  <button className="p-1.5 rounded-lg bg-card border border-border hover:bg-accent text-muted-foreground"><Edit3 className="w-3 h-3" /></button>
                  <button className="p-1.5 rounded-lg bg-card border border-border hover:bg-accent text-muted-foreground"><Flag className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 border-l border-border bg-card flex flex-col shrink-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-sm mb-3">Session Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Employee</span><span className="font-medium">Sarah Jenkins</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span>Sr. Staff Engineer</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span>1h 24m</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Segments</span><span>{transcriptSegments.length}</span></div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">AI Confidence Summary</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">High confidence</span>
                <span className="text-success font-medium">{transcriptSegments.length - 2} segments</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Low confidence</span>
                <span className="text-warning font-medium">2 segments</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Draft Extractions</h3>
            <div className="space-y-2">
              {extractedTopics.slice(0, 6).map((t) => (
                <div key={t.name} className="px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm">
                  <span className="font-medium">{t.name}</span>
                  <p className="text-xs text-muted-foreground">{t.category}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border space-y-3">
          <p className="text-xs text-muted-foreground text-center">
            No data will be committed to the Knowledge Base until you approve this transcript.
          </p>
          <Button className="w-full" size="lg" onClick={() => setShowConfirm(true)}>
            <CheckCircle2 className="w-4 h-4" /> Approve & Process
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm"><RotateCcw className="w-3 h-3" /> Re-record</Button>
            <Button variant="ghost" size="sm"><Save className="w-3 h-3" /> Save Draft</Button>
          </div>
        </div>
      </div>
    </div>
  );
}