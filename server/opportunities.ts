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
  assigned_to_id?: string | number; // ID of the WealthBox user who owns this opportunity
  manager_id?: string | number;     // ID of the manager for this opportunity 
  creator_id?: string | number;     // ID of the user who created this opportunity
}

// Map numeric stage IDs to descriptive names
// These are the actual Wealthbox stage IDs and names
const stageNameMap: Record<string, string> = {
  '622836': 'Evaluation',
  '622837': 'Identify Decision Makers',
  '622838': 'Qualification',
  '622839': 'Needs Analysis',
  '622840': 'Review',
  '622841': 'Proposal',
  '622842': 'Lost',
  '622843': 'Won'
};

interface OpportunityStageCount {
  stage: string;
  // stageId field removed per request to not show IDs
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
    
    console.log(`Total opportunities before filtering: ${opportunities.length}`);
    console.log(`Filter parameters - wealthboxUserId: ${wealthboxUserId || 'none'}, advisorId: ${advisorId || 'none'}`);
    
    if (opportunities.length > 0) {
      // Log the first opportunity to see what assigned_to_id looks like
      console.log(`First opportunity assigned_to_id: ${opportunities[0].assigned_to_id}, type: ${typeof opportunities[0].assigned_to_id}`);
      
      // Log all assigned_to_id values to see what we're working with
      const assignedIds = opportunities.map(opp => opp.assigned_to_id).filter(id => id);
      console.log(`All assigned_to_id values: ${assignedIds.join(', ')}`);
      
      // Log some sample custom fields if available
      if (opportunities[0].custom_fields) {
        console.log(`Sample custom fields: ${JSON.stringify(opportunities[0].custom_fields)}`);
      }
    }
    
