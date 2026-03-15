import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, ExternalLink, Loader2, Brain, Send, X } from "lucide-react";
import { useSession, useAskChat } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";

function stripMarkdownFence(html: string): string {
  let cleaned = html.trim();
  if (cleaned.startsWith("```html")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

type ChatMsg = { role: 'user' | 'assistant'; content: string };

function ReportChat({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: 'Ask me anything about this report or the captured knowledge.' },
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
            ? `\n\nSources: ${data.sources.map((s: any) => s.topic || s.expert_name).join(', ')}`
            : '';
          setMessages(prev => [...prev, { role: 'assistant', content: answer + sourceText }]);
        },
        onError: () => {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process your question.' }]);
        },
      },
    );
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed right-0 top-0 bottom-0 w-[420px] bg-white border-l border-border flex flex-col z-50 shadow-xl"
    >
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          <span className="text-[13px] font-semibold">Knowledge Chat</span>
        </div>
        <button className="h-7 w-7 flex items-center justify-center hover:bg-foreground/[0.04]" onClick={onClose}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 text-[13px] leading-relaxed whitespace-pre-line ${
              msg.role === 'user' ? 'bg-foreground text-background' : 'bg-foreground/[0.06] text-foreground'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-foreground/[0.06] px-3 py-2 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>
      <div className="p-3 border-t border-border shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about the report..."
            className="flex-1 h-10 px-3 border border-border bg-white text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
            disabled={chatMutation.isPending}
          />
          <button
            className="h-10 w-10 shrink-0 bg-foreground text-background flex items-center justify-center disabled:opacity-60"
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

export default function ReportViewer() {
  const { id } = useParams();
  const { data: session, isLoading, refetch } = useSession(id || "");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [loadingHtml, setLoadingHtml] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoadingHtml(true);
    api.getSessionReportHtml(id)
      .then((html) => setReportHtml(stripMarkdownFence(html)))
      .catch(() => {
        const fallback = session?.summary ? stripMarkdownFence(session.summary) : null;
        setReportHtml(fallback);
      })
      .finally(() => setLoadingHtml(false));
  }, [id, session?.summary]);

  useEffect(() => {
    if (!iframeRef.current || !reportHtml) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(reportHtml);
    doc.close();
  }, [reportHtml]);

  const handleDownloadPdf = async () => {
    if (!id) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      if (!session?.reportPdfPath) {
        await api.generateSessionPdf(id);
        await refetch();
      }
      const { pdfUrl } = await api.getSessionReportUrls(id);
      if (pdfUrl) {
        window.open(pdfUrl, "_blank", "noopener,noreferrer");
      } else {
        setPdfError("PDF URL not available. Try again in a moment.");
      }
    } catch (err: any) {
      setPdfError(err?.message || "Failed to generate PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleOpenNewTab = async () => {
    if (!id) return;
    try {
      if (session?.reportHtmlPath) {
        const { htmlUrl } = await api.getSessionReportUrls(id);
        if (htmlUrl) {
          window.open(htmlUrl, "_blank", "noopener,noreferrer");
          return;
        }
      }
      const w = window.open("", "_blank");
      if (w && reportHtml) {
        w.document.write(reportHtml);
        w.document.close();
      }
    } catch {
      const w = window.open("", "_blank");
      if (w && reportHtml) {
        w.document.write(reportHtml);
        w.document.close();
      }
    }
  };

  if (isLoading || loadingHtml) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!reportHtml) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] gap-4">
        <p className="text-[13px] text-muted-foreground">No report has been generated for this session yet.</p>
        <Button variant="outline" asChild>
          <Link to={`/app/sessions/${id}`}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to session
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="border-b border-border bg-white px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/app/sessions/${id}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="text-sm font-semibold">
            {session?.employeeName || "Session"} — Report
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={handleOpenNewTab}>
            <ExternalLink className="w-3.5 h-3.5" /> Open in new tab
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
          >
            {pdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Download PDF
          </Button>
          <Button
            variant={chatOpen ? "outline" : "default"}
            size="sm"
            className="gap-1.5 h-8"
            onClick={() => setChatOpen(!chatOpen)}
          >
            <Brain className="w-3.5 h-3.5" />
            {chatOpen ? 'Close Chat' : 'Chat'}
          </Button>
        </div>
      </div>

      {pdfError && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-6 py-2 flex items-center justify-between shrink-0">
          <p className="text-xs text-destructive">{pdfError}</p>
          <button className="text-xs text-destructive underline" onClick={() => setPdfError(null)}>Dismiss</button>
        </div>
      )}

      <div className="flex-1 bg-gray-100 p-4 overflow-hidden">
        <iframe
          ref={iframeRef}
          title="Report"
          className="w-full h-full bg-white rounded-lg shadow-sm border border-border"
          sandbox="allow-same-origin"
          style={{ minHeight: "100%" }}
        />
      </div>

      <AnimatePresence>
        {chatOpen && id && <ReportChat sessionId={id} onClose={() => setChatOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
