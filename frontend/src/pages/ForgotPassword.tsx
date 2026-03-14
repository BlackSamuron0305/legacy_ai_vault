import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-6">
      {/* Glow blobs — matching Landing page */}
      <div className="glow-blob animate-float-slow absolute -top-16 left-1/4 w-[420px] h-[380px] bg-blue-300/40 pointer-events-none" />
      <div className="glow-blob animate-float-slower absolute top-8 right-0 w-[360px] h-[340px] bg-violet-300/25 pointer-events-none" />
      <div className="glow-blob absolute -bottom-8 left-0 w-[320px] h-[280px] bg-indigo-200/35 pointer-events-none" />
      <div className="glow-blob absolute top-1/2 right-1/4 w-[220px] h-[220px] bg-pink-200/20 pointer-events-none" />

      {/* Grain texture */}
      <div className="grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center gap-3 justify-center mb-4">
            <img src="/logo-icon.svg" alt="LegacyAI icon" className="h-9 w-9 shrink-0 dark:invert" />
            <span className="text-sm font-semibold text-foreground">Legacy AI</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Reset your password</h1>
          <p className="text-[13px] text-muted-foreground mt-1">We'll send you a link to reset your password</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-border p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
            <input type="email" placeholder="you@company.com" className="mt-1 w-full h-11 px-3.5 border border-border bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" />
          </div>
          <Button className="w-full h-11 text-[13px] font-semibold bg-foreground text-background hover:bg-foreground/85 border-0 transition-all">Send Reset Link</Button>
        </div>
        <div className="text-center mt-5">
          <Link to="/login" className="text-[13px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}