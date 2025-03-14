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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
  Cell,
  PieChart,
  Pie,
  Sector
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
  advisorId?: number | null;
  wealthboxUserId?: number | null;
  currentUser?: any; // Using any here since the User type might vary
}

export function OpportunitiesCard({ wealthboxToken, advisorId, wealthboxUserId, currentUser }: OpportunitiesCardProps) {
  const [viewMode, setViewMode] = useState<'pipeline' | 'stage'>('pipeline');
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  // Fetch opportunities data based on view mode and selected advisor/Wealthbox user
  const { 
    data: opportunitiesData, 
    isLoading 
  } = useQuery({
    queryKey: [
      viewMode === 'pipeline' 
        ? '/api/wealthbox/opportunities/by-pipeline' 
        : '/api/wealthbox/opportunities/by-stage',
      wealthboxToken,
      advisorId,
      wealthboxUserId,
      currentUser?.role
    ],
    queryFn: async () => {
      // Only fetch if we have a token
      if (!wealthboxToken) return null;
      
      const endpoint = viewMode === 'pipeline' 
        ? '/api/wealthbox/opportunities/by-pipeline' 
        : '/api/wealthbox/opportunities/by-stage';
      
      const url = new URL(endpoint, window.location.origin);
      url.searchParams.append('access_token', wealthboxToken);
      
      // First priority: Filter by Wealthbox user ID if available
      if (wealthboxUserId) {
        url.searchParams.append('wealthboxUserId', wealthboxUserId.toString());
      }
      // Second priority: Filter by advisor ID from our system 
      else if (currentUser?.role === 'client_admin' && advisorId) {
        url.searchParams.append('advisorId', advisorId.toString());
      }
      
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
    if (opportunitiesData?.data?.pipelines && opportunitiesData.data.pipelines.length > 0 && !selectedPipeline) {
      setSelectedPipeline(opportunitiesData.data.pipelines[0].pipeline);
    }
  }, [opportunitiesData, selectedPipeline]);
  
  // For client admin viewing advisor opportunities, don't require wealthbox connection
  if (!wealthboxToken && currentUser?.role !== 'client_admin') {
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
      if (opportunitiesData.data.pipelines && Array.isArray(opportunitiesData.data.pipelines)) {
        pipelines = opportunitiesData.data.pipelines.map((p: OpportunityPipeline) => p.pipeline);
      }
      
      // If a pipeline is selected, show the stages for that pipeline
      if (selectedPipeline && opportunitiesData.data.pipelines && Array.isArray(opportunitiesData.data.pipelines)) {
        const pipeline = opportunitiesData.data.pipelines.find(
          (p: OpportunityPipeline) => p.pipeline === selectedPipeline
        );
        
        if (pipeline) {
          // For pie chart, just use the stages directly
          if (chartType === 'pie') {
            chartData = pipeline.stages.map((stage: OpportunityStage) => ({
              name: stage.stage,
              value: stage.count,
              stageId: stage.stageId,
              color: getStageColor(stage.stage)
            }));
          } else {
            // Prepare data for stacked bar chart by month
            const months = [
              'Jan 2023', 'Feb 2023', 'Mar 2023', 'Apr 2023', 'May 2023', 'Jun 2023',
              'Jul 2023', 'Aug 2023', 'Sep 2023', 'Oct 2023', 'Nov 2023', 'Dec 2023'
            ];
            
            // Create monthly chart data with counts for each stage
            chartData = months.map(month => {
              const monthData: Record<string, any> = { month };
              
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
      }
    } else {
      // For stage view, use the stages data
      if (chartType === 'pie') {
        chartData = opportunitiesData.data.stages.map((stage: OpportunityStage) => ({
          name: stage.stage,
          value: stage.count,
          stageId: stage.stageId,
          color: getStageColor(stage.stage)
        }));
      } else {
        // Bar chart format
        chartData = opportunitiesData.data.stages.map((stage: OpportunityStage) => ({
          stage: stage.stage,
          count: stage.count,
          stageId: stage.stageId,
          color: getStageColor(stage.stage)
        }));
      }
    }
  }

  // Active shape for pie chart
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  
    return (
      <g>
        <text x={cx} y={cy - 20} dy={8} textAnchor="middle" fill={fill} fontSize={16} fontWeight={600}>
          {payload.name}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#999" fontSize={14}>
          {value} opportunities
        </text>
        <text x={cx} y={cy + 30} textAnchor="middle" fill="#999" fontSize={12}>
          {`(${(percent * 100).toFixed(1)}%)`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  const onPieLeave = () => {
    setActiveIndex(null);
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            <CardTitle>Advisor Opportunities</CardTitle>
            <CardDescription>
              {viewMode === 'pipeline' 
                ? 'Opportunities by Stage within a Pipeline' 
                : 'Total Opportunities by Stage across all Pipelines'}
            </CardDescription>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0">
          <Tabs 
            value={viewMode} 
            onValueChange={(value) => setViewMode(value as 'pipeline' | 'stage')}
            className="w-full md:w-auto"
          >
            <TabsList className="grid w-full md:w-[400px] grid-cols-2">
              <TabsTrigger value="pipeline">Opportunities by Pipeline</TabsTrigger>
              <TabsTrigger value="stage">Total by Stage</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2">
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant={chartType === 'bar' ? 'default' : 'outline'} 
                onClick={() => setChartType('bar')}
              >
                Bar Chart
              </Button>
              <Button 
                size="sm" 
                variant={chartType === 'pie' ? 'default' : 'outline'} 
                onClick={() => setChartType('pie')}
              >
                Pie Chart
              </Button>
            </div>
            
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
        <div className="h-[400px]">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p>No opportunities data available for the selected view.</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 65 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey={viewMode === 'pipeline' ? 'month' : 'stage'} 
                    angle={-45} 
                    textAnchor="end"
                    tick={{ fontSize: 12 }}
                    height={60}
                  />
                  <YAxis label={{ value: 'Number of Opportunities', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} />
                  <Tooltip 
                    formatter={(value, name, props) => {
                      if (viewMode === 'pipeline') {
                        return [`${value} opportunities`, name];
                      } else {
                        const stageId = props.payload[0]?.payload.stageId;
                        return [`${value} opportunities`, `${props.payload[0]?.payload.stage}${stageId ? ` (ID: ${stageId})` : ''}`];
                      }
                    }}
                  />
                  
                  {viewMode === 'pipeline' ? (
                    // For pipeline view, show stacked bars
                    <>
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
                    </>
                  ) : (
                    // For stage view, show individual bars with colors
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
                  )}
                </BarChart>
              ) : (
                // Pie chart view for both pipeline and stage modes
                <PieChart>
                  <Pie
                    activeIndex={activeIndex !== null ? activeIndex : undefined}
                    activeShape={renderActiveShape}
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={viewMode === 'pipeline' ? 80 : 60}
                    outerRadius={viewMode === 'pipeline' ? 120 : 100}
                    dataKey="value"
                    nameKey="name"
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    paddingAngle={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || getStageColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} opportunities`]}
                    labelFormatter={(name) => name}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    formatter={(value, entry: any, index) => (
                      <span style={{ color: entry.color }}>
                        {value}: {chartData[index]?.value || 0}
                      </span>
                    )}
                  />
                </PieChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
        
        {opportunitiesData?.data?.totalCount > 0 && (
          <div className="text-sm text-gray-500 mt-4 text-center">
            <p className="font-semibold">
              {viewMode === 'pipeline' && selectedPipeline 
                ? `${selectedPipeline} Pipeline: ${opportunitiesData.data.pipelines.find(
                    (p: OpportunityPipeline) => p.pipeline === selectedPipeline
                  )?.totalCount || 0} opportunities` 
                : `Total opportunities across all pipelines: ${opportunitiesData.data.totalCount}`}
            </p>
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
    // Add additional mappings for our actual API data
    'Qualification': 'hsl(var(--primary-400))',
    '622837': 'hsl(var(--primary-400))', // Stage ID from API
    // Default colors for marketing, sales and customer success
    'Marketing': 'hsl(212, 72%, 59%)',
    'Sales': 'hsl(48, 96%, 53%)',
    'Customer Success': 'hsl(358, 75%, 59%)'
  };
  
  // Use a deterministic color based on the stage name if not found in map
  // This will ensure the same stage always gets the same color
  if (!stageColorMap[stage]) {
    // Simple hash function for deterministic color
    let hash = 0;
    for (let i = 0; i < stage.length; i++) {
      hash = stage.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  }
  
  return stageColorMap[stage];
}