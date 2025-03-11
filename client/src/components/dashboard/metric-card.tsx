import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function MetricCard({ title, subtitle, children, className, actions }: MetricCardProps) {
  return (
    <Card className={cn("dashboard-card", className)}>
      <CardHeader className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium text-neutral-900">{title}</CardTitle>
            {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
          </div>
          {actions}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {children}
      </CardContent>
    </Card>
  );
}
