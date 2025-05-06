
import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

const cardVariants = cva(
  "rounded-xl p-6 flex items-start justify-between",
  {
    variants: {
      variant: {
        default: "bg-white border border-border shadow-sm",
        blue: "bg-blue-50 border border-blue-100",
        green: "bg-green-50 border border-green-100",
        orange: "bg-orange-50 border border-orange-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconVariants = cva(
  "p-2 rounded-lg",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        blue: "bg-blue-100 text-blue-600",
        green: "bg-green-100 text-green-600",
        orange: "bg-orange-100 text-orange-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: {
    value: string;
    positive?: boolean;
  };
  variant?: "default" | "blue" | "green" | "orange";
}

export const StatCard = ({ title, value, icon: Icon, change, variant = "default" }: StatCardProps) => {
  return (
    <div className={cn(cardVariants({ variant }))}>
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
        {change && (
          <p className={cn("text-sm flex items-center gap-1", change.positive ? "text-green-600" : "text-red-600")}>
            {change.positive ? "+" : ""}{change.value}
            {change.positive ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-down"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
            )}
          </p>
        )}
      </div>
      <div className={cn(iconVariants({ variant }))}>
        <Icon size={24} />
      </div>
    </div>
  );
};
