import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem
} from "@/components/ui/toggle-group";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface OpportunityStage {
  stage: string;
  stageId: string;
  count: number;
}

interface OpportunityPipeline {
  pipeline: string;
  stages: OpportunityStage[];
  totalCount: number;
}

interface OpportunitiesCardProps {
  wealthboxToken?: string;
}

export function OpportunitiesCard({ wealthboxToken }: OpportunitiesCardProps) {
  const [viewMode, setViewMode] = useState<'pipeline' | 'stage'>('pipeline');
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  
  // Fetch opportunities data based on view mode
  const { 
    data: opportunitiesData, 
    isLoading 
  } = useQuery({
    queryKey: [
      viewMode === 'pipeline' 
        ? '/api/wealthbox/opportunities/by-pipeline' 
        : '/api/wealthbox/opportunities/by-stage',
      wealthboxToken
    ],
    queryFn: async () => {
      // Only fetch if we have a token
      if (!wealthboxToken) return null;
      
      const endpoint = viewMode === 'pipeline' 
        ? '/api/wealthbox/opportunities/by-pipeline' 
        : '/api/wealthbox/opportunities/by-stage';
      
      const url = new URL(endpoint, window.location.origin);
      url.searchParams.append('access_token', wealthboxToken);
      
      const response = await fetch(url.toString(), { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch opportunities data');
      return response.json();
    },
    enabled: !!wealthboxToken,
  });
  
  // Reset selected pipeline when changing view mode
  useEffect(() => {
    setSelectedPipeline(null);
  }, [viewMode]);
  
  // Set first pipeline as selected when data loads
  useEffect(() => {
    if (opportunitiesData?.data?.pipelines?.length > 0 && !selectedPipeline) {
      setSelectedPipeline(opportunitiesData.data.pipelines[0].pipeline);
    }
  }, [opportunitiesData, selectedPipeline]);
  
  if (!wealthboxToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Advisor Opportunities</CardTitle>
          <CardDescription>Connect WealthBox to view opportunities data</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>No data available. Connect your WealthBox account to view opportunities.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Advisor Opportunities</CardTitle>
          <CardDescription>Loading opportunities data...</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full inline-block mb-4"></div>
            <p>Loading opportunities data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Prepare chart data
  let chartData: Record<string, any>[] = [];
  let pipelines: string[] = [];
  
  if (opportunitiesData?.success && opportunitiesData?.data) {
    if (viewMode === 'pipeline') {
      // For pipeline view, get all pipelines
      pipelines = opportunitiesData.data.pipelines.map((p: OpportunityPipeline) => p.pipeline);
      
      // If a pipeline is selected, show the stages for that pipeline
      if (selectedPipeline) {
        const pipeline = opportunitiesData.data.pipelines.find(
          (p: OpportunityPipeline) => p.pipeline === selectedPipeline
        );
        
        if (pipeline) {
          // Prepare data for stacked bar chart by month
          // For now, we'll simulate monthly data as the API doesn't provide this directly
          const months = [
            'Jan 2023', 'Feb 2023', 'Mar 2023', 'Apr 2023', 'May 2023', 'Jun 2023',
            'Jul 2023', 'Aug 2023', 'Sep 2023', 'Oct 2023', 'Nov 2023', 'Dec 2023'
          ];
          
          // Get unique stages (now with human-readable names)
          const stages = pipeline.stages.map((stage: OpportunityStage) => stage.stage);
          
          // Create monthly chart data with counts for each stage
          chartData = months.map(month => {
            const monthData: Record<string, any> = { month };
            
            // Distribute opportunity counts across months for visualization purposes
            // In a real implementation, this would come from the actual data
            pipeline.stages.forEach((stageData: OpportunityStage) => {
              // Simulate varying counts per month (random distribution)
              const baseCount = stageData.count / 12;
              const randomFactor = 0.5 + Math.random();
              monthData[stageData.stage] = Math.round(baseCount * randomFactor);
              // Add color mapping
              monthData[`${stageData.stage}Color`] = getStageColor(stageData.stage);
              // Store the stageId for reference if needed
              monthData[`${stageData.stage}Id`] = stageData.stageId;
            });
            
            return monthData;
          });
        }
      }
    } else {
      // For stage view, we now have human-readable stage names directly from the API
      // Convert the stages array directly to chart format
      chartData = opportunitiesData.data.stages.map((stage: OpportunityStage) => ({
        stage: stage.stage, // This is now the human-readable name
        count: stage.count,
        stageId: stage.stageId, // Keep the stageId for reference
        color: getStageColor(stage.stage)
      }));
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <CardTitle>Advisor Opportunities</CardTitle>
            <CardDescription>View opportunities by pipeline or stage</CardDescription>
          </div>
          <div className="mt-4 md:mt-0 space-y-2 md:space-y-0 md:space-x-2 flex flex-col md:flex-row items-start md:items-center">
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'pipeline' | 'stage')}>
              <ToggleGroupItem value="pipeline">By Pipeline</ToggleGroupItem>
              <ToggleGroupItem value="stage">By Stage</ToggleGroupItem>
            </ToggleGroup>
            
            {viewMode === 'pipeline' && pipelines.length > 0 && (
              <Select value={selectedPipeline || ''} onValueChange={setSelectedPipeline}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map((pipeline) => (
                    <SelectItem key={pipeline} value={pipeline}>
                      {pipeline}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p>No opportunities data available for the selected view.</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'pipeline' ? (
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 65 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-45} 
                  textAnchor="end"
                  tick={{ fontSize: 12 }}
                  height={60}
                />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  `${value} opportunities`, 
                  name
                ]} />
                <Legend 
                  verticalAlign="top" 
                  wrapperStyle={{ paddingBottom: 10 }} 
                  formatter={(value) => <span style={{ color: getStageColor(value) }}>{value}</span>}
                />
                {chartData.length > 0 && 
                  Object.keys(chartData[0])
                    .filter(key => 
                      !['month', 'date'].includes(key) && 
                      !key.endsWith('Color') && 
                      !key.endsWith('Id')
                    )
                    .map((stage) => (
                      <Bar 
                        key={stage} 
                        dataKey={stage} 
                        stackId="a" 
                        fill={getStageColor(stage)} 
                        name={stage}
                      />
                    ))
                }
              </BarChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 65 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="stage" 
                  angle={-45} 
                  textAnchor="end"
                  tick={{ fontSize: 12 }}
                  height={60}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name, props) => {
                    const stageId = props.payload[0]?.payload.stageId;
                    return [`${value} opportunities`, `${props.payload[0]?.payload.stage}${stageId ? ` (ID: ${stageId})` : ''}`];
                  }} 
                />
                {/* Create a separate bar for each stage with its own color */}
                <Bar 
                  dataKey="count" 
                  name="Opportunities" 
                  isAnimationActive={false}
                  fillOpacity={0.8}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            )}
            </ResponsiveContainer>
          )}
        </div>
        {opportunitiesData?.data?.totalCount > 0 && (
          <div className="text-sm text-gray-500 mt-4 text-center">
            Total opportunities: {opportunitiesData.data.totalCount}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to get a color for a stage
function getStageColor(stage: string): string {
  // Map common pipeline stages to specific colors
  const stageColorMap: Record<string, string> = {
    'Lead': 'hsl(var(--primary-500))',
    'Qualified': 'hsl(var(--primary-600))',
    'Discovery': 'hsl(var(--primary-700))',
    'Demo': 'hsl(var(--chart-3))',
    'Proposal': 'hsl(var(--chart-2))',
    'Negotiation': 'hsl(var(--chart-4))',
    'Closed Won': 'hsl(var(--success-600))',
    'Closed Lost': 'hsl(var(--destructive-600))',
    // Default colors for marketing, sales and customer success
    'Marketing': 'hsl(212, 72%, 59%)',
    'Sales': 'hsl(48, 96%, 53%)',
    'Customer Success': 'hsl(358, 75%, 59%)'
  };
  
  return stageColorMap[stage] || `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
}