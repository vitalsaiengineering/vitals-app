import { MetricCard } from "./metric-card";
import { Button } from "@/components/ui/button";
import { DonutChart } from "../charts/donut-chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Format currency in millions
const formatMillions = (value: number) => {
  return `$${(value / 1000000).toFixed(1)}M`;
};

// Format percentage
const formatPercentage = (value: number) => {
  if (value > 0) {
    return `+${value.toFixed(1)}%`;
  }
  return `${value.toFixed(1)}%`;
};

interface PortfolioCardProps {
  assetAllocation: {
    assetClass: string;
    allocation: number;
    value: number;
    performance: number;
    color: string;
  }[];
}

export function PortfolioCard({ assetAllocation }: PortfolioCardProps) {
  const actions = (
    <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-500">
      <span className="material-icons">more_vert</span>
    </Button>
  );

  // Format data for donut chart
  const chartData = assetAllocation.map(asset => ({
    name: asset.assetClass,
    value: asset.value,
    color: asset.color
  }));

  return (
    <MetricCard
      title="Portfolio Allocation & Holdings"
      subtitle="By Asset Class"
      actions={actions}
      className="md:col-span-2"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <DonutChart
            data={chartData}
            height={250}
            formatter={formatMillions}
            centerLabel="Asset"
            centerValue="Allocation"
          />
        </div>

        <div className="lg:col-span-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Asset Class</TableHead>
                <TableHead className="text-xs">Allocation</TableHead>
                <TableHead className="text-xs">Value</TableHead>
                <TableHead className="text-xs">Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assetAllocation.map((asset, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center">
                      <div 
                        className="h-3 w-3 rounded-full mr-2" 
                        style={{ backgroundColor: asset.color }}
                      ></div>
                      <span className="text-sm text-neutral-900">{asset.assetClass}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-neutral-900">
                    {asset.allocation}%
                  </TableCell>
                  <TableCell className="text-sm text-neutral-900">
                    {formatMillions(asset.value)}
                  </TableCell>
                  <TableCell className={cn(
                    "text-sm",
                    asset.performance > 0 ? "text-green-600" : 
                    asset.performance < 0 ? "text-red-600" : "text-neutral-400"
                  )}>
                    {formatPercentage(asset.performance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </MetricCard>
  );
}

// Helper for className conditionals
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
