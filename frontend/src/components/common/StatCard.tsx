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
    <div className="bg-white border border-border p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-semibold mt-1.5 text-foreground">{value}</p>
          {change && (
            <p className={cn(
              "text-xs mt-1 font-medium",
              trend === 'up' ? "text-emerald-600" : trend === 'down' ? "text-red-600" : "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="w-9 h-9 bg-foreground/[0.06] flex items-center justify-center text-foreground">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}