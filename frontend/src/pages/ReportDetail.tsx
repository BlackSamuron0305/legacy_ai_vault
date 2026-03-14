import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ArrowLeft, Download, CheckCircle2, BookOpen, Users, Server } from "lucide-react";

export default function ReportDetail() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link to="/app/reports"><ArrowLeft className="w-4 h-4" /></Link></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Engineering Lead Offboarding — Sarah Jenkins</h1>
            <StatusBadge status="finalized" />
          </div>
          <p className="text-sm text-muted-foreground">Handover Report · Generated Mar 10, 2026</p>
        </div>
        <Button variant="outline" size="sm"><Download className="w-4 h-4" /> Export PDF</Button>
      </div>

      {/* Report Content */}
      <div className="bg-card rounded-2xl border border-border shadow-card">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <Badge variant="success">Approved & Finalized</Badge>
          </div>
          <h2 className="text-2xl font-semibold font-serif">Engineering Lead Offboarding Report</h2>
          <p className="text-muted-foreground mt-2">Knowledge capture summary for Sarah Jenkins, Senior Staff Engineer</p>
          <div className="mt-4 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span>Department: Engineering</span>
            <span>Tenure: 8 years</span>
            <span>Sessions: 2</span>
            <span>Knowledge Blocks: 18</span>
          </div>
        </div>

        <div className="p-6 space-y-8 font-serif">
          <section>
            <h3 className="text-lg font-semibold mb-3">Executive Summary</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sarah Jenkins has been the primary maintainer of Acme Corp's CI/CD infrastructure, production deployment systems, and nightly batch processing 
              for 8 years. She holds critical institutional knowledge about manual workarounds, vendor dependencies, incident escalation procedures, and 
              access management that is not documented elsewhere. This report captures 18 knowledge blocks across 6 categories from 2 interview sessions.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">Critical Workflows</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-border bg-muted/20">
                <h4 className="font-semibold text-sm">Nightly Batch Process Management</h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  The nightly batch process requires manual intervention on Tuesdays and Thursdays. Before restarting, operators must verify the S3 bucket 
                  size (threshold: 500GB) and coordinate with the data team lead (Anna Kowalski) to confirm upstream data completeness from Acme Corp.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-muted/20">
                <h4 className="font-semibold text-sm">CI/CD Pipeline — Jenkins Memory Leak</h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Jenkins-Master-01 has a known memory leak requiring bi-weekly manual restarts. This has been managed manually for over 2 years. 
                  The restart procedure involves SSH access to the production jump box and execution of the restart_sync.sh script.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">Vendor Dependencies</h3>
            <div className="space-y-3">
              {['Acme Corp — Upstream data sync, timezone-dependent delivery', 'DataFlow Inc — Monthly API updates, 6am sync window', 'CloudMetrics — Custom auth adapter, private repo access'].map((v, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">Action Items</h3>
            <div className="space-y-2">
              {[
                'Transfer CloudMetrics adapter repo to shared GitHub organization',
                'Grant David Park access to critical infrastructure repos',
                'Document Jenkins restart procedure in runbook',
                'Create shared credentials for Vault secrets',
                'Update PagerDuty escalation policies for payment incidents',
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded border border-border shrink-0" />
                  <span className="text-muted-foreground">{a}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Generated by LegacyAI · Approved by Alex Rivera on Mar 10, 2026</span>
            <span>Linked categories: Critical Workflows, Vendor Relationships, Incident Response, Security Protocols</span>
          </div>
        </div>
      </div>
    </div>
  );
}