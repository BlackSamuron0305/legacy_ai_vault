import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Building2, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JoinCompany() {
  const { user, joinCompany } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const emailDomain = user?.email?.split("@")[1] || "";

  const handleJoin = async () => {
    setLoading(true);
    setError(null);
    try {
      await joinCompany();
      setSuccess(true);
      setTimeout(() => navigate("/app", { replace: true }), 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to join company");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-12 h-12 bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold">You're in!</h2>
          <p className="text-[13px] text-muted-foreground">Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="w-12 h-12 bg-foreground/[0.06] flex items-center justify-center mx-auto">
          <Building2 className="w-6 h-6 text-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">No workspace yet</h1>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            You're not part of a company workspace yet. If your company has already registered, you
            can join using your email domain.
          </p>
        </div>

        {emailDomain && (
          <div className="border border-border p-4 space-y-3">
            <p className="text-[13px]">
              Your email domain: <span className="font-medium">@{emailDomain}</span>
            </p>
            <Button
              onClick={handleJoin}
              disabled={loading}
              className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-none text-[13px] h-9"
            >
              {loading ? "Joining…" : "Join company"}
              {!loading && <ArrowRight className="w-3.5 h-3.5 ml-1.5" />}
            </Button>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2.5 text-left border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20 p-3">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="pt-2 space-y-2">
          <p className="text-xs text-muted-foreground">
            Don't see your company? Ask your administrator to register it at{" "}
            <a href="/register/company" className="underline underline-offset-2 hover:text-foreground">
              /register/company
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
