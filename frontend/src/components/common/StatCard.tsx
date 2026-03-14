import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export function StatCard({ label, value, change, trend, icon }: StatCardProps) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-semibold mt-1 text-foreground">{value}</p>
          {change && (
            <p className={cn(
              "text-xs mt-1 font-medium",
              trend === 'up' ? "text-success" : trend === 'down' ? "text-destructive" : "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}