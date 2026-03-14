import { useState, useRef, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ArrowLeft, FileText, Users, Server, Link2, MessageSquare, X, Send, Brain, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCategoryDetail, useCategoryChat } from "@/hooks/useApi";

type ChatMessage = { role: 'user' | 'assistant'; content: string };

function KnowledgeChat({ categoryName, onClose }: { categoryName: string; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: `I'm your AI assistant for the **${categoryName}** knowledge category. I can answer questions about the captured knowledge, help you find specific information, or clarify details from the interview transcripts.\n\nWhat would you like to know?` }
  ]);
  const [input, setInput] = useState('');
  const chatMutation = useCategoryChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, chatMutation.isPending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');

    chatMutation.mutate(
      { categoryName, question: userMsg, history: messages },
      {
        onSuccess: (data: any) => {
          setMessages(prev => [...prev, { role: 'assistant', content: data.answer || data.response || 'No response received.' }]);
        },
        onError: () => {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process your question. Please try again.' }]);
        },
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="fixed inset-0 bg-white flex flex-col z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-foreground flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-background" />
          </div>
          <div>
            <p className="text-[13px] font-semibold">Knowledge Assistant</p>
            <p className="text-xs text-muted-foreground">{categoryName}</p>
          </div>
        </div>
        <button className="h-8 w-8 flex items-center justify-center hover:bg-foreground/[0.04] transition-colors" onClick={onClose}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 max-w-3xl mx-auto w-full">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] px-4 py-3 text-[13px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-foreground text-background'
                : 'bg-foreground/[0.06] text-foreground'
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

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-6 pb-2 flex flex-wrap gap-1.5 max-w-3xl mx-auto w-full">
          {['What are the key procedures?', 'Who are the key contacts?', 'What are the main risks?'].map(q => (
            <button
              key={q}
              onClick={() => { setInput(q); }}
              className="text-xs px-2.5 py-1.5 border border-border bg-foreground/[0.03] text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors"
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
  const { id } = useParams();
  const categoryName = decodeURIComponent(id || '');
  const { data: category, isLoading } = useCategoryDetail(categoryName);
  const [chatOpen, setChatOpen] = useState(false);

  const cards = category?.cards || category?.knowledgeCards || [];
  const cardCount = cards.length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link to="/app/knowledge"><ArrowLeft className="w-4 h-4" /></Link></Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{categoryName}</h1>
          <p className="text-[13px] text-muted-foreground">{cardCount} knowledge blocks</p>
        </div>
        <motion.div
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={chatOpen
              ? "h-9 px-5 border border-border text-[13px] font-semibold text-muted-foreground hover:bg-foreground/[0.04] flex items-center gap-2 transition-colors"
              : "h-9 px-5 bg-foreground text-background text-[13px] font-semibold flex items-center gap-2 hover:bg-foreground/90 transition-colors"
            }
          >
            {chatOpen ? <X className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
            {chatOpen ? 'Close Chat' : 'Ask AI Assistant'}
          </button>
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
            className="bg-foreground/[0.03] border border-border p-5 flex items-center gap-4 cursor-pointer hover:bg-foreground/[0.06] transition-colors group"
          >
            <div className="w-12 h-12 bg-foreground flex items-center justify-center shrink-0">
              <Brain className="w-6 h-6 text-background" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[13px]">Ask the AI Assistant about this category</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Get instant answers about procedures, key people, systems, and dependencies from captured knowledge.</p>
            </div>
            <div className="text-xs text-foreground font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0">Click to open →</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary */}
      {category?.summary && (
        <div className="bg-white border border-border p-6">
          <h2 className="font-semibold text-[13px] uppercase tracking-wide text-muted-foreground mb-2">Category Summary</h2>
          <p className="text-[13px] text-muted-foreground leading-relaxed font-serif">{category.summary}</p>
        </div>
      )}

      {/* Knowledge Blocks */}
      <div className="space-y-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Knowledge Blocks ({cardCount})</h2>
        {cards.length === 0 && <p className="text-[13px] text-muted-foreground">No knowledge blocks captured yet.</p>}
        {cards.map((block: any, i: number) => (
          <div key={block.id || i} className="bg-white border border-border p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-medium">{block.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{block.sourceName ? `Source: ${block.sourceName}` : ''}{block.confidence ? ` · Confidence: ${block.confidence}%` : ''}</p>
              </div>
              {block.status && <StatusBadge status={block.status} />}
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed mt-2 font-serif">{block.content}</p>
          </div>
        ))}
      </div>

      {/* AI Chat Panel */}
      <AnimatePresence>
        {chatOpen && <KnowledgeChat categoryName={categoryName} onClose={() => setChatOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}