    // First check if we should filter by Wealthbox user ID (this takes precedence)
    if (wealthboxUserId) {
      const wbUserId = wealthboxUserId.toString();
      console.log(`Filtering by Wealthbox user ID: ${wbUserId}`);
      
      // Try different formats to match the assigned_to_id
      const matchesString = opportunities.filter(opp => opp.assigned_to_id === wbUserId).length;
      const matchesNumber = opportunities.filter(opp => opp.assigned_to_id === Number(wbUserId)).length;
      
      console.log(`Matches as string: ${matchesString}, matches as number: ${matchesNumber}`);
      
      // Filter opportunities by Wealthbox user ID using our helper function
      filteredOpportunities = opportunities.filter(opp => {
        const isMatch = opportunityBelongsToUser(opp, wbUserId);
        if (isMatch) console.log(`Matched opportunity by ID: ${opp.id}, ${opp.name}`);
        return isMatch;
      });
      
      console.log(`Filtered opportunities for Wealthbox user ${wealthboxUserId}: ${filteredOpportunities.length}`);
    }
    // If no Wealthbox user ID specified, try filtering by advisor ID from our system
    else if (advisorId) {
      const advisorIdNum = parseInt(advisorId as string);
      const advisorIdStr = advisorIdNum.toString();
      console.log(`Filtering by advisor ID: ${advisorIdStr}`);
      
      // For client admin role, we show all opportunities without filtering
      // Since client admins should have access to all opportunities
      console.log(`For client admin view, showing all ${opportunities.length} opportunities to advisor ${advisorIdStr}`);
      filteredOpportunities = opportunities;
      
      // Uncomment and implement this logic once we have proper mapping between
      // advisors in our system and Wealthbox users
      /*
      // Look for this advisorId in custom fields
      const customFieldMatches = opportunities.filter(opp => {
        return opp.custom_fields && opp.custom_fields.advisorId === advisorIdStr;
      }).length;
      
      console.log(`Opportunities with matching advisorId in custom fields: ${customFieldMatches}`);
      
      // Filter opportunities by advisorId
      filteredOpportunities = opportunities.filter(opp => {
        const isMatch = opp.custom_fields?.advisorId === advisorIdStr;
        // For detailed logging, uncomment if needed
        // if (isMatch) console.log(`Matched opportunity: ${opp.id}, ${opp.name}`);
        return isMatch;
      });
      */
      
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
    console.log(`Fetching opportunities from Wealthbox API with token: ${accessToken ? 'provided' : 'missing'}`);
    
    // Log the token (hiding most characters)
    if (accessToken) {
      const tokenPreview = accessToken.substring(0, 4) + '...' + accessToken.substring(accessToken.length - 4);
      console.log(`Using Wealthbox token: ${tokenPreview}`);
    }
    
    // Call the real WealthBox API to get opportunities
    const response = await axios.get('https://api.crmworkspace.com/v1/opportunities', {
      params: {
        per_page: 100,  // Max per page to reduce API calls
        include_closed: true  // Include won and lost opportunities
      },
      headers: {
        'ACCESS_TOKEN': accessToken
      }
    });

    // Check for null or empty response and handle accordingly
    if (!response.data) {
      console.warn('No data returned from WealthBox API');
      return [];
    }
    
    console.log(`Wealthbox API response status: ${response.status}`);
    console.log(`Raw response data structure: ${JSON.stringify(Object.keys(response.data))}`);
    
    if (!response.data.opportunities) {
      console.warn('No opportunities array in response data');
      console.log(`Response data (partial): ${JSON.stringify(response.data).substring(0, 300)}...`);
      return [];
    }
    
    console.log(`Total opportunities from API: ${response.data.opportunities.length}`);
    
    if (response.data.opportunities.length > 0) {
      // Log the structure of the first opportunity to understand the API response format
      console.log(`First opportunity structure: ${JSON.stringify(Object.keys(response.data.opportunities[0]))}`);
      console.log(`Sample opportunity: ${JSON.stringify(response.data.opportunities[0])}`.substring(0, 300));
    }

    // The API response format may vary, adjust based on actual WealthBox response
    const mappedOpportunities = response.data.opportunities.map((opp: any) => {
      // Log raw data from the first opportunity to help with debugging
      if (response.data.opportunities.indexOf(opp) === 0) {
        console.log(`Raw manager field: ${JSON.stringify(opp.manager)}`);
        console.log(`Raw creator field: ${JSON.stringify(opp.creator)}`);
      }
      
      // Extract amount from the amounts array if present
      let amount = 0;
      if (opp.amounts && opp.amounts.length > 0) {
        // Try to extract and parse the amount from the first amount entry
        const amountStr = opp.amounts[0].amount;
        if (amountStr) {
          // Handle amounts like "$50,000" by removing currency symbol and commas
          const cleanAmount = amountStr.replace(/[$,]/g, '');
          amount = parseFloat(cleanAmount) || 0;
        }
      }
      
      // Transform API response to match our interface for the actual Wealthbox API format
      return {
        id: opp.id.toString(),
        name: opp.name,
        stage: opp.stage?.toString() || 'Unknown',
        status: opp.status || 'open',
        pipeline: 'Default Pipeline', // Wealthbox doesn't seem to have a pipeline field in the API
        pipeline_id: 'default_pipeline',
        amount: amount,
        probability: opp.probability || 0,
        expected_close_date: opp.target_close || opp.expected_close_date || new Date().toISOString(),
        created_at: opp.created_at || new Date().toISOString(),
        updated_at: opp.updated_at || new Date().toISOString(),
        custom_fields: opp.custom_fields || [],
        // These fields are directly available as IDs in the response
        manager_id: opp.manager?.toString() || null,
        creator_id: opp.creator?.toString() || null,
        assigned_to_id: opp.assigned_to_id || null
      };
    });
    
    console.log(`Mapped ${mappedOpportunities.length} opportunities`);
    return mappedOpportunities;
  } catch (error: any) {
    console.error('Error fetching from WealthBox API:', error);
    
    // Enhanced error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Response error status: ${error.response.status}`);
      console.error(`Response headers: ${JSON.stringify(error.response.headers)}`);
      console.error(`Response data: ${JSON.stringify(error.response.data || {})}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from API request');
      console.error(`Request details: ${JSON.stringify(error.request || {})}`);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    
    const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message || 
                         'Failed to fetch opportunities from WealthBox';
    
    throw new Error(errorMessage);
  }
}

/**
 * Helper function to check if an opportunity belongs to a specific user ID
 * Checks all possible ID fields for a match
 * @param opportunity The opportunity to check
 * @param userId The user ID to match against
 * @returns True if the opportunity belongs to the user, false otherwise
 */
function opportunityBelongsToUser(opportunity: WealthboxOpportunity, userId: string): boolean {
  // Convert to string for consistent comparison
  const idToMatch = userId.toString();
  
  // Check assigned_to_id (direct assignment)
  if (opportunity.assigned_to_id === idToMatch || 
      (opportunity.assigned_to_id && opportunity.assigned_to_id.toString() === idToMatch)) {
    return true;
  }
  
  // Check manager_id (opportunity manager)
  if (opportunity.manager_id === idToMatch || 
      (opportunity.manager_id && opportunity.manager_id.toString() === idToMatch)) {
    return true;
  }
  
  // Check creator_id (opportunity creator)
  if (opportunity.creator_id === idToMatch || 
      (opportunity.creator_id && opportunity.creator_id.toString() === idToMatch)) {
    return true;
  }
  
  // No match found
  return false;
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
    
    // Convert map to array of stage counts with friendly names only (no IDs)
    const stages = Array.from(stagesMap.entries()).map(([stage, count]) => ({
      stage: stageNameMap[stage] || stage, // Use friendly name if available
      // stageId removed per request to not show IDs
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
    
    console.log(`Total opportunities before stage filtering: ${opportunities.length}`);
    console.log(`Stage filter parameters - wealthboxUserId: ${wealthboxUserId || 'none'}, advisorId: ${advisorId || 'none'}`);
    
    if (opportunities.length > 0) {
      // Log the first opportunity to see what assigned_to_id and custom fields look like
      console.log(`First opportunity assigned_to_id: ${opportunities[0].assigned_to_id}, type: ${typeof opportunities[0].assigned_to_id}`);
      
      // Log all assigned_to_id values to see what we're working with
      const assignedIds = opportunities.map(opp => opp.assigned_to_id).filter(id => id);
      if (assignedIds.length > 0) {
        console.log(`All assigned_to_id values: ${assignedIds.join(', ')}`);
      } else {
        console.log("No opportunities have assigned_to_id values");
      }
      
      // Log sample custom fields
      if (opportunities[0].custom_fields) {
        console.log(`Sample custom fields: ${JSON.stringify(opportunities[0].custom_fields)}`);
      } else {
        console.log("No custom fields in first opportunity");
      }
    }
    
    // First check if we should filter by Wealthbox user ID (this takes precedence)
    if (wealthboxUserId) {
      const wbUserId = wealthboxUserId.toString();
      console.log(`Filtering stages by Wealthbox user ID: ${wbUserId}`);
      
      // Try different formats to match the assigned_to_id
      const matchesString = opportunities.filter(opp => opp.assigned_to_id === wbUserId).length;
      const matchesNumber = opportunities.filter(opp => opp.assigned_to_id === Number(wbUserId)).length;
      
      console.log(`Stage matches as string: ${matchesString}, matches as number: ${matchesNumber}`);
      
      // Filter opportunities by Wealthbox user ID using our helper function
      filteredOpportunities = opportunities.filter(opp => {
        const isMatch = opportunityBelongsToUser(opp, wbUserId);
        if (isMatch) console.log(`Matched stage opportunity by ID: ${opp.id}, ${opp.name}`);
        return isMatch;
      });
      
      console.log(`Filtered stage opportunities for Wealthbox user ${wealthboxUserId}: ${filteredOpportunities.length}`);
    }
    // If no Wealthbox user ID specified, try filtering by advisor ID from our system
    else if (advisorId) {
      const advisorIdNum = parseInt(advisorId as string);
      const advisorIdStr = advisorIdNum.toString();
      console.log(`Filtering stages by advisor ID: ${advisorIdStr}`);
      
      // For client admin role, show all opportunities without filtering
      console.log(`For client admin view (stages), showing all ${opportunities.length} opportunities to advisor ${advisorIdStr}`);
      filteredOpportunities = opportunities;
      
      // NOTE: In the future, we may want to filter by custom fields when they're populated
      // This code is commented out but kept for reference
      /*
      // Look for this advisorId in custom fields
      const customFieldMatches = opportunities.filter(opp => {
        return opp.custom_fields && opp.custom_fields.advisorId === advisorIdStr;
      }).length;
      
      // Filter opportunities by advisorId in custom fields
      filteredOpportunities = opportunities.filter(opp => {
        const isMatch = opp.custom_fields?.advisorId === advisorIdStr;
        return isMatch;
      });
      */
      
      console.log(`Filtered stage opportunities for advisor ${advisorIdNum}: ${filteredOpportunities.length}`);
    }
    
    // Count opportunities by stage
    const stagesMap = new Map<string, number>();
    
    filteredOpportunities.forEach(opp => {
      const stage = opp.stage || 'Unknown';
      stagesMap.set(stage, (stagesMap.get(stage) || 0) + 1);
    });
    
    // Convert map to array of stage counts with friendly names only (no IDs)
    const stages = Array.from(stagesMap.entries()).map(([stage, count]) => ({
      stage: stageNameMap[stage] || stage, // Use friendly name if available
      // stageId removed per request to not show IDs
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