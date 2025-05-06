import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown,
  ArrowRight
} from "lucide-react";
import React from "react";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  variant?: "blue" | "green" | "red" | "purple" | "orange" | "default";
  change?: { value: string; positive?: boolean };
}

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  change,
}: StatCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "blue":
        return {
          background: "bg-gradient-to-br from-blue-50 to-blue-100/80",
          iconBg: "bg-blue-500",
          iconText: "text-white",
          valueText: "text-blue-700",
          titleText: "text-blue-900/80",
          borderAccent: "border-l-blue-500"
        };
      case "green":
        return {
          background: "bg-gradient-to-br from-green-50 to-green-100/80",
          iconBg: "bg-green-500",
          iconText: "text-white",
          valueText: "text-green-700",
          titleText: "text-green-900/80",
          borderAccent: "border-l-green-500"
        };
      case "red":
        return {
          background: "bg-gradient-to-br from-red-50 to-red-100/80",
          iconBg: "bg-red-500",
          iconText: "text-white",
          valueText: "text-red-700",
          titleText: "text-red-900/80",
          borderAccent: "border-l-red-500"
        };
      case "purple":
        return {
          background: "bg-gradient-to-br from-purple-50 to-purple-100/80",
          iconBg: "bg-purple-500",
          iconText: "text-white",
          valueText: "text-purple-700",
          titleText: "text-purple-900/80",
          borderAccent: "border-l-purple-500"
        };
      case "orange":
        return {
          background: "bg-gradient-to-br from-orange-50 to-orange-100/80",
          iconBg: "bg-orange-500",
          iconText: "text-white",
          valueText: "text-orange-700",
          titleText: "text-orange-900/80",
          borderAccent: "border-l-orange-500"
        };
      default:
        return {
          background: "bg-card",
          iconBg: "bg-primary",
          iconText: "text-primary-foreground",
          valueText: "text-foreground",
          titleText: "text-muted-foreground",
          borderAccent: "border-l-primary"
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Card className={cn("border-l-4 shadow-sm overflow-hidden group", styles.borderAccent)}>
      <CardContent className={cn("p-6", styles.background)}>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className={cn("text-sm font-medium", styles.titleText)}>{title}</p>
            <div className="flex items-baseline gap-2">
              <p className={cn("text-2xl font-bold", styles.valueText)}>{value}</p>
              
              {change && (
                <div className="flex items-center text-xs font-medium">
                  {typeof change.positive === 'boolean' ? (
                    change.positive ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <TrendingUp className="h-3 w-3" />
                        {change.value}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600">
                        <TrendingDown className="h-3 w-3" />
                        {change.value}
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <ArrowRight className="h-3 w-3" />
                      {change.value}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className={cn("p-2 rounded-md", styles.iconBg, "transition-transform group-hover:scale-110 duration-200")}>
            <Icon className={cn("h-5 w-5", styles.iconText)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}