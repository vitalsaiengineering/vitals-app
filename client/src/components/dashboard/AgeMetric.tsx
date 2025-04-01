import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAverageAge } from "@/lib/clientData";
import { useAuth } from "@/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";

interface AgeMetricProps {
  className?: string;
}

const AgeMetric: React.FC<AgeMetricProps> = ({ className }) => {
  const { user } = useAuth();
  const [averageAge, setAverageAge] = useState<number>(0);
  
  const { isLoading, error } = useQuery({
    queryKey: ['averageClientAge', user?.id],
    queryFn: async () => {
      // Pass the user ID to getAverageAge to get clients specific to this advisor
      return await getAverageAge(user?.id);
    },
    onSuccess: (data) => {
      setAverageAge(data);
    },
    enabled: !!user // Only run query if user is logged in
  });

  return (
    <Card className={`overflow-hidden animate-fade-in-up ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Average Client Age
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div className="text-5xl font-bold tracking-tight animate-scale-in">
            {isLoading ? "..." : averageAge}
            <span className="ml-1 text-base font-normal text-muted-foreground">
              years
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgeMetric;
