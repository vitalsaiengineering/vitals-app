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
  assigned_to_id?: string | number; // ID of the WealthBox user who owns this opportunity - can be string or number
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
    const { access_token, advisorId, wealthboxUserId } = req.query;
    
    if (!access_token) {
      return res.status(400).json({ 
        success: false, 
        error: 'WealthBox access token is required' 
      });
    }

    // Get all opportunities from WealthBox
    const opportunities = await fetchWealthboxOpportunities(access_token as string);
    
    // Filter by advisorId or wealthboxUserId if specified (for client admin view)
    let filteredOpportunities = opportunities;
    
    // First check if we should filter by Wealthbox user ID (this takes precedence)
    if (wealthboxUserId) {
      // Filter opportunities by Wealthbox user ID
      // Note: wealthboxUserId is received as a string from query params, but we need to confirm if
      // assigned_to_id in the opportunity is stored as a string or number
      filteredOpportunities = opportunities.filter(opp => {
        // Check if the opportunity is assigned to this Wealthbox user
        return opp.assigned_to_id === wealthboxUserId.toString();
      });
      
      console.log(`Filtered opportunities for Wealthbox user ${wealthboxUserId}: ${filteredOpportunities.length}`);
    }
    // If no Wealthbox user ID specified, try filtering by advisor ID from our system
    else if (advisorId) {
      const advisorIdNum = parseInt(advisorId as string);
      // Filter opportunities by advisorId
      filteredOpportunities = opportunities.filter(opp => {
        // Check if the opportunity is assigned to this advisor
        return opp.custom_fields?.advisorId === advisorIdNum.toString();
      });
      
      console.log(`Filtered opportunities for advisor ${advisorIdNum}: ${filteredOpportunities.length}`);
    }
    
    // Get unique pipelines
    const pipelines = getUniquePipelines(filteredOpportunities);
    
    // Group opportunities by pipeline and stage
    const opportunitiesByPipeline = aggregateOpportunitiesByPipeline(filteredOpportunities, pipelines);
    
    res.json({
      success: true,
      data: {
        pipelines: opportunitiesByPipeline,
        totalCount: filteredOpportunities.length
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
    // For demo purposes, we'll return a static set of sample data
    // This would normally be an API call to WealthBox
    
    // Sample data to ensure Sarah (advisor ID 5) has exactly 5 opportunities
    const sampleOpportunities: WealthboxOpportunity[] = [
      // Sarah's opportunities (for client admin view)
      {
        id: '1001',
        name: 'Retirement Planning',
        stage: '422586', // Lead
        status: 'open',
        pipeline: 'Sales',
        pipeline_id: 'sales_pipeline',
        amount: 50000,
        probability: 0.2,
        expected_close_date: '2023-12-31',
        created_at: '2023-01-01',
        updated_at: '2023-01-05',
        custom_fields: { advisorId: '5' },
        assigned_to_id: 'wb_user_1' // Sample Wealthbox user ID
      },
      {
        id: '1002',
        name: 'Investment Strategy',
        stage: '422584', // Qualified
        status: 'open',
        pipeline: 'Sales',
        pipeline_id: 'sales_pipeline',
        amount: 75000,
        probability: 0.4,
        expected_close_date: '2023-11-30',
        created_at: '2023-02-01',
        updated_at: '2023-02-10',
        custom_fields: { advisorId: '5' },
        assigned_to_id: 'wb_user_1' // Same Wealthbox user ID
      },
      {
        id: '1003',
        name: 'Tax Planning',
        stage: '621628', // Proposal
        status: 'open',
        pipeline: 'Sales',
        pipeline_id: 'sales_pipeline',
        amount: 30000,
        probability: 0.6,
        expected_close_date: '2023-10-15',
        created_at: '2023-03-01',
        updated_at: '2023-03-15',
        custom_fields: { advisorId: '5' },
        assigned_to_id: 'wb_user_1'
      },
      {
        id: '1004',
        name: 'Estate Planning',
        stage: '621629', // Negotiation
        status: 'open',
        pipeline: 'Sales',
        pipeline_id: 'sales_pipeline',
        amount: 100000,
        probability: 0.8,
        expected_close_date: '2023-09-30',
        created_at: '2023-04-01',
        updated_at: '2023-04-10',
        custom_fields: { advisorId: '5' },
        assigned_to_id: 'wb_user_1'
      },
      {
        id: '1005',
        name: 'Insurance Review',
        stage: '621631', // Closed Won
        status: 'won',
        pipeline: 'Sales',
        pipeline_id: 'sales_pipeline',
        amount: 25000,
        probability: 1.0,
        expected_close_date: '2023-08-15',
        created_at: '2023-05-01',
        updated_at: '2023-05-20',
        custom_fields: { advisorId: '5' },
        assigned_to_id: 'wb_user_1'
      },
      
      // Other opportunities for different advisors
      {
        id: '2001',
        name: 'Wealth Management',
        stage: '422586', // Lead
        status: 'open',
        pipeline: 'Marketing',
        pipeline_id: 'marketing_pipeline',
        amount: 150000,
        probability: 0.3,
        expected_close_date: '2023-11-30',
        created_at: '2023-02-15',
        updated_at: '2023-02-20',
        custom_fields: { advisorId: '6' },
        assigned_to_id: 'wb_user_2' // Different Wealthbox user
      },
      {
        id: '2002',
        name: 'Financial Planning',
        stage: '621628', // Proposal
        status: 'open',
        pipeline: 'Marketing',
        pipeline_id: 'marketing_pipeline',
        amount: 80000,
        probability: 0.7,
        expected_close_date: '2023-10-30',
        created_at: '2023-03-15',
        updated_at: '2023-03-25',
        custom_fields: { advisorId: '6' },
        assigned_to_id: 'wb_user_2' // Different Wealthbox user
      },
      {
        id: '3001',
        name: 'Portfolio Review',
        stage: '422584', // Qualified
        status: 'open',
        pipeline: 'Customer Success',
        pipeline_id: 'cs_pipeline',
        amount: 45000,
        probability: 0.5,
        expected_close_date: '2023-09-15',
        created_at: '2023-04-10',
        updated_at: '2023-04-20',
        custom_fields: { advisorId: '7' },
        assigned_to_id: 'wb_user_3' // Another Wealthbox user
      }
    ];

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
    return sampleOpportunities;
    
    /* 
    // This is what the real API call would look like
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
    */
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
    const { access_token, advisorId, wealthboxUserId } = req.query;
    
    if (!access_token) {
      return res.status(400).json({ 
        success: false, 
        error: 'WealthBox access token is required' 
      });
    }

    // Get all opportunities from WealthBox
    const opportunities = await fetchWealthboxOpportunities(access_token as string);
    
    // Filter by advisorId if specified (for client admin view)
    let filteredOpportunities = opportunities;
    
    // First check if we should filter by Wealthbox user ID (this takes precedence)
    if (wealthboxUserId) {
      // Filter opportunities by Wealthbox user ID
      // Note: wealthboxUserId is received as a string from query params, but we need to convert to string
      filteredOpportunities = opportunities.filter(opp => {
        // Check if the opportunity is assigned to this Wealthbox user
        return opp.assigned_to_id === wealthboxUserId.toString();
      });
      
      console.log(`Filtered stage opportunities for Wealthbox user ${wealthboxUserId}: ${filteredOpportunities.length}`);
    }
    // If no Wealthbox user ID specified, try filtering by advisor ID from our system
    else if (advisorId) {
      const advisorIdNum = parseInt(advisorId as string);
      // Filter opportunities by advisorId using the same logic as in getOpportunitiesByPipelineHandler
      filteredOpportunities = opportunities.filter(opp => {
        // Check if the opportunity is assigned to this advisor
        return opp.custom_fields?.advisorId === advisorIdNum.toString();
      });
      
      console.log(`Filtered stage opportunities for advisor ${advisorIdNum}: ${filteredOpportunities.length}`);
    }
    
    // Count opportunities by stage
    const stagesMap = new Map<string, number>();
    
    filteredOpportunities.forEach(opp => {
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
        totalCount: filteredOpportunities.length
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