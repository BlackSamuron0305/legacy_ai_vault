import { useState, useRef, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ArrowLeft, FileText, Users, Server, Link2, MessageSquare, X, Send, Brain, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const knowledgeBlocks = [
  { title: 'Nightly Batch Restart Procedure', status: 'finalized', confidence: 95, source: 'Sarah Jenkins, Session 1', content: 'Every Tuesday and Thursday, SSH into production jump box. Check S3 bucket size — if over 500GB, run cleanup script first. Then execute restart_sync.sh. Wait for confirmation before notifying data team.' },
  { title: 'Upstream Vendor Sync Dependency', status: 'reviewed', confidence: 92, source: 'Sarah Jenkins, Session 1', content: 'Acme Corp data feed arrives late on Mondays due to timezone issues. Do not restart nightly batch until Anna Kowalski confirms upstream data is complete.' },
  { title: 'Jenkins Memory Leak Management', status: 'finalized', confidence: 98, source: 'Sarah Jenkins, Session 2', content: 'Jenkins-Master-01 has a known memory leak. Requires manual restart of the CI/CD pipeline on a bi-weekly schedule. Has been managed manually for 2+ years.' },
  { title: 'CloudMetrics Custom Adapter', status: 'draft', confidence: 85, source: 'Sarah Jenkins, Session 1', content: 'Custom authentication adapter created when CloudMetrics changed their auth flow 6 months ago. Code in private repo with limited access. Credentials in Vault under /prod/cloudmetrics/adapter.' },
  { title: 'DataFlow Inc API Sync Window', status: 'reviewed', confidence: 88, source: 'Sarah Jenkins, Session 1', content: 'DataFlow Inc sends API updates every first Monday of the month. Must trigger sync before 6am or manual intervention is required.' },
];

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const mockResponses: Record<string, string> = {
  default: "Based on the captured knowledge in **Critical Workflows**, here's what I found:\n\nThe nightly batch process is managed through a combination of manual SSH procedures and scripted restarts. The key dependencies are:\n\n1. **S3 bucket size check** — must be under 500GB before restart\n2. **Upstream vendor sync** from Acme Corp\n3. **Team notification** — Anna Kowalski must confirm data completeness\n\nWould you like me to go deeper into any of these areas?",
  restart: "The **restart procedure** for the nightly batch involves these steps:\n\n1. SSH into the production jump box\n2. Check S3 bucket size (threshold: 500GB)\n3. If over 500GB, run the cleanup script first\n4. Execute `restart_sync.sh`\n5. Wait for confirmation before notifying the data team\n\n⚠️ **Important:** On Tuesdays, the failure is usually caused by the upstream vendor sync from Acme Corp. Don't restart until Anna Kowalski confirms the upstream data is complete.\n\nThis was captured from Sarah Jenkins' Session 1.",
  who: "Based on the captured knowledge, the **key people** involved in Critical Workflows are:\n\n- **Sarah Jenkins** (Senior Staff Engineer) — Primary knowledge holder, manages CI/CD pipeline and nightly batch\n- **Anna Kowalski** (Data Engineering Manager) — Must confirm upstream data completeness before batch restarts\n- **James Wilson** (DevOps Lead) — Has access to CloudMetrics adapter repo\n- **David Park** (Security Architect) — Recommended to receive access to critical repos\n\nSarah Jenkins is departing, which makes this knowledge transfer critical.",
  jenkins: "The **Jenkins memory leak** is a known issue on `Jenkins-Master-01` that has been managed manually for over 2 years.\n\n### Current Workaround\n- Bi-weekly manual restarts of the CI/CD pipeline\n- SSH into production jump box\n- Run `restart_sync.sh`\n\n### Risk Assessment\n- **Confidence:** 98%\n- **Status:** Finalized knowledge block\n- **Source:** Sarah Jenkins, Session 2\n\nThis is classified as tribal knowledge — the procedure was never formally documented until this capture session.",
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('restart') || lower.includes('batch') || lower.includes('procedure')) return mockResponses.restart;
  if (lower.includes('who') || lower.includes('people') || lower.includes('contact') || lower.includes('person')) return mockResponses.who;
  if (lower.includes('jenkins') || lower.includes('memory') || lower.includes('leak') || lower.includes('ci/cd')) return mockResponses.jenkins;
  return mockResponses.default;
}

function KnowledgeChat({ categoryName, onClose }: { categoryName: string; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: `I'm your AI assistant for the **${categoryName}** knowledge category. I can answer questions about the captured knowledge, help you find specific information, or clarify details from the interview transcripts.\n\nWhat would you like to know?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: getResponse(userMsg) }]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="fixed inset-0 bg-card flex flex-col z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0 bg-card">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">Knowledge Assistant</p>
            <p className="text-xs text-muted-foreground">{categoryName}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 max-w-3xl mx-auto w-full">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-md'
                : 'bg-muted text-foreground rounded-bl-md'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="space-y-2">
                  {msg.content.split('\n').map((line, li) => {
                    if (line.startsWith('### ')) return <h4 key={li} className="font-semibold text-xs uppercase tracking-wider mt-2">{line.slice(4)}</h4>;
                    if (line.startsWith('- **')) return <p key={li} className="ml-2">{renderBold(line)}</p>;
                    if (line.match(/^\d+\./)) return <p key={li} className="ml-2">{renderBold(line)}</p>;
                    if (line.startsWith('⚠️')) return <p key={li} className="text-warning mt-1">{renderBold(line)}</p>;
                    if (line.trim() === '') return <br key={li} />;
                    return <p key={li}>{renderBold(line)}</p>;
                  })}
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-6 pb-2 flex flex-wrap gap-1.5 max-w-3xl mx-auto w-full">
          {['How does the restart process work?', 'Who are the key contacts?', 'Tell me about the Jenkins issue'].map(q => (
            <button
              key={q}
              onClick={() => { setInput(q); }}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border shrink-0">
        <div className="flex items-center gap-2 max-w-3xl mx-auto w-full">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about this knowledge..."
            className="flex-1 h-11 px-4 rounded-xl border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isTyping}
          />
          <Button
            size="icon"
            className="h-11 w-11 rounded-xl shrink-0"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">AI responses are based on captured knowledge blocks</p>
      </div>
    </motion.div>
  );
}

function renderBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="px-1 py-0.5 rounded bg-background/50 font-mono text-xs">{part.slice(1, -1)}</code>;
    return <span key={i}>{part}</span>;
  });
}

export default function CategoryDetail() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link to="/app/knowledge"><ArrowLeft className="w-4 h-4" /></Link></Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Critical Workflows</h1>
          <p className="text-sm text-muted-foreground">24 knowledge blocks · 4 source sessions · 87% completeness</p>
        </div>
        <motion.div
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          <Button
            onClick={() => setChatOpen(!chatOpen)}
            className={chatOpen
              ? "bg-muted text-muted-foreground hover:bg-muted/80 rounded-xl px-5 h-10 gap-2 font-semibold shadow-sm"
              : "bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-5 h-10 gap-2 font-semibold shadow-lg shadow-primary/25 ring-2 ring-primary/20"
            }
          >
            {chatOpen ? <X className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
            {chatOpen ? 'Close Chat' : 'Ask AI Assistant'}
          </Button>
        </motion.div>
      </div>

      {/* AI Prompt Banner */}
      <AnimatePresence>
        {!chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={() => setChatOpen(true)}
            className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:bg-primary/10 transition-colors group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Ask the AI Assistant about this category</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Get instant answers about procedures, key people, systems, and dependencies from captured knowledge.</p>
            </div>
            <div className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0">Click to open →</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-6">
        <h2 className="font-semibold mb-2">Category Summary</h2>
        <p className="text-sm text-muted-foreground leading-relaxed font-serif">
          This category captures mission-critical workflows that are essential for day-to-day operations. It includes manual processes, 
          automated pipeline management, vendor-dependent workflows, and incident response procedures. Several of these workflows have 
          undocumented exceptions and manual workarounds that were previously held as tribal knowledge.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground"><Users className="w-4 h-4" /> <span>Key people: Sarah Jenkins, Anna Kowalski, James Wilson</span></div>
          <div className="flex items-center gap-2 text-muted-foreground"><Server className="w-4 h-4" /> <span>Systems: Jenkins, AWS S3, PagerDuty, Vault</span></div>
          <div className="flex items-center gap-2 text-muted-foreground"><Link2 className="w-4 h-4" /> <span>Related: Vendor Relationships, Incident Response</span></div>
        </div>
      </div>

      {/* Knowledge Blocks */}
      <div className="space-y-4">
        <h2 className="font-semibold text-sm">Knowledge Blocks</h2>
        {knowledgeBlocks.map((block, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border shadow-card p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-medium">{block.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Source: {block.source} · Confidence: {block.confidence}%</p>
              </div>
              <StatusBadge status={block.status} />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2 font-serif">{block.content}</p>
          </div>
        ))}
      </div>

      {/* AI Chat Panel */}
      <AnimatePresence>
        {chatOpen && <KnowledgeChat categoryName="Critical Workflows" onClose={() => setChatOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}