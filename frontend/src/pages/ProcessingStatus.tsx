import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Clock, ArrowRight, FileText, BookOpen, Upload, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  { label: 'Transcript Approved', status: 'done', time: '2 min ago' },
  { label: 'Cleaning Transcript', desc: 'Removing filler words, normalizing formatting', status: 'done', time: '1 min ago' },
  { label: 'Detecting Topics', desc: 'Identifying knowledge domains and categories', status: 'done', time: '45s ago' },
  { label: 'Extracting Structured Knowledge', desc: 'Organizing insights into structured blocks', status: 'active', time: 'In progress...' },
  { label: 'Organizing into Categories', desc: 'Mapping knowledge to organizational categories', status: 'pending', time: '' },
  { label: 'Generating Handover Report', desc: 'Creating formatted documentation', status: 'pending', time: '' },
  { label: 'Preparing Export Assets', desc: 'RAG chunks, structured documents, metadata', status: 'pending', time: '' },
  { label: 'Finalizing Outputs', desc: 'Quality checks and final formatting', status: 'pending', time: '' },
];

export default function ProcessingStatus() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="info">Processing</Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Knowledge Synthesis</h1>
        <p className="text-sm text-muted-foreground mt-1">Processing approved transcript for Sarah Jenkins — Engineering Lead Offboarding</p>
      </div>

      {/* Progress Bar */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm text-muted-foreground">37%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '37%' }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-6">
        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={step.label} className="flex gap-4 relative">
              {/* Vertical line */}
              {i < steps.length - 1 && (
                <div className={`absolute left-[15px] top-8 w-0.5 h-[calc(100%-8px)] ${
                  step.status === 'done' ? 'bg-primary' : 'bg-border'
                }`} />
              )}
              {/* Icon */}
              <div className="shrink-0 mt-1">
                {step.status === 'done' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                {step.status === 'active' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                )}
                {step.status === 'pending' && (
                  <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
              {/* Content */}
              <div className="pb-6 flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${step.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}>{step.label}</p>
                  <span className="text-xs text-muted-foreground">{step.time}</span>
                </div>
                {step.desc && <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>}
                {step.status === 'active' && (
                  <motion.div
                    className="mt-2 bg-primary/5 border border-primary/10 rounded-lg p-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex items-center gap-2 text-xs text-primary">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Extracting knowledge from 12 transcript segments...</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expected Outputs */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-6">
        <h3 className="font-semibold text-sm mb-4">Expected Outputs</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl border border-border bg-muted/30 text-center">
            <FileText className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs font-medium">Handover Report</p>
          </div>
          <div className="p-3 rounded-xl border border-border bg-muted/30 text-center">
            <BookOpen className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs font-medium">18 Knowledge Blocks</p>
          </div>
          <div className="p-3 rounded-xl border border-border bg-muted/30 text-center">
            <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs font-medium">RAG Export Pack</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <Link to="/app/sessions/s1">View Session Detail <ArrowRight className="w-4 h-4" /></Link>
        </Button>
      </div>
    </div>
  );
}