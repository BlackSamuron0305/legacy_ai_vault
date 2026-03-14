import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function NetworkPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <line x1="20%" y1="15%" x2="50%" y2="30%" stroke="rgba(255,255,255,0.08)" strokeWidth="1" className="animate-auth-float" />
      <line x1="50%" y1="30%" x2="75%" y2="20%" stroke="rgba(255,255,255,0.06)" strokeWidth="1" className="animate-auth-float-delay" />
      <line x1="30%" y1="60%" x2="60%" y2="45%" stroke="rgba(255,255,255,0.07)" strokeWidth="1" className="animate-auth-float" />
      <line x1="60%" y1="45%" x2="85%" y2="65%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" className="animate-auth-float-delay" />
      <line x1="15%" y1="75%" x2="45%" y2="55%" stroke="rgba(255,255,255,0.06)" strokeWidth="1" className="animate-auth-float" />
      <line x1="65%" y1="10%" x2="88%" y2="40%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" className="animate-auth-float-delay" />
      <line x1="35%" y1="85%" x2="55%" y2="70%" stroke="rgba(255,255,255,0.04)" strokeWidth="1" className="animate-auth-float" />

      <circle cx="20%" cy="15%" r="3" fill="rgba(255,255,255,0.2)" className="animate-auth-float" />
      <circle cx="50%" cy="30%" r="4" fill="rgba(255,255,255,0.15)" className="animate-auth-float-delay" />
      <circle cx="75%" cy="20%" r="2.5" fill="rgba(255,255,255,0.2)" className="animate-auth-float" />
      <circle cx="30%" cy="60%" r="3.5" fill="rgba(255,255,255,0.12)" className="animate-auth-float-delay" />
      <circle cx="60%" cy="45%" r="3" fill="rgba(255,255,255,0.18)" className="animate-auth-float" />
      <circle cx="85%" cy="65%" r="2" fill="rgba(255,255,255,0.15)" className="animate-auth-float-delay" />
      <circle cx="15%" cy="75%" r="2.5" fill="rgba(255,255,255,0.1)" className="animate-auth-float" />
      <circle cx="65%" cy="10%" r="3" fill="rgba(255,255,255,0.12)" className="animate-auth-float-delay" />
      <circle cx="45%" cy="55%" r="2" fill="rgba(255,255,255,0.15)" className="animate-auth-float" />
      <circle cx="88%" cy="40%" r="3.5" fill="rgba(255,255,255,0.1)" className="animate-auth-float-delay" />
      <circle cx="35%" cy="85%" r="2" fill="rgba(255,255,255,0.08)" className="animate-auth-float" />

      <circle cx="50%" cy="30%" r="12" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" className="animate-auth-pulse-slow" />
      <circle cx="60%" cy="45%" r="10" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" className="animate-auth-pulse-slow" style={{ animationDelay: '2s' }} />
    </svg>
  );
}

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, fullName, companyName);
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
        <div className="absolute top-[15%] right-[20%] w-80 h-80 rounded-full bg-violet-400/8 blur-3xl animate-auth-drift" />
        <div className="absolute bottom-[20%] left-[15%] w-72 h-72 rounded-full bg-blue-300/5 blur-3xl animate-auth-drift" style={{ animationDelay: '-10s' }} />
        <div className="absolute top-[45%] right-[40%] w-56 h-56 rounded-full bg-white/5 blur-3xl animate-auth-drift" style={{ animationDelay: '-5s' }} />

        {/* Grain texture */}
        <svg className="absolute inset-0 w-full h-full z-[1] pointer-events-none" style={{ mixBlendMode: 'overlay' }} xmlns="http://www.w3.org/2000/svg">
          <filter id="grain-r">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain-r)" opacity="0.4" />
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
            Preserve what<br />your team knows.
          </h1>
          <p className="text-white/60 text-lg max-w-md leading-relaxed animate-auth-fade-up auth-delay-2">
            Every departing employee takes years of institutional knowledge. LegacyAI captures it before they leave.
          </p>
          <div className="flex flex-col gap-3 pt-4">
            {[
              'Set up in minutes — no training needed',
              'AI conducts natural voice interviews',
              'Knowledge is extracted & searchable instantly',
              'Enterprise-grade security & encryption',
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 text-white/75 animate-auth-fade-up auth-delay-${Math.min(i + 3, 5)}`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-300/60 shrink-0" />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-white/30 text-xs">
          © 2026 LegacyAI. All rights reserved.
        </div>
      </div>

      {/* Right — Register Form (narrower) */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-6 animate-auth-fade-up">
            <div className="flex items-center gap-3">
              <img src="/logo-icon.svg" alt="LegacyAI icon" className="h-8 w-8 shrink-0 dark:invert" />
              <span className="text-sm font-semibold text-foreground">Legacy AI</span>
            </div>
          </div>
          <div className="mb-5 animate-auth-fade-up auth-delay-1">
            <h2 className="text-xl font-bold tracking-tight">Create your account</h2>
            <p className="text-muted-foreground text-sm mt-1">Start preserving institutional knowledge today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive animate-auth-fade-up">{error}</div>
            )}
            <div className="animate-auth-fade-up auth-delay-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full name</label>
              <input type="text" placeholder="Alex Rivera" value={fullName} onChange={e => setFullName(e.target.value)} required className="mt-1 w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            </div>
            <div className="animate-auth-fade-up auth-delay-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Work email</label>
              <input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            </div>
            <div className="animate-auth-fade-up auth-delay-3">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Company name</label>
              <input type="text" placeholder="Acme Corp" value={companyName} onChange={e => setCompanyName(e.target.value)} required className="mt-1 w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-2.5 animate-auth-fade-up auth-delay-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Confirm</label>
                <input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              </div>
            </div>
            <div className="animate-auth-fade-up auth-delay-5 pt-0.5">
              <Button className="w-full h-11 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 border-0 shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40" type="submit" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
              </Button>
            </div>
          </form>

          <div className="mt-4 flex items-center gap-2 justify-center text-xs text-muted-foreground animate-auth-fade-up auth-delay-5">
            <Shield className="w-3.5 h-3.5" />
            <span>Your data is encrypted and secure</span>
          </div>

          <p className="text-sm text-center text-muted-foreground mt-5 animate-auth-fade-up auth-delay-5">
            Already have an account? <Link to="/login" className="text-primary hover:underline font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}