import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Clock, ArrowRight, FileText, BookOpen, Upload, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useProcessingStatus, useSession } from "@/hooks/useApi";

export default function ProcessingStatus() {
  const { id } = useParams();
  const { data: processing, isLoading } = useProcessingStatus(id || "");
  const { data: session } = useSession(id || "");

  if (isLoading || !processing) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="bg-white border border-border p-8 flex items-center gap-3 text-[13px] text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading processing status...
        </div>
      </div>
    );
  }

  const completedCount = processing.steps.filter((s: any) => s.status === "completed").length;
  const progressPercent = Math.round((completedCount / Math.max(1, processing.steps.length)) * 100);

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="info">Processing</Badge>
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Knowledge Synthesis</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Processing approved transcript for {session?.employeeName || 'employee'}.</p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border border-border p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-medium">Overall Progress</span>
          <span className="text-[13px] text-muted-foreground">{progressPercent}%</span>
        </div>
        <div className="w-full h-1 bg-border overflow-hidden">
          <motion.div
            className="h-full bg-foreground"
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white border border-border p-6">
        <div className="space-y-0">
          {processing.steps.map((step: any, i: number) => (
            <div key={step.name || step.label || i} className="flex gap-4 relative">
              {/* Vertical line */}
              {i < processing.steps.length - 1 && (
                <div className={`absolute left-[15px] top-8 w-0.5 h-[calc(100%-8px)] ${
                  step.status === 'completed' ? 'bg-foreground' : 'bg-border'
                }`} />
              )}
              {/* Icon */}
              <div className="shrink-0 mt-1">
                {step.status === 'completed' && (
                  <div className="w-8 h-8 bg-foreground flex items-center justify-center">
                    <Check className="w-4 h-4 text-background" />
                  </div>
                )}
                {step.status === 'in_progress' && (
                  <div className="w-8 h-8 bg-foreground/[0.06] border-2 border-foreground flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-foreground animate-spin" />
                  </div>
                )}
                {step.status === 'pending' && (
                  <div className="w-8 h-8 bg-foreground/[0.06] border border-border flex items-center justify-center">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
              {/* Content */}
              <div className="pb-6 flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-[13px] font-medium ${step.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}>{step.name || step.label}</p>
                  <span className="text-xs text-muted-foreground">{step.status === 'in_progress' ? 'In progress...' : ''}</span>
                </div>
                {step.status === 'in_progress' && (
                  <motion.div
                    className="mt-2 bg-foreground/[0.03] border border-border p-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex items-center gap-2 text-xs text-foreground">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI service is processing transcript chunks and generating report...</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expected Outputs */}
      <div className="bg-white border border-border p-6">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-4">Expected Outputs</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 border border-border bg-foreground/[0.03] text-center">
            <FileText className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs font-medium">Handover Report</p>
          </div>
          <div className="p-3 border border-border bg-foreground/[0.03] text-center">
            <BookOpen className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs font-medium">Knowledge Summary</p>
          </div>
          <div className="p-3 border border-border bg-foreground/[0.03] text-center">
            <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs font-medium">Processing Metadata</p>
          </div>
        </div>
      </div>

      {processing.reportReady ? (
        <div className="bg-emerald-50 border border-emerald-200 p-4 text-[13px] text-emerald-700">
          Processing complete. Your report is ready to view.
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        {processing.reportReady ? (
          <>
            <Link to={`/app/sessions/${id}/report`} className="h-9 px-4 bg-foreground text-background text-[13px] font-medium flex items-center gap-1.5 hover:bg-foreground/90 transition-colors"><FileText className="w-4 h-4" /> View Report <ArrowRight className="w-4 h-4" /></Link>
            <Link to={`/app/sessions/${id}`} className="h-9 px-4 border border-border text-[13px] font-medium flex items-center gap-1.5 hover:bg-foreground/[0.04] transition-colors">Session Detail</Link>
          </>
        ) : (
          <Link to={`/app/sessions/${id}`} className="h-9 px-4 border border-border text-[13px] font-medium flex items-center gap-1.5 hover:bg-foreground/[0.04] transition-colors">View Session Detail <ArrowRight className="w-4 h-4" /></Link>
        )}
      </div>
    </div>
  );
}