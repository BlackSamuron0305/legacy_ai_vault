import { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, FileCheck, BookOpen, Upload, Shield, Users, BarChart3, Play } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { PublicHeader } from "@/components/layout/PublicHeader";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55 }
};

const howSteps = [
  { step: '01', icon: Mic, title: 'Voice Interview', desc: 'AI guides structured conversations with departing employees, asking smart follow-up questions.' },
  { step: '02', icon: FileCheck, title: 'Transcript Review', desc: 'Human reviewers verify, edit, and approve the captured transcript before any processing.' },
  { step: '03', icon: BookOpen, title: 'Knowledge Extraction', desc: 'Approved transcripts are cleaned, categorized, and structured into searchable knowledge blocks.' },
  { step: '04', icon: Upload, title: 'Export & Integrate', desc: 'Finalized knowledge exports to your documentation, knowledge base, or RAG-powered assistant.' },
];

export default function Landing() {
  const howRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: howProgress } = useScroll({
    target: howRef,
    offset: ["start 60%", "start -10%"],
  });

  // Staggered Y drops for 4 columns
  const col1Y = useTransform(howProgress, [0, 0.5], [0, 0]);
  const col2Y = useTransform(howProgress, [0.05, 0.45], [0, 60]);
  const col3Y = useTransform(howProgress, [0.1, 0.55], [0, 120]);
  const col4Y = useTransform(howProgress, [0.15, 0.65], [0, 180]);
  const colYs = [col1Y, col2Y, col3Y, col4Y];

  // Arrows fade in between columns
  const arr1Op = useTransform(howProgress, [0.15, 0.35], [0, 1]);
  const arr2Op = useTransform(howProgress, [0.25, 0.45], [0, 1]);
  const arr3Op = useTransform(howProgress, [0.35, 0.55], [0, 1]);
  const arrOps = [arr1Op, arr2Op, arr3Op];

  // Arrows drop further down
  const arr1Y = useTransform(howProgress, [0.05, 0.45], [0, 100]);
  const arr2Y = useTransform(howProgress, [0.1, 0.55], [0, 160]);
  const arr3Y = useTransform(howProgress, [0.15, 0.65], [0, 220]);
  const arrYs = [arr1Y, arr2Y, arr3Y];

  // Section bottom padding grows to contain the cascade
  const extraPad = useTransform(howProgress, [0, 0.65], [0, 180]);

  // ── Interactive transcript state ──
  const aiText = "You mentioned the 'Nightly Batch' often fails on Tuesdays. Can you walk me through the manual restart process and who needs to be notified?";
  const sarahText = "Right, so the Tuesday failure is usually due to the upstream vendor sync. You have to SSH into the production-jump box, then run the restart_sync.sh script...";
  const topics = [
    { label: 'Infrastructure', pct: 98 },
    { label: 'Vendor: Upstream', pct: 92 },
    { label: 'Manual Workarounds', pct: 86 },
  ];

  type TranscriptPhase = 'idle' | 'listening' | 'ai-typing' | 'sarah-typing' | 'done';
  const [phase, setPhase] = useState<TranscriptPhase>('idle');
  const [aiVisible, setAiVisible] = useState('');
  const [sarahVisible, setSarahVisible] = useState('');
  const [topicPcts, setTopicPcts] = useState([0, 0, 0]);
  const phaseRef = useRef<TranscriptPhase>('idle');

  const typeText = useCallback((text: string, setter: React.Dispatch<React.SetStateAction<string>>, speed: number) => {
    return new Promise<void>((resolve) => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setter(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          resolve();
        }
      }, speed);
    });
  }, []);

  const runTranscript = useCallback(async () => {
    setPhase('listening');
    phaseRef.current = 'listening';
    setAiVisible('');
    setSarahVisible('');
    setTopicPcts([0, 0, 0]);

    // Voice wave phase
    await new Promise(r => setTimeout(r, 1800));

    // AI typing
    setPhase('ai-typing');
    phaseRef.current = 'ai-typing';
    await typeText(aiText, setAiVisible, 25);
    await new Promise(r => setTimeout(r, 600));

    // Sarah speaking + topic bars
    setPhase('sarah-typing');
    phaseRef.current = 'sarah-typing';
    setTopicPcts(topics.map(t => t.pct));
    await typeText(sarahText, setSarahVisible, 22);
    await new Promise(r => setTimeout(r, 400));

    setPhase('done');
    phaseRef.current = 'done';
  }, [typeText]);

  return (
    <div className="min-h-screen bg-background overflow-x-clip">

      <PublicHeader />

      {/* ── Hero ── */}
      <section className="relative py-28 md:py-36 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="grain absolute inset-0" />
          <div className="glow-blob animate-float-slow absolute -top-24 left-1/3 w-[560px] h-[480px] bg-blue-300/40" />
          <div className="glow-blob animate-float-slower absolute top-10 right-0 w-[420px] h-[400px] bg-violet-300/25" />
          <div className="glow-blob absolute -bottom-10 left-0 w-[380px] h-[320px] bg-indigo-200/35" />
          <div className="glow-blob absolute top-1/2 right-1/4 w-[260px] h-[260px] bg-pink-200/20" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-8">
            {/* Left — Text */}
            <motion.div className="lg:w-[45%] shrink-0 pt-4" {...fadeUp}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-white/70 backdrop-blur-sm text-foreground text-sm font-medium mb-7 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/60" />
                AI-Powered Knowledge Preservation
              </div>
              <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-foreground leading-[1.1]">
                Institutional memory<br />
                shouldn't leave<br />
                when they do.
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
                LegacyAI captures critical organizational knowledge through AI-powered voice interviews before employees leave. From spoken expertise to structured, searchable company memory.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button size="xl" variant="dark" asChild>
                  <Link to="/register">Start Capturing Knowledge <ArrowRight className="w-4 h-4" /></Link>
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link to="/demo">See Demo</Link>
                </Button>
              </div>
            </motion.div>

            {/* Right — Analytics Preview (peeking off edge) */}
            <div className="lg:w-[55%] relative lg:translate-x-8 xl:translate-x-16">
              <motion.div
                className="rounded-2xl border border-border bg-white/80 backdrop-blur-sm shadow-elevated overflow-hidden transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.15)]"
                initial={{ opacity: 0, y: 40, x: 20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ duration: 0.7, delay: 0.25 }}
              >
                {/* macOS window bar */}
                <div className="bg-muted/60 px-4 py-2.5 border-b border-border flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                  </div>
                  <span className="text-[10px] text-muted-foreground ml-2">LegacyAI — Analytics</span>
                </div>

                <div className="flex">
                  {/* Mini sidebar */}
                  <div className="w-36 border-r border-border bg-muted/30 py-3 px-2.5 space-y-0.5 hidden md:block shrink-0">
                    <div className="flex items-center gap-1.5 px-2 mb-3">
                      <img src="/logo-icon.svg" alt="" className="h-3.5 w-3.5 dark:invert" />
                      <span className="text-[10px] font-semibold">LegacyAI</span>
                    </div>
                    {[
                      { label: 'Dashboard', active: false },
                      { label: 'Sessions', active: false },
                      { label: 'Knowledge Base', active: false },
                      { label: 'Reports', active: false },
                      { label: 'Employees', active: false },
                      { label: 'Analytics', active: true },
                    ].map(item => (
                      <div key={item.label} className={`px-2 py-1 text-[10px] ${item.active ? 'bg-foreground/[0.06] text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {item.label}
                      </div>
                    ))}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 p-4">
                    {/* Top bar */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-foreground">Acme Corp</span>
                        <span className="text-[8px] uppercase tracking-wider border border-foreground/20 text-foreground/60 px-1 py-px leading-none font-semibold">Company</span>
                      </div>
                      <div className="h-6 px-2.5 bg-foreground text-background text-[9px] font-medium flex items-center gap-1">
                        + New Session
                      </div>
                    </div>

                    {/* Page header */}
                    <h3 className="text-[13px] font-semibold tracking-tight">Analytics</h3>
                    <p className="text-[9px] text-muted-foreground mt-0.5 mb-4">Knowledge capture metrics and organizational coverage</p>

                    {/* Stat cards */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[
                        { label: 'Capture Completion', value: '52%', sub: 'Up from 39%' },
                        { label: 'Employees Covered', value: '3/8', sub: '5 remaining' },
                        { label: 'Transcripts Pending', value: '2', sub: 'Action needed' },
                        { label: 'Knowledge Packs', value: '5', sub: '+2 this week' },
                      ].map(s => (
                        <div key={s.label} className="border border-border p-2">
                          <div className="text-[8px] text-muted-foreground uppercase tracking-wider leading-tight">{s.label}</div>
                          <div className="text-lg font-bold mt-0.5">{s.value}</div>
                          <div className="text-[8px] text-emerald-600">{s.sub}</div>
                        </div>
                      ))}
                    </div>

                    {/* Coverage chart */}
                    <div className="border border-border p-3">
                      <p className="text-[10px] font-semibold mb-2">Coverage by Department</p>
                      <div className="space-y-2">
                        {[
                          { dept: 'Engineering', pct: 78, sessions: 4, color: 'bg-emerald-500' },
                          { dept: 'Operations', pct: 45, sessions: 1, color: 'bg-amber-400' },
                          { dept: 'Customer Success', pct: 88, sessions: 2, color: 'bg-emerald-500' },
                          { dept: 'Product', pct: 0, sessions: 0, color: 'bg-muted' },
                        ].map(d => (
                          <div key={d.dept} className="flex items-center gap-2">
                            <span className="text-[9px] text-muted-foreground w-24 shrink-0">{d.dept}</span>
                            <div className="flex-1 h-2 bg-muted/60 overflow-hidden">
                              <div className={`h-full ${d.color}`} style={{ width: `${d.pct}%` }} />
                            </div>
                            <span className="text-[9px] text-muted-foreground w-7 text-right">{d.pct}%</span>
                            <span className="text-[8px] text-muted-foreground/60 w-14">{d.sessions} ses.</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Knowledge Loss Alert */}
              <motion.div
                className="absolute -bottom-10 -left-8 md:-left-12 bg-white rounded-2xl border border-border shadow-elevated p-4 max-w-[280px] z-10"
                initial={{ opacity: 0, x: -20, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                    <svg className="w-[18px] h-[18px] text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[13px] text-foreground">Knowledge Loss Alert</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
                      Sarah Chen (Engineering Lead) leaves in <span className="font-semibold text-foreground">14 days</span> — 0% captured.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* App preview card — Interactive Transcript Session */}
          <motion.div
            className="mt-20 rounded-2xl border border-border bg-white/80 backdrop-blur-sm shadow-elevated overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <div className="bg-muted/60 px-4 py-2.5 border-b border-border flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-border" />
                <div className="w-3 h-3 rounded-full bg-border" />
                <div className="w-3 h-3 rounded-full bg-border" />
              </div>
              <span className="text-xs text-muted-foreground ml-2">LegacyAI — Knowledge Capture Session</span>
            </div>

            {phase === 'idle' ? (
              /* ── Start button state ── */
              <div className="p-16 flex flex-col items-center justify-center gap-5">
                <p className="text-sm text-muted-foreground">Click to start a simulated capture session</p>
                <button
                  onClick={runTranscript}
                  className="group relative w-20 h-20 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <Play className="w-8 h-8 ml-1" />
                  <span className="absolute inset-0 rounded-full border-2 border-foreground/30 animate-ping" />
                </button>
              </div>
            ) : (
              /* ── Active session ── */
              <div className="p-8 grid md:grid-cols-3 gap-6 min-h-[220px]">
                <div className="md:col-span-2 space-y-4">
                  {/* Voice wave animation */}
                  {phase === 'listening' && (
                    <div className="flex items-center gap-3 py-8">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Listening…</span>
                      <div className="flex items-end gap-[3px] ml-2 h-6">
                        {[...Array(12)].map((_, i) => (
                          <div
                            key={i}
                            className="w-[3px] rounded-full bg-foreground/40"
                            style={{
                              animation: `voice-wave 0.8s ease-in-out ${i * 0.07}s infinite alternate`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI question */}
                  {(phase === 'ai-typing' || phase === 'sarah-typing' || phase === 'done') && (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">LegacyAI</span>
                      </div>
                      <p className="text-foreground leading-relaxed">
                        "{aiVisible}
                        {phase === 'ai-typing' && <span className="inline-block w-[2px] h-4 bg-foreground/60 ml-0.5 animate-pulse align-text-bottom" />}
                        {(phase !== 'ai-typing') && '"'}
                      </p>
                    </>
                  )}

                  {/* Sarah response */}
                  {(phase === 'sarah-typing' || phase === 'done') && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground italic">Sarah is speaking...</p>
                      <p className="text-sm text-foreground/70 mt-2">
                        "{sarahVisible}
                        {phase === 'sarah-typing' && <span className="inline-block w-[2px] h-3.5 bg-foreground/60 ml-0.5 animate-pulse align-text-bottom" />}
                        {phase === 'done' && '"'}
                      </p>
                    </div>
                  )}

                  {/* Replay button */}
                  {phase === 'done' && (
                    <button
                      onClick={runTranscript}
                      className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                    >
                      Replay demo
                    </button>
                  )}
                </div>

                {/* Detected Topics with animated bars */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detected Topics</p>
                  {topics.map((t, i) => (
                    <div key={t.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{t.label}</span>
                        <span className="text-xs text-muted-foreground font-medium tabular-nums">{topicPcts[i]}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-foreground/20 transition-all duration-[2000ms] ease-out"
                          style={{ width: `${topicPcts[i]}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Company Carousel ── */}
      <section className="py-12 border-y border-border bg-muted/20 overflow-hidden">
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          <div className="flex animate-marquee">
            {[...Array(2)].map((_, setIdx) => (
              <div key={setIdx} className="flex shrink-0 items-center gap-20 px-10">
                {['Porsche', 'SAP', 'Siemens', 'BMW', 'Bosch', 'Deutsche Bank', 'Allianz', 'BASF', 'Continental', 'ThyssenKrupp'].map(brand => (
                  <span key={`${setIdx}-${brand}`} className="text-xl font-bold tracking-tight text-foreground/30 hover:text-foreground/50 transition-colors whitespace-nowrap shrink-0 select-none">
                    {brand}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem Stats ── */}
      <section className="py-24 relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="grain absolute inset-0" />
          <div className="glow-blob absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-blue-200/25" />
          <div className="glow-blob absolute bottom-0 right-0 w-[400px] h-[300px] bg-violet-200/20" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <h2 className="text-4xl font-semibold tracking-tight">The knowledge problem is real.</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              When experienced employees leave, they take years of undocumented processes, relationships, and critical context with them.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { tag: 'Demographics', stat: '16.5M', desc: '30% of your most seasoned experts are set to leave organizations by 2036 — a slow-building wave of lost expertise.', gradient: 'problem-card-gradient-1' },
              { tag: 'Knowledge Gap', stat: '70%', desc: "of your company's value is \"invisible\" — unprotected, living only in the minds of your employees.", gradient: 'problem-card-gradient-2' },
              { tag: 'Recovery Time', stat: '+6 mo.', desc: "It takes 6–12 months to restore productivity after key knowledge is lost. That's how long it takes to get back to baseline.", gradient: 'problem-card-gradient-3' },
            ].map((item) => (
              <div key={item.tag} className="group relative rounded-2xl overflow-hidden border border-border shadow-card cursor-default select-none">
                <div className="absolute inset-0 bg-white transition-opacity duration-500 group-hover:opacity-0" />
                <div className={`absolute inset-0 ${item.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
                <div className="relative z-10 p-7 flex flex-col h-full min-h-[240px]">
                  <span className="inline-block text-xs font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-white/60 transition-colors duration-500 mb-4">
                    {item.tag}
                  </span>
                  <p className="text-6xl font-bold text-foreground group-hover:text-white transition-colors duration-500 leading-none">
                    {item.stat}
                  </p>
                  <p className="mt-4 text-sm text-muted-foreground group-hover:text-white/80 transition-colors duration-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works (Scroll Cascade) ── */}
      <section id="how-it-works" ref={howRef} className="relative overflow-hidden bg-muted/40">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="grain absolute inset-0" />
          <div className="glow-blob animate-float-slow absolute right-0 top-0 w-[400px] h-[400px] bg-violet-200/30" />
          <div className="glow-blob animate-float-slower absolute left-0 bottom-0 w-[350px] h-[350px] bg-blue-200/25" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-8">
          <h2 className="text-3xl font-semibold tracking-tight">From spoken expertise to structured knowledge.</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl">Four steps to preserve institutional memory. Every step includes human oversight.</p>
          <div className="mt-12 grid md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-start gap-y-6">
            {howSteps.map((item, i) => (
              <>
                {i > 0 && (
                  <motion.div
                    key={`arr-${item.step}`}
                    style={{ opacity: arrOps[i - 1], y: arrYs[i - 1] }}
                    className="hidden md:flex items-center justify-center pt-14 px-1"
                  >
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                )}
                <motion.div key={item.step} style={{ y: colYs[i] }} className="relative">
                  <span className="text-6xl font-bold text-border absolute -top-2 -left-1 select-none">{item.step}</span>
                  <div className="pt-12">
                    <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center text-background mb-4">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              </>
            ))}
          </div>
        </div>
        {/* Spacer that grows as cards cascade down */}
        <motion.div style={{ height: extraPad }} aria-hidden />
        <div className="h-12" />
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="grain absolute inset-0" />
          <div className="glow-blob absolute top-1/2 left-0 w-[500px] h-[400px] bg-indigo-200/25" />
          <div className="glow-blob animate-float-slow absolute right-0 bottom-0 w-[380px] h-[300px] bg-pink-200/20" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Built for enterprise knowledge preservation.</h2>
          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {[
              { icon: Mic, title: 'Voice-First Interviews', desc: 'Natural conversation flow with AI-driven follow-up questions that probe for hidden knowledge.' },
              { icon: Shield, title: 'Human-in-the-Loop', desc: 'Transcript review and approval gates ensure accuracy before any knowledge processing begins.' },
              { icon: BookOpen, title: 'Structured Categories', desc: 'Knowledge automatically organized into workflows, stakeholders, systems, risks, and more.' },
              { icon: BarChart3, title: 'Coverage Analytics', desc: 'Track knowledge capture progress across departments and identify critical gaps.' },
              { icon: Users, title: 'Team Management', desc: 'Assign reviewers, track departing employees, and manage capture workflows at scale.' },
              { icon: Upload, title: 'RAG-Ready Export', desc: 'Export structured knowledge directly into your existing documentation or AI assistant systems.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border border-border p-6 shadow-card hover:shadow-elevated transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center text-background mb-4">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section id="use-cases" className="py-20 relative overflow-hidden bg-muted/40">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="grain absolute inset-0" />
          <div className="glow-blob animate-float-slower absolute top-0 right-0 w-[450px] h-[450px] bg-blue-200/30" />
          <div className="glow-blob absolute bottom-0 left-1/4 w-[350px] h-[300px] bg-violet-200/20" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Designed for critical transitions.</h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { title: 'Engineering Handover', desc: 'Capture infrastructure knowledge and deployment procedures.', image: '/usecase-engineering.png', slug: 'engineering-handover' },
              { title: 'Operations Offboarding', desc: 'Preserve vendor relationships and compliance workflows.', image: '/use-case-operations.png', slug: 'operations-offboarding' },
              { title: 'Customer Success Transfer', desc: 'Document account histories and stakeholder relationships.', image: '/usecase-customer-success.png', slug: 'customer-success-transfer' },
              { title: 'Executive Transition', desc: 'Capture strategic context and institutional vision.', image: '/usecase-executive.png', slug: 'executive-transition' },
            ].map((item) => (
              <Link key={item.title} to={`/use-cases/${item.slug}`} className="group">
                <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden transition-shadow duration-300 group-hover:shadow-elevated">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="grain absolute inset-0" />
          <div className="glow-blob animate-float-slow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-200/35" />
          <div className="glow-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-violet-200/25" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-semibold tracking-tight">The expertise stays.<br />The person moves on.</h2>
          <p className="mt-5 text-muted-foreground max-w-lg mx-auto text-lg">
            Start preserving institutional knowledge today. Set up in minutes.
          </p>
          <div className="mt-9 flex justify-center gap-3">
            <Button size="xl" variant="dark" asChild>
              <Link to="/register">Get Started Free <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-3">
                <img src="/logo-icon.svg" alt="LegacyAI icon" className="h-7 w-7 shrink-0 dark:invert" />
                <span className="text-sm font-semibold text-foreground">Legacy AI</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">AI-powered institutional knowledge preservation.</p>
            </div>
            <div className="flex gap-12 text-sm text-muted-foreground">
              <div className="space-y-2">
                <p className="font-medium text-foreground">Product</p>
                <Link to="/features" className="block hover:text-foreground transition-colors">Features</Link>
                <Link to="/pricing" className="block hover:text-foreground transition-colors">Pricing</Link>
                <Link to="/security" className="block hover:text-foreground transition-colors">Security</Link>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-foreground">Company</p>
                <Link to="/about" className="block hover:text-foreground transition-colors">About</Link>
                <Link to="/blog" className="block hover:text-foreground transition-colors">Blog</Link>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-foreground">Legal</p>
                <Link to="/privacy" className="block hover:text-foreground transition-colors">Privacy</Link>
                <Link to="/terms" className="block hover:text-foreground transition-colors">Terms</Link>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-sm text-muted-foreground">
            © 2026 LegacyAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}