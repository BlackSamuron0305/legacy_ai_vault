import { Badge } from "@/components/ui/badge";

type Status = string;

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "info" | "destructive" | "secondary" | "muted" }> = {
  finalized: { label: 'Finalized', variant: 'success' },
  completed: { label: 'Completed', variant: 'success' },
  approved: { label: 'Approved', variant: 'success' },
  exported: { label: 'Exported', variant: 'success' },
  active: { label: 'Active', variant: 'success' },
  reviewed: { label: 'Reviewed', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'info' },
  processing: { label: 'Processing', variant: 'info' },
  generating: { label: 'Generating', variant: 'info' },
  generated: { label: 'Generated', variant: 'info' },
  awaiting_review: { label: 'Awaiting Review', variant: 'warning' },
  awaiting_approval: { label: 'Awaiting Approval', variant: 'warning' },
  under_review: { label: 'Under Review', variant: 'warning' },
  ready: { label: 'Ready', variant: 'info' },
  scheduled: { label: 'Scheduled', variant: 'secondary' },
  draft: { label: 'Draft', variant: 'muted' },
  pending: { label: 'Pending', variant: 'muted' },
  not_started: { label: 'Not Started', variant: 'muted' },
  none: { label: 'None', variant: 'muted' },
  invited: { label: 'Invited', variant: 'secondary' },
  low: { label: 'Low', variant: 'success' },
  medium: { label: 'Medium', variant: 'warning' },
  high: { label: 'High', variant: 'destructive' },
  critical: { label: 'Critical', variant: 'destructive' },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status] || { label: status, variant: 'muted' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}