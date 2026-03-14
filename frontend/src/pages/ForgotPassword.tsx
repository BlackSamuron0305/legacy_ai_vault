import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Reset your password</h1>
          <p className="text-sm text-muted-foreground mt-1">We'll send you a link to reset your password</p>
        </div>
        <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Email</label>
            <input type="email" placeholder="you@company.com" className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <Button className="w-full">Send Reset Link</Button>
        </div>
        <div className="text-center mt-4">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}