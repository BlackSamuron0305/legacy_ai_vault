import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { transcriptSegments, extractedTopics } from "@/data/mockData";
import { Mic, Pause, Square, Clock, Brain, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Interview() {
  const [recording, setRecording] = useState(true);
  const [currentSegment, setCurrentSegment] = useState(transcriptSegments.length - 1);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-card shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="info" className="text-xs">Live Session</Badge>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Engineering Lead Offboarding</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Subject: Sarah Jenkins · Senior Staff Engineer</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>12:34</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setRecording(!recording)}>
            {recording ? <><Pause className="w-4 h-4" /> Pause</> : <><Mic className="w-4 h-4" /> Resume</>}
          </Button>
          <Button variant="destructive" size="sm" asChild>
            <Link to="/app/sessions/s1/review"><Square className="w-4 h-4" /> End & Review</Link>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Interview Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Waveform */}
            <div className="bg-card rounded-2xl border border-border shadow-card p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                    <Mic className="w-6 h-6 text-primary-foreground" />
                  </div>
                  {recording && (
                    <div className="absolute inset-0 w-14 h-14 rounded-full bg-primary/30 animate-pulse-ring" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {recording && <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />}
                    <span className="text-sm font-medium">{recording ? 'Recording in progress' : 'Paused'}</span>
                  </div>
                  {/* Waveform visualization */}
                  <div className="flex items-center gap-0.5 h-8">
                    {Array.from({ length: 60 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full bg-primary/40"
                        style={{
                          height: `${recording ? Math.random() * 100 : 20}%`,
                          transition: 'height 0.15s ease',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Conversation */}
            <div className="space-y-4">
              {transcriptSegments.slice(-6).map((seg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className={`rounded-2xl border border-border p-5 ${
                    seg.speaker === 'ai' ? 'bg-card shadow-card' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {seg.speaker === 'ai' ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">LegacyAI</span>
                      </>
                    ) : (
                      <>
                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold flex items-center justify-center">SJ</div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sarah Jenkins</span>
                      </>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto font-mono">{seg.timestamp}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${seg.speaker === 'ai' ? 'text-foreground' : 'text-foreground/80'}`}>
                    {seg.speaker === 'ai' ? `"${seg.text}"` : `"${seg.text}"`}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Live transcription */}
            {recording && (
              <div className="opacity-60 space-y-2 pl-4 border-l-2 border-primary/20">
                <p className="text-sm italic text-muted-foreground">Sarah is speaking...</p>
                <p className="text-sm text-foreground/60">
                  "The credentials for the adapter are stored in our Vault instance under /prod/cloudmetrics/adapter. Only I and James have access right now..."
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Extracted Topics */}
        <div className="w-72 border-l border-border bg-card overflow-y-auto shrink-0">
          <div className="p-4 border-b border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Detected Topics</h3>
            <p className="text-xs text-muted-foreground mt-1">Draft hints — not final until transcript is approved</p>
          </div>
          <div className="p-4 space-y-2">
            {extractedTopics.map((t) => (
              <div key={t.name} className="px-3 py-2.5 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{Math.round(t.confidence * 100)}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{t.category}</p>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border">
            <div className="p-3 bg-muted/50 rounded-xl border border-dashed border-border">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-snug">
                  These are <strong>live hints only</strong>. No knowledge extraction happens until the transcript is reviewed and approved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}