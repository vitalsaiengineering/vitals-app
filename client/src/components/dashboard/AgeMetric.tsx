import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAverageAge } from "@/lib/data";

interface AgeMetricProps {
  className?: string;
}

const AgeMetric: React.FC<AgeMetricProps> = ({ className }) => {
  const [averageAge, setAverageAge] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAverageAge()
      .then(age => {
        setAverageAge(age);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching average age:', error);
        setLoading(false);
      });
  }, []);

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
            {loading ? "..." : averageAge}
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
