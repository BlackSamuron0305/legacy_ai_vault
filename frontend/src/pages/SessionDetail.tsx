import { useState, useRef, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useSession, useSessionTranscript, useSessionTopics, useAskChat } from "@/hooks/useApi";
import { ArrowLeft, Clock, FileText, BookOpen, MessageSquare, AlertCircle, CheckCircle2, ExternalLink, Brain, Send, X } from "lucide-react";
import { SessionDetailSkeleton } from "@/components/skeletons";
import { AnimatePresence, motion } from "framer-motion";

type ChatMsg = { role: 'user' | 'assistant'; content: string };

function SessionChat({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: 'I can answer questions about the knowledge captured in this session and across all sessions. What would you like to know?' },
  ]);
  const [input, setInput] = useState('');
  const chatMutation = useAskChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, chatMutation.isPending]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    const q = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setInput('');
    chatMutation.mutate(
      { question: q, sessionId },
      {
        onSuccess: (data: any) => {
          const answer = data.answer || 'No answer available.';
          const sourceText = data.sources?.length
            ? `\n\n_Sources: ${data.sources.map((s: any) => s.topic || s.expert_name).join(', ')}_`
            : '';
          setMessages(prev => [...prev, { role: 'assistant', content: answer + sourceText }]);
        },
        onError: () => {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process your question. Please try again.' }]);
        },
      },
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 bg-white flex flex-col z-50 overflow-hidden"
    >
      <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-foreground flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-background" />
          </div>
          <div>
            <p className="text-[13px] font-semibold">Knowledge Chat</p>
            <p className="text-xs text-muted-foreground">RAG-powered Q&A</p>
          </div>
        </div>
        <button className="h-8 w-8 flex items-center justify-center hover:bg-foreground/[0.04]" onClick={onClose}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 max-w-3xl mx-auto w-full">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] px-4 py-3 text-[13px] leading-relaxed whitespace-pre-line ${
              msg.role === 'user' ? 'bg-foreground text-background' : 'bg-foreground/[0.06] text-foreground'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-foreground/[0.06] px-4 py-3 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>
      {messages.length <= 1 && (
        <div className="px-6 pb-2 flex flex-wrap gap-1.5 max-w-3xl mx-auto w-full">
          {['Summarize the key findings', 'What are the biggest risks?', 'What knowledge was captured?'].map(q => (
            <button key={q} onClick={() => setInput(q)} className="text-xs px-2.5 py-1.5 border border-border bg-foreground/[0.03] text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors">
              {q}
            </button>
          ))}
        </div>
      )}
      <div className="p-4 border-t border-border shrink-0">
        <div className="flex items-center gap-2 max-w-3xl mx-auto w-full">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about captured knowledge..."
            className="flex-1 h-11 px-4 border border-border bg-white text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
            disabled={chatMutation.isPending}
          />
          <button
            className="h-11 w-11 shrink-0 bg-foreground text-background flex items-center justify-center disabled:opacity-60 hover:bg-foreground/90 transition-colors"
            onClick={handleSend}
            disabled={!input.trim() || chatMutation.isPending}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function SessionDetail() {
  const { id } = useParams();
  const { data: session, isLoading } = useSession(id!);
  const { data: transcriptSegments = [] } = useSessionTranscript(id!);
  const { data: extractedTopics = [] } = useSessionTopics(id!);
  const [chatOpen, setChatOpen] = useState(false);

  if (isLoading || !session) {
    return <SessionDetailSkeleton />;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link to="/app/sessions"><ArrowLeft className="w-4 h-4" /></Link></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{session.employeeName || 'Session'} — Knowledge Capture</h1>
            <StatusBadge status={session.status} />
          </div>
          <p className="text-[13px] text-muted-foreground">{[session.employeeName, session.employeeRole, session.department].filter(Boolean).join(' · ')}</p>
        </div>
        <Link to={`/app/sessions/${id}/interview`} className="h-8 px-4 bg-foreground text-background text-[13px] font-medium flex items-center gap-1.5 hover:bg-foreground/90 transition-colors"><MessageSquare className="w-3.5 h-3.5" /> Start Session</Link>
        <Link to={`/app/sessions/${id}/review`} className="h-8 px-4 border border-border text-[13px] font-medium flex items-center gap-1.5 hover:bg-foreground/[0.04] transition-colors"><FileText className="w-3.5 h-3.5" /> Review</Link>
        <Link to={`/app/sessions/${id}/classification`} className="h-8 px-4 border border-border text-[13px] font-medium flex items-center gap-1.5 hover:bg-foreground/[0.04] transition-colors"><AlertCircle className="w-3.5 h-3.5" /> Classification</Link>
        {Boolean(session?.summary) && (
          <Link to={`/app/sessions/${id}/report`} className="h-8 px-4 border border-border text-[13px] font-medium flex items-center gap-1.5 hover:bg-foreground/[0.04] transition-colors">
            <FileText className="w-3.5 h-3.5" /> View report
          </Link>
        )}
        <button
          onClick={() => setChatOpen(true)}
          className="h-8 px-4 bg-foreground text-background text-[13px] font-medium flex items-center gap-1.5 hover:bg-foreground/90 transition-colors"
        >
          <Brain className="w-3.5 h-3.5" /> Chat
        </button>
      </div>

      {session.status === 'processing_failed' && (
        <div className="border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3 text-[13px]">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
          <div>
            <p className="font-semibold text-destructive">AI processing failed for this session.</p>
            <p className="text-muted-foreground">
              The automatic transcript processing and report generation did not complete successfully.
              You can still review and edit the transcript, then retry processing from the processing screen if needed.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Duration', value: session.duration || '—', icon: Clock },
          { label: 'Topics Extracted', value: String(session.topicsExtracted || 0), icon: BookOpen },
          { label: 'Transcript Status', value: session.transcriptStatus || 'pending', icon: CheckCircle2 },
          { label: 'Report Status', value: session.reportStatus || 'pending', icon: FileText },
        ].map((c) => (
          <div key={c.label} className="bg-white border border-border p-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-foreground/[0.06] flex items-center justify-center"><c.icon className="w-3.5 h-3.5 text-muted-foreground" /></div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</span>
            </div>
            <p className="text-lg font-semibold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Transcript */}
        <div className="md:col-span-2 bg-white border border-border">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Transcript</h2>
            <Link to={`/app/sessions/${id}/review`} className="text-[13px] text-muted-foreground hover:text-foreground hover:underline underline-offset-4 flex items-center gap-1">Full Review <ExternalLink className="w-3 h-3" /></Link>
          </div>
          <div className="max-h-[500px] overflow-y-auto p-5 space-y-3">
            {transcriptSegments.slice(0, 8).map((seg, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-xs font-mono text-muted-foreground mt-1 shrink-0 w-14">{seg.timestamp}</span>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground">{seg.speaker === 'ai' ? 'LegacyAI' : 'Sarah Jenkins'}</span>
                  <p className="text-[13px] text-foreground mt-0.5 leading-relaxed">{seg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Topics */}
          <div className="bg-white border border-border p-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">Extracted Knowledge Topics</h3>
            <div className="space-y-2">
              {extractedTopics.map((t) => (
                <div key={t.name} className="flex items-center justify-between py-1.5">
                  <span className="text-[13px]">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{Math.round(t.confidence * 100)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Unresolved */}
          <div className="bg-white border border-border p-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Unresolved Areas</h3>
            <div className="space-y-2 text-[13px] text-muted-foreground">
              <p>• CloudMetrics adapter repo ownership transfer</p>
              <p>• Complete list of manual workaround scripts</p>
              <p>• Budget approval chain for vendor contracts</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white border border-border p-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">Session Timeline</h3>
            <div className="space-y-3 text-[13px]">
              {[
                { label: 'Session created', time: 'Mar 6, 2026' },
                { label: 'Interview completed', time: 'Mar 6, 2026' },
                { label: 'Transcript generated', time: 'Mar 7, 2026' },
                { label: 'Transcript approved', time: 'Mar 8, 2026' },
                { label: 'Processing complete', time: 'Mar 9, 2026' },
                { label: 'Report finalized', time: 'Mar 10, 2026' },
              ].map((e, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-foreground shrink-0" />
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

      <AnimatePresence>
        {chatOpen && <SessionChat sessionId={id!} onClose={() => setChatOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}