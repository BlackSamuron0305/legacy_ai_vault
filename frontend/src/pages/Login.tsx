import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, BookOpen, Brain, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function NetworkPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Animated connecting lines */}
      <line x1="15%" y1="20%" x2="45%" y2="35%" stroke="rgba(0,0,0,0.06)" strokeWidth="1" strokeDasharray="200" className="animate-auth-float" />
      <line x1="45%" y1="35%" x2="80%" y2="25%" stroke="rgba(0,0,0,0.05)" strokeWidth="1" strokeDasharray="200" className="animate-auth-float-delay" />
      <line x1="25%" y1="65%" x2="55%" y2="50%" stroke="rgba(0,0,0,0.05)" strokeWidth="1" className="animate-auth-float" />
      <line x1="55%" y1="50%" x2="85%" y2="70%" stroke="rgba(0,0,0,0.04)" strokeWidth="1" className="animate-auth-float-delay" />
      <line x1="10%" y1="80%" x2="40%" y2="60%" stroke="rgba(0,0,0,0.05)" strokeWidth="1" className="animate-auth-float" />
      <line x1="70%" y1="15%" x2="90%" y2="45%" stroke="rgba(0,0,0,0.04)" strokeWidth="1" className="animate-auth-float-delay" />
      <line x1="30%" y1="40%" x2="60%" y2="75%" stroke="rgba(0,0,0,0.03)" strokeWidth="1" className="animate-auth-float" />

      {/* Animated nodes */}
      <circle cx="15%" cy="20%" r="3" fill="rgba(99,102,241,0.18)" className="animate-auth-float" />
      <circle cx="45%" cy="35%" r="4" fill="rgba(139,92,246,0.14)" className="animate-auth-float-delay" />
      <circle cx="80%" cy="25%" r="2.5" fill="rgba(59,130,246,0.18)" className="animate-auth-float" />
      <circle cx="25%" cy="65%" r="3.5" fill="rgba(99,102,241,0.12)" className="animate-auth-float-delay" />
      <circle cx="55%" cy="50%" r="3" fill="rgba(139,92,246,0.16)" className="animate-auth-float" />
      <circle cx="85%" cy="70%" r="2" fill="rgba(59,130,246,0.14)" className="animate-auth-float-delay" />
      <circle cx="10%" cy="80%" r="2.5" fill="rgba(99,102,241,0.10)" className="animate-auth-float" />
      <circle cx="70%" cy="15%" r="3" fill="rgba(139,92,246,0.12)" className="animate-auth-float-delay" />
      <circle cx="40%" cy="60%" r="2" fill="rgba(59,130,246,0.14)" className="animate-auth-float" />
      <circle cx="90%" cy="45%" r="3.5" fill="rgba(99,102,241,0.10)" className="animate-auth-float-delay" />
      <circle cx="60%" cy="75%" r="2.5" fill="rgba(139,92,246,0.12)" className="animate-auth-float" />
      <circle cx="35%" cy="10%" r="2" fill="rgba(59,130,246,0.08)" className="animate-auth-float-delay" />

      {/* Pulsing halos */}
      <circle cx="45%" cy="35%" r="12" fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth="1" className="animate-auth-pulse-slow" />
      <circle cx="55%" cy="50%" r="10" fill="none" stroke="rgba(139,92,246,0.10)" strokeWidth="1" className="animate-auth-pulse-slow" style={{ animationDelay: '2s' }} />
    </svg>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding with animated network */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-12 bg-background">
        {/* Glow blobs — matching Landing page */}
        <div className="glow-blob animate-float-slow absolute -top-16 left-1/4 w-[420px] h-[380px] bg-blue-300/40" />
        <div className="glow-blob animate-float-slower absolute top-8 right-0 w-[360px] h-[340px] bg-violet-300/25" />
        <div className="glow-blob absolute -bottom-8 left-0 w-[320px] h-[280px] bg-indigo-200/35" />
        <div className="glow-blob absolute top-1/2 right-1/4 w-[220px] h-[220px] bg-pink-200/20" />

        {/* Grain texture */}
        <div className="grain absolute inset-0 z-[1] pointer-events-none" />

        {/* Network pattern overlay */}
        <NetworkPattern />

        <div className="relative z-10 animate-auth-fade-up">
          <div className="flex items-center gap-3">
            <img src="/logo-icon.svg" alt="LegacyAI icon" className="h-10 w-10 shrink-0 dark:invert" />
            <span className="text-sm font-semibold text-foreground">Legacy AI</span>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-foreground leading-tight animate-auth-fade-up auth-delay-1">
            Don't let knowledge<br />walk out the door.
          </h1>
          <p className="text-muted-foreground text-lg max-w-md leading-relaxed animate-auth-fade-up auth-delay-2">
            AI-powered voice interviews that capture institutional knowledge before employees leave.
          </p>
          <div className="flex flex-col gap-4 pt-4">
            {[
              { icon: Mic, label: 'Voice-to-Voice AI Interviews' },
              { icon: Brain, label: 'Automatic Knowledge Extraction' },
              { icon: BookOpen, label: 'Searchable Knowledge Base' },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} className={`flex items-center gap-3 text-foreground/80 animate-auth-fade-up auth-delay-${i + 3}`}>
                <div className="w-9 h-9 bg-foreground/[0.06] backdrop-blur-sm flex items-center justify-center border border-border">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[13px] font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-muted-foreground/50 text-xs">
          © 2026 LegacyAI. All rights reserved.
        </div>
      </div>

      {/* Right — Login Form (narrower) */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 animate-auth-fade-up">
            <div className="flex items-center gap-3">
              <img src="/logo-icon.svg" alt="LegacyAI icon" className="h-8 w-8 shrink-0 dark:invert" />
              <span className="text-sm font-semibold text-foreground">Legacy AI</span>
            </div>
          </div>
          <div className="mb-6 animate-auth-fade-up auth-delay-1">
            <h2 className="text-xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground text-[13px] mt-1">Sign in to continue to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 p-3 text-[13px] text-red-600 animate-auth-fade-up">{error}</div>
            )}
            <div className="animate-auth-fade-up auth-delay-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
              <input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 w-full h-11 px-3.5 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" />
            </div>
            <div className="animate-auth-fade-up auth-delay-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-xs text-foreground hover:underline">Forgot?</Link>
              </div>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 w-full h-11 px-3.5 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" />
            </div>
            <div className="animate-auth-fade-up auth-delay-4 pt-1">
              <Button className="w-full h-11 text-[13px] font-semibold bg-foreground text-background hover:bg-foreground/85 border-0 transition-all" type="submit" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
              </Button>
            </div>
          </form>

          <div className="mt-5 flex items-center gap-2 justify-center text-xs text-muted-foreground animate-auth-fade-up auth-delay-5">
            <Shield className="w-3.5 h-3.5" />
            <span>Secured with enterprise-grade encryption</span>
          </div>

          <p className="text-[13px] text-center text-muted-foreground mt-6 animate-auth-fade-up auth-delay-5">
            Don't have an account? <Link to="/register" className="text-foreground hover:underline font-semibold">Create one</Link>
          </p>
          <p className="text-[13px] text-center text-muted-foreground mt-2 animate-auth-fade-up auth-delay-5">
            Setting up for your company? <Link to="/register/company" className="text-foreground hover:underline font-semibold">Register Company</Link>
          </p>
        </div>
      </div>
    </div>
  );
}