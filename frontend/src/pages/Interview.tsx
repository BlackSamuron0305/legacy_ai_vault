import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

type TranscriptSegment = { id?: string; timestamp: string; speaker: string; text: string; orderIndex: number };

const ELEVENLABS_AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID || "agent_8901kkq04wagefmr6qtbvw8ab0z2";
const WIDGET_SCRIPT_URL = "https://unpkg.com/@elevenlabs/convai-widget-embed";

function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function findAndClickInShadowRoot(root: ShadowRoot | HTMLElement, predicate: (el: HTMLElement) => boolean): boolean {
  const visited = new Set<HTMLElement | ShadowRoot>();

  const walk = (node: HTMLElement | ShadowRoot): boolean => {
    if (visited.has(node)) return false;
    visited.add(node);

    if (node instanceof HTMLElement && predicate(node)) {
      node.click();
      return true;
    }

    const children = node instanceof ShadowRoot ? Array.from(node.children) : Array.from(node.children);
    for (const child of children) {
      const el = child as HTMLElement;
      // First walk the element itself
      if (walk(el)) return true;
      // Then, if it has a shadow root, walk inside that
      if (el.shadowRoot && walk(el.shadowRoot)) return true;
    }

    return false;
  };

  return walk(root);
}

export default function Interview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLElement | null>(null);

  const [scriptReady, setScriptReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [callActive, setCallActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [endSent, setEndSent] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    if (!document.querySelector(`script[src="${WIDGET_SCRIPT_URL}"]`)) {
      const script = document.createElement("script");
      script.src = WIDGET_SCRIPT_URL;
      script.async = true;
      script.onload = () => setScriptReady(true);
      script.onerror = () => setSessionError("Failed to load the interview widget. Please refresh the page.");
      document.body.appendChild(script);
    } else {
      setScriptReady(true);
    }
  }, []);

  useEffect(() => {
    if (!callActive) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [callActive]);

  const triggerWidgetCall = useCallback(() => {
    const el = widgetRef.current;
    if (!el) return;
    const tryTrigger = () => {
      const withShadow = (el as HTMLElement & { startCall?: () => void }).startCall;
      if (typeof withShadow === "function") {
        withShadow.call(el);
        return true;
      }
      const root = el.shadowRoot ?? el;
      return findAndClickInShadowRoot(root as ShadowRoot, (node) => {
        const t = (node.textContent ?? "").toLowerCase();
        const aria = (node.getAttribute?.("aria-label") ?? "").toLowerCase();
        return (
          (node.tagName === "BUTTON" || node.getAttribute?.("role") === "button") &&
          (t.includes("start") || t.includes("call") || t.includes("begin") || t.includes("interview") || aria.includes("start") || aria.includes("call"))
        );
      });
    };
    tryTrigger();
    requestAnimationFrame(() => {
      setTimeout(tryTrigger, 150);
    });
  }, []);

  const triggerWidgetHangup = useCallback(() => {
    const el = widgetRef.current;
    if (!el) return;
    const tryTrigger = () => {
      const withShadow = (el as HTMLElement & { endCall?: () => void }).endCall;
      if (typeof withShadow === "function") {
        withShadow.call(el);
        return;
      }
      const root = el.shadowRoot ?? el;
      findAndClickInShadowRoot(root as ShadowRoot, (node) => {
        const t = (node.textContent ?? "").toLowerCase();
        const aria = (node.getAttribute?.("aria-label") ?? "").toLowerCase();
        return (
          (node.tagName === "BUTTON" || node.getAttribute?.("role") === "button") &&
          (t.includes("end") || t.includes("hang") || t.includes("stop") || aria.includes("end") || aria.includes("hang"))
        );
      });
    };
    tryTrigger();
    requestAnimationFrame(() => setTimeout(tryTrigger, 150));
  }, []);

  useEffect(() => {
    const el = widgetContainerRef.current?.querySelector?.("elevenlabs-convai") ?? widgetRef.current ?? null;
    if (!el) return undefined;
    widgetRef.current = el as HTMLElement;
    const onStarted = (e: Event) => {
      const d = (e as CustomEvent).detail as any;
      const cid = d?.conversationId || d?.conversation_id || d?.id || null;
      // Helpful for debugging in the browser console
      // eslint-disable-next-line no-console
      console.debug("ElevenLabs conversation started event detail:", d, "resolvedId:", cid);
      if (cid) {
        conversationIdRef.current = String(cid);
        setConversationId(String(cid));
        setCallActive(true);
      }
    };
    const onEnded = (e: Event) => {
      const d = (e as CustomEvent).detail as any;
      const cid = d?.conversationId || d?.conversation_id || d?.id || null;
      // eslint-disable-next-line no-console
      console.debug("ElevenLabs conversation ended event detail:", d, "resolvedId:", cid);
      if (cid) {
        conversationIdRef.current = String(cid);
        setConversationId(String(cid));
      }
      setCallActive(false);
      setEndSent(true);
      setShowThankYou(true);
    };
    el.addEventListener("conversation_started", onStarted);
    el.addEventListener("conversation_ended", onEnded);
    el.addEventListener("conversationstarted", onStarted);
    el.addEventListener("conversationended", onEnded);
    return () => {
      el.removeEventListener("conversation_started", onStarted);
      el.removeEventListener("conversation_ended", onEnded);
      el.removeEventListener("conversationstarted", onStarted);
      el.removeEventListener("conversationended", onEnded);
    };
  }, [scriptReady]);
  useEffect(() => {
    if (!scriptReady || !widgetContainerRef.current) return;
    const el = widgetContainerRef.current.querySelector("elevenlabs-convai");
    if (el) widgetRef.current = el as HTMLElement;
  }, [scriptReady]);

  const handleStart = async () => {
    if (!id) return;
    try {
      setSessionError(null);
      await api.startSession(id);
      setCallActive(true);
      requestAnimationFrame(() => {
        setTimeout(() => triggerWidgetCall(), 100);
      });
    } catch (error: any) {
      setSessionError(error?.message ?? "Failed to start session");
    }
  };

  const handleEnd = async () => {
    if (!id) return;
    try {
      setEnding(true);

      // Step 1: hang up the widget first — this triggers the conversation_ended event
      triggerWidgetHangup();
      setCallActive(false);

      // Step 2: wait for the conversation_ended event to set conversationId via the ref
      let finalConversationId = conversationIdRef.current;
      if (!finalConversationId) {
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 500));
          if (conversationIdRef.current) {
            finalConversationId = conversationIdRef.current;
            break;
          }
        }
      }

      // Step 3: try the API fallback if still no ID
      if (!finalConversationId) {
        try {
          const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
          const response = await fetch(`${apiBase.replace(/\/api\/?$/, '')}/api/elevenlabs/latest-conversation`);
          if (response.ok) {
            const data = await response.json();
            if (data.conversation_id) {
              finalConversationId = data.conversation_id;
            }
          }
        } catch {
          // Non-critical fallback
        }
      }

      // Step 4: end the session — with or without the conversation ID
      const duration = formatDuration(elapsedSeconds);
      if (finalConversationId) {
        setConversationId(finalConversationId);
        await api.endSession(id, {
          transcript: "",
          duration,
          elevenlabsConversationId: finalConversationId,
        });
      } else {
        // End without conversation ID — backend will try to auto-fetch from ElevenLabs
        await api.endSession(id, {
          transcript: "",
          duration,
        });
      }

      setEndSent(true);
      setShowThankYou(true);
    } catch (error: any) {
      setSessionError(error?.message ?? "Failed to end session");
    } finally {
      setEnding(false);
    }
  };

  if (!scriptReady) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading interview widget...
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2">
          <Badge variant="info" className="text-xs">Interview</Badge>
          {callActive && <Badge variant="secondary" className="text-xs">Live</Badge>}
          <span className="text-xs text-muted-foreground">Conversation: {conversationId || "—"}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{formatElapsed(elapsedSeconds)}</span>
          </div>
          <Link to={`/app/sessions/${id}`} className="text-[13px] font-medium text-muted-foreground hover:text-foreground">Back to Session</Link>
        </div>
      </div>

      {sessionError && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-6 py-2 flex items-center justify-between shrink-0">
          <p className="text-xs text-destructive">{sessionError}</p>
          <button className="text-xs text-destructive underline ml-4" onClick={() => setSessionError(null)}>Dismiss</button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex items-center justify-center gap-10 p-8 overflow-y-auto">
          <div
            ref={widgetContainerRef}
            className="relative w-full max-w-3xl min-h-[420px] flex items-center justify-center bg-white border border-border rounded-lg overflow-hidden z-0 shrink-0"
          >
            <elevenlabs-convai agent-id={ELEVENLABS_AGENT_ID} variant="expanded" />
          </div>
          <div className="flex flex-col items-center justify-center gap-4 shrink-0">
            <button
              type="button"
              onClick={callActive ? handleEnd : handleStart}
              disabled={ending}
              className={[
                "w-28 h-28 rounded-full flex items-center justify-center text-base font-semibold shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:pointer-events-none",
                ending
                  ? "bg-muted text-foreground"
                  : callActive
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
              ].join(" ")}
            >
              {ending ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : callActive ? (
                "End"
              ) : (
                "Start"
              )}
            </button>
            <p className="text-xs text-muted-foreground text-center max-w-[140px]">
              {callActive ? "Click to hang up and finish." : "Click to start the call."}
            </p>
          </div>
        </div>
      </div>

      {showThankYou && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white border border-border rounded-lg p-6 space-y-4 shadow-lg">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Interview complete
              </Badge>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Thanks for sharing your knowledge</h2>
              <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
                We&apos;re processing the conversation transcript. Next, you&apos;ll be able to review and refine it before running
                any further processing.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowThankYou(false)}>
                Stay on interview
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (id) {
                    navigate(`/app/sessions/${id}/review`);
                  }
                }}
              >
                Go to transcript review
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
