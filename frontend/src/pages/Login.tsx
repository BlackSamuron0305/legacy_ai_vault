import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, BookOpen, Brain, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function NetworkPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Animated connecting lines */}
      <line x1="15%" y1="20%" x2="45%" y2="35%" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="200" className="animate-auth-float" />
      <line x1="45%" y1="35%" x2="80%" y2="25%" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="200" className="animate-auth-float-delay" />
      <line x1="25%" y1="65%" x2="55%" y2="50%" stroke="rgba(255,255,255,0.07)" strokeWidth="1" className="animate-auth-float" />
      <line x1="55%" y1="50%" x2="85%" y2="70%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" className="animate-auth-float-delay" />
      <line x1="10%" y1="80%" x2="40%" y2="60%" stroke="rgba(255,255,255,0.06)" strokeWidth="1" className="animate-auth-float" />
      <line x1="70%" y1="15%" x2="90%" y2="45%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" className="animate-auth-float-delay" />
      <line x1="30%" y1="40%" x2="60%" y2="75%" stroke="rgba(255,255,255,0.04)" strokeWidth="1" className="animate-auth-float" />

      {/* Animated nodes */}
      <circle cx="15%" cy="20%" r="3" fill="rgba(255,255,255,0.2)" className="animate-auth-float" />
      <circle cx="45%" cy="35%" r="4" fill="rgba(255,255,255,0.15)" className="animate-auth-float-delay" />
      <circle cx="80%" cy="25%" r="2.5" fill="rgba(255,255,255,0.2)" className="animate-auth-float" />
      <circle cx="25%" cy="65%" r="3.5" fill="rgba(255,255,255,0.12)" className="animate-auth-float-delay" />
      <circle cx="55%" cy="50%" r="3" fill="rgba(255,255,255,0.18)" className="animate-auth-float" />
      <circle cx="85%" cy="70%" r="2" fill="rgba(255,255,255,0.15)" className="animate-auth-float-delay" />
      <circle cx="10%" cy="80%" r="2.5" fill="rgba(255,255,255,0.1)" className="animate-auth-float" />
      <circle cx="70%" cy="15%" r="3" fill="rgba(255,255,255,0.12)" className="animate-auth-float-delay" />
      <circle cx="40%" cy="60%" r="2" fill="rgba(255,255,255,0.15)" className="animate-auth-float" />
      <circle cx="90%" cy="45%" r="3.5" fill="rgba(255,255,255,0.1)" className="animate-auth-float-delay" />
      <circle cx="60%" cy="75%" r="2.5" fill="rgba(255,255,255,0.12)" className="animate-auth-float" />
      <circle cx="35%" cy="10%" r="2" fill="rgba(255,255,255,0.08)" className="animate-auth-float-delay" />

      {/* Pulsing halos */}
      <circle cx="45%" cy="35%" r="12" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" className="animate-auth-pulse-slow" />
      <circle cx="55%" cy="50%" r="10" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" className="animate-auth-pulse-slow" style={{ animationDelay: '2s' }} />
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
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #7c3aed 100%)' }}>
        {/* Animated orbs */}
        <div className="absolute top-[10%] left-[15%] w-72 h-72 rounded-full bg-white/5 blur-3xl animate-auth-drift" />
        <div className="absolute bottom-[15%] right-[10%] w-96 h-96 rounded-full bg-purple-400/8 blur-3xl animate-auth-drift" style={{ animationDelay: '-8s' }} />
        <div className="absolute top-[50%] left-[50%] w-64 h-64 rounded-full bg-blue-300/5 blur-3xl animate-auth-drift" style={{ animationDelay: '-14s' }} />

        {/* Grain texture */}
        <svg className="absolute inset-0 w-full h-full z-[1] pointer-events-none" style={{ mixBlendMode: 'overlay' }} xmlns="http://www.w3.org/2000/svg">
          <filter id="grain-l">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain-l)" opacity="0.4" />
        </svg>

        {/* Network pattern overlay */}
        <NetworkPattern />

        <div className="relative z-10 animate-auth-fade-up">
          <div className="flex items-center gap-3">
            <img src="/logo-icon.svg" alt="LegacyAI icon" className="h-10 w-10 shrink-0 invert" />
            <span className="text-sm font-semibold text-white">Legacy AI</span>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight animate-auth-fade-up auth-delay-1">
            Don't let knowledge<br />walk out the door.
          </h1>
          <p className="text-white/60 text-lg max-w-md leading-relaxed animate-auth-fade-up auth-delay-2">
            AI-powered voice interviews that capture institutional knowledge before employees leave.
          </p>
          <div className="flex flex-col gap-4 pt-4">
            {[
              { icon: Mic, label: 'Voice-to-Voice AI Interviews' },
              { icon: Brain, label: 'Automatic Knowledge Extraction' },
              { icon: BookOpen, label: 'Searchable Knowledge Base' },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} className={`flex items-center gap-3 text-white/80 animate-auth-fade-up auth-delay-${i + 3}`}>
                <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-white/30 text-xs">
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
            <p className="text-muted-foreground text-sm mt-1">Sign in to continue to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive animate-auth-fade-up">{error}</div>
            )}
            <div className="animate-auth-fade-up auth-delay-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
              <input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            </div>
            <div className="animate-auth-fade-up auth-delay-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot?</Link>
              </div>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            </div>
            <div className="animate-auth-fade-up auth-delay-4 pt-1">
              <Button className="w-full h-11 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 border-0 shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40" type="submit" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
              </Button>
            </div>
          </form>

          <div className="mt-5 flex items-center gap-2 justify-center text-xs text-muted-foreground animate-auth-fade-up auth-delay-5">
            <Shield className="w-3.5 h-3.5" />
            <span>Secured with enterprise-grade encryption</span>
          </div>

          <p className="text-sm text-center text-muted-foreground mt-6 animate-auth-fade-up auth-delay-5">
            Don't have an account? <Link to="/register" className="text-primary hover:underline font-semibold">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}