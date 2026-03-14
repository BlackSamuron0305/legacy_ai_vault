import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, Building2, Globe, Crown, Users, Key } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function NetworkPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <line x1="20%" y1="15%" x2="50%" y2="30%" stroke="rgba(0,0,0,0.06)" strokeWidth="1" className="animate-auth-float" />
      <line x1="50%" y1="30%" x2="75%" y2="20%" stroke="rgba(0,0,0,0.05)" strokeWidth="1" className="animate-auth-float-delay" />
      <line x1="30%" y1="60%" x2="60%" y2="45%" stroke="rgba(0,0,0,0.05)" strokeWidth="1" className="animate-auth-float" />
      <line x1="60%" y1="45%" x2="85%" y2="65%" stroke="rgba(0,0,0,0.04)" strokeWidth="1" className="animate-auth-float-delay" />
      <line x1="15%" y1="75%" x2="45%" y2="55%" stroke="rgba(0,0,0,0.05)" strokeWidth="1" className="animate-auth-float" />
      <line x1="65%" y1="10%" x2="88%" y2="40%" stroke="rgba(0,0,0,0.04)" strokeWidth="1" className="animate-auth-float-delay" />
      <line x1="35%" y1="85%" x2="55%" y2="70%" stroke="rgba(0,0,0,0.03)" strokeWidth="1" className="animate-auth-float" />
      <circle cx="20%" cy="15%" r="3" fill="rgba(99,102,241,0.18)" className="animate-auth-float" />
      <circle cx="50%" cy="30%" r="4" fill="rgba(139,92,246,0.14)" className="animate-auth-float-delay" />
      <circle cx="75%" cy="20%" r="2.5" fill="rgba(59,130,246,0.18)" className="animate-auth-float" />
      <circle cx="30%" cy="60%" r="3.5" fill="rgba(99,102,241,0.12)" className="animate-auth-float-delay" />
      <circle cx="60%" cy="45%" r="3" fill="rgba(139,92,246,0.16)" className="animate-auth-float" />
      <circle cx="85%" cy="65%" r="2" fill="rgba(59,130,246,0.14)" className="animate-auth-float-delay" />
      <circle cx="15%" cy="75%" r="2.5" fill="rgba(99,102,241,0.10)" className="animate-auth-float" />
      <circle cx="65%" cy="10%" r="3" fill="rgba(139,92,246,0.12)" className="animate-auth-float-delay" />
      <circle cx="45%" cy="55%" r="2" fill="rgba(59,130,246,0.14)" className="animate-auth-float" />
      <circle cx="88%" cy="40%" r="3.5" fill="rgba(99,102,241,0.10)" className="animate-auth-float-delay" />
      <circle cx="35%" cy="85%" r="2" fill="rgba(139,92,246,0.08)" className="animate-auth-float" />
      <circle cx="50%" cy="30%" r="12" fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth="1" className="animate-auth-pulse-slow" />
      <circle cx="60%" cy="45%" r="10" fill="none" stroke="rgba(139,92,246,0.10)" strokeWidth="1" className="animate-auth-pulse-slow" style={{ animationDelay: '2s' }} />
    </svg>
  );
}

export default function RegisterCompany() {
  const [companyName, setCompanyName] = useState('');
  const [domain, setDomain] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Auto-suggest domain from email
  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (!domain && val.includes('@')) {
      setDomain(val.split('@')[1] || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!companyName.trim()) { setError('Company name is required'); return; }
    if (!domain.trim()) { setError('Email domain is required'); return; }
    setLoading(true);
    try {
      await register(email, password, fullName, companyName, domain);
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-6 animate-auth-fade-up">
            <div className="flex items-center gap-3">
              <img src="/logo-icon.svg" alt="LegacyAI icon" className="h-8 w-8 shrink-0 dark:invert" />
              <span className="text-sm font-semibold text-foreground">Legacy AI</span>
            </div>
          </div>

          <div className="mb-5 animate-auth-fade-up auth-delay-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold tracking-tight">Register Company</h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider border border-foreground/25 text-foreground/70 px-1.5 py-0.5 leading-none">Company</span>
            </div>
            <p className="text-muted-foreground text-[13px]">Create a workspace for your organization</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="bg-red-50 border border-red-200 p-3 text-[13px] text-red-600 animate-auth-fade-up">{error}</div>
            )}

            {/* Company section */}
            <div className="space-y-3 animate-auth-fade-up auth-delay-2">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Building2 className="w-3 h-3" /> Company
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Company name</label>
                <input type="text" placeholder="Acme Corp" value={companyName} onChange={e => setCompanyName(e.target.value)} required className="mt-1 w-full h-11 px-3.5 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email domain</label>
                <div className="mt-1 flex items-center border border-border bg-white focus-within:ring-1 focus-within:ring-foreground/20">
                  <span className="pl-3.5 text-[13px] text-muted-foreground select-none">@</span>
                  <input type="text" placeholder="acme.com" value={domain} onChange={e => setDomain(e.target.value)} required className="flex-1 h-11 px-2 bg-transparent text-[13px] focus:outline-none" />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">Team members with @{domain || 'your-domain.com'} emails auto-join your workspace</p>
              </div>
            </div>

            <div className="h-px bg-border animate-auth-fade-up auth-delay-3" />

            {/* Owner account section */}
            <div className="space-y-3 animate-auth-fade-up auth-delay-3">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Crown className="w-3 h-3" /> Your Account
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full name</label>
                <input type="text" placeholder="Alex Rivera" value={fullName} onChange={e => setFullName(e.target.value)} required className="mt-1 w-full h-11 px-3.5 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Work email</label>
                <input type="email" placeholder="you@acme.com" value={email} onChange={e => handleEmailChange(e.target.value)} required className="mt-1 w-full h-11 px-3.5 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                  <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 w-full h-11 px-3.5 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Confirm</label>
                  <input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 w-full h-11 px-3.5 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" />
                </div>
              </div>
            </div>

            <div className="animate-auth-fade-up auth-delay-4 pt-1">
              <Button className="w-full h-11 text-[13px] font-semibold bg-foreground text-background hover:bg-foreground/85 border-0 transition-all" type="submit" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating workspace...</> : 'Create Company Workspace'}
              </Button>
            </div>
          </form>

          <div className="mt-4 flex items-center gap-2 justify-center text-xs text-muted-foreground animate-auth-fade-up auth-delay-5">
            <Shield className="w-3.5 h-3.5" />
            <span>Your data is encrypted and secure</span>
          </div>

          <div className="mt-5 space-y-2 text-center animate-auth-fade-up auth-delay-5">
            <p className="text-[13px] text-muted-foreground">
              Want to join an existing company? <Link to="/register" className="text-foreground hover:underline font-semibold">Register here</Link>
            </p>
            <p className="text-[13px] text-muted-foreground">
              Already have an account? <Link to="/login" className="text-foreground hover:underline font-semibold">Sign in</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right — Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between items-end p-12 bg-background text-right">
        <div className="glow-blob animate-float-slower absolute top-[8%] right-[15%] w-[380px] h-[380px] bg-violet-300/25" />
        <div className="glow-blob animate-float-slow absolute bottom-[15%] left-[10%] w-[340px] h-[320px] bg-blue-300/40" />
        <div className="glow-blob absolute top-[40%] right-[35%] w-[240px] h-[240px] bg-indigo-200/35" />
        <div className="glow-blob absolute top-[20%] left-[5%] w-[200px] h-[180px] bg-pink-200/20" />
        <div className="grain absolute inset-0 z-[1] pointer-events-none" />
        <NetworkPattern />

        <div className="relative z-10 animate-auth-fade-up">
          <div className="flex items-center gap-3 justify-end">
            <span className="text-sm font-semibold text-foreground">Legacy AI</span>
            <img src="/logo-icon.svg" alt="LegacyAI icon" className="h-10 w-10 shrink-0 dark:invert" />
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-foreground leading-tight animate-auth-fade-up auth-delay-1">
            Set up your<br />company workspace.
          </h1>
          <p className="text-muted-foreground text-lg max-w-md ml-auto leading-relaxed animate-auth-fade-up auth-delay-2">
            As the owner, you'll create your company's workspace. Team members can then join automatically using their company email.
          </p>
          <div className="flex flex-col gap-3 pt-4 items-end">
            {[
              { icon: Building2, text: 'Create your company workspace' },
              { icon: Globe, text: 'Set email domain for auto-join' },
              { icon: Crown, text: 'You become the workspace owner' },
              { icon: Users, text: 'Team members join with company email' },
              { icon: Key, text: 'Manage your team from the company panel' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className={`flex items-center gap-3 text-foreground/75 animate-auth-fade-up auth-delay-${Math.min(i + 3, 5)}`}>
                <span className="text-[13px] font-medium">{text}</span>
                <Icon className="w-4 h-4 text-foreground/40 shrink-0" />
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-muted-foreground/50 text-xs">
          © 2026 LegacyAI. All rights reserved.
        </div>
      </div>
    </div>
  );
}
