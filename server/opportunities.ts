import axios from 'axios';
import { Request, Response } from 'express';

// Types for WealthBox opportunities
interface WealthboxOpportunity {
  id: string;
  name: string;
  stage: string;
  status: string;
  pipeline?: string;
  pipeline_id?: string;
  amount: number;
  probability: number;
  expected_close_date: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Map numeric stage IDs to descriptive names
// This would typically come from WealthBox's API, but we're hardcoding for the demo
const stageNameMap: Record<string, string> = {
  '422586': 'Lead',
  '422584': 'Qualified',
  '621628': 'Proposal',
  '621629': 'Negotiation',
  '621631': 'Closed Won',
  // Add more mappings as needed
};

interface OpportunityStageCount {
  stage: string;
  stageId: string;
  count: number;
}

interface OpportunityPipelineData {
  pipeline: string;
  stages: OpportunityStageCount[];
  totalCount: number;
}

/**
 * Handler for retrieving opportunities by pipeline and stage
 */
export async function getOpportunitiesByPipelineHandler(req: Request, res: Response) {
  try {
    const { access_token } = req.query;
    
    if (!access_token) {
      return res.status(400).json({ 
        success: false, 
        error: 'WealthBox access token is required' 
      });
    }

    // Get all opportunities from WealthBox
    const opportunities = await fetchWealthboxOpportunities(access_token as string);
    
    // Get unique pipelines
    const pipelines = getUniquePipelines(opportunities);
    
    // Group opportunities by pipeline and stage
    const opportunitiesByPipeline = aggregateOpportunitiesByPipeline(opportunities, pipelines);
    
    res.json({
      success: true,
      data: {
        pipelines: opportunitiesByPipeline,
        totalCount: opportunities.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch opportunities' 
    });
  }
}

/**
 * Fetch all opportunities from WealthBox API
 */
async function fetchWealthboxOpportunities(accessToken: string): Promise<WealthboxOpportunity[]> {
  try {
    // According to WealthBox API docs, we need to get all opportunities
    // and then filter them based on pipeline and stage
    const response = await axios.get('https://api.crmworkspace.com/v1/opportunities', {
      params: {
        per_page: 100,  // Max per page to reduce API calls
        include_closed: true  // Include won and lost opportunities
      },
      headers: {
        'ACCESS_TOKEN': accessToken
      }
    });

    // The API response format may vary, adjust based on actual WealthBox response
    return response.data.opportunities || [];
  } catch (error: any) {
    console.error('Error fetching from WealthBox API:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch opportunities from WealthBox');
  }
}

/**
 * Extract unique pipelines from opportunities list
 */
function getUniquePipelines(opportunities: WealthboxOpportunity[]): string[] {
  // In some CRMs, pipeline might be directly available or derived from a custom field
  // Adjust this logic based on how WealthBox structures the data
  const pipelinesSet = new Set<string>();
  
  opportunities.forEach(opp => {
    // Try to get pipeline from the opportunity data
    // Depending on WealthBox API, this could be in various places
    const pipeline = opp.pipeline || 
                     opp.pipeline_id || 
                     opp.custom_fields?.pipeline || 
                     'Default Pipeline';
    
    pipelinesSet.add(pipeline);
  });
  
  return Array.from(pipelinesSet);
}

/**
 * Group opportunities by pipeline and stage
 */
function aggregateOpportunitiesByPipeline(
  opportunities: WealthboxOpportunity[], 
  pipelines: string[]
): OpportunityPipelineData[] {
  return pipelines.map(pipeline => {
    // Filter opportunities for this pipeline
    const pipelineOpportunities = opportunities.filter(opp => {
      const oppPipeline = opp.pipeline || 
                          opp.pipeline_id || 
                          opp.custom_fields?.pipeline || 
                          'Default Pipeline';
      
      return oppPipeline === pipeline;
    });
    
    // Get unique stages for this pipeline
    const stagesMap = new Map<string, number>();
    
    pipelineOpportunities.forEach(opp => {
      const stage = opp.stage || 'Unknown';
      stagesMap.set(stage, (stagesMap.get(stage) || 0) + 1);
    });
    
    // Convert map to array of stage counts with friendly names
    const stages = Array.from(stagesMap.entries()).map(([stage, count]) => ({
      stage: stageNameMap[stage] || stage, // Use friendly name if available
      stageId: stage, // Keep the original ID for reference
      count
    }));
    
    return {
      pipeline,
      stages,
      totalCount: pipelineOpportunities.length
    };
  });
}

/**
 * Handler for retrieving all opportunities stages
 */
export async function getOpportunityStagesHandler(req: Request, res: Response) {
  try {
    const { access_token } = req.query;
    
    if (!access_token) {
      return res.status(400).json({ 
        success: false, 
        error: 'WealthBox access token is required' 
      });
    }

    // Get all opportunities from WealthBox
    const opportunities = await fetchWealthboxOpportunities(access_token as string);
    
    // Count opportunities by stage
    const stagesMap = new Map<string, number>();
    
    opportunities.forEach(opp => {
      const stage = opp.stage || 'Unknown';
      stagesMap.set(stage, (stagesMap.get(stage) || 0) + 1);
    });
    
    // Convert map to array of stage counts with friendly names
    const stages = Array.from(stagesMap.entries()).map(([stage, count]) => ({
      stage: stageNameMap[stage] || stage, // Use friendly name if available
      stageId: stage, // Keep the original ID for reference
      count
    }));
    
    res.json({
      success: true,
      data: {
        stages,
        totalCount: opportunities.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching opportunity stages:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch opportunity stages' 
    });
  }
}