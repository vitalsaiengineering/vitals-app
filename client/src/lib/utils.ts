import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Utility function to get the advisor-specific report title
 * @param baseTitle - The default title when no specific advisor is selected (e.g., "Client Inception Report")
 * @param filters - The current filter state containing advisorIds
 * @param filterOptions - Available filter options containing advisor data
 * @returns The appropriate title (e.g., "Jackson Miller's Client Inception Report" or "Client Inception Report")
 */
export function getAdvisorReportTitle(
  baseTitle: string,
  filters: { advisorIds: string[] },
  filterOptions?: { advisors: { id: string; name: string }[] }
): string {
  console.log("filters", filters);
  console.log("filterOptions", filterOptions);
  // Check if exactly one advisor is selected and it's not "All Advisors"
  if (filters.advisorIds.length === 1 && filters.advisorIds[0] !== "All Advisors") {
    const advisorId = filters.advisorIds[0];
    const advisor = filterOptions?.advisors.find(a => a.id === advisorId);
    
    if (advisor?.name) {
      return `${advisor.name}'s ${baseTitle}`;
    }
  }
  
  // Fallback to base title
  return baseTitle;
}

/**
 * Utility function to get just the advisor name for a given advisor ID
 * @param advisorId - The advisor ID to look up
 * @param filterOptions - Available filter options containing advisor data
 * @returns The advisor name or null if not found
 */
export function getAdvisorName(
  advisorId: string,
  filterOptions?: { advisors: { id: string; name: string }[] }
): string | null {
  if (!advisorId || advisorId === "All Advisors") {
    return null;
  }
  
  const advisor = filterOptions?.advisors.find(a => a.id === advisorId);
  return advisor?.name || null;
}

/**
 * Determines the correct URL for viewing a client contact based on available IDs
 * Prioritizes Wealthbox, then Orion, then falls back to internal ID
 * 
 * @param clientId - Internal client ID
 * @param wealthboxClientId - Wealthbox client ID
 * @param orionClientId - Orion client ID
 * @returns The appropriate URL for viewing the client contact
 */
export function getClientContactUrl(
  clientId?: string | number,
  wealthboxClientId?: string,
  orionClientId?: string
): string {
  if (wealthboxClientId) {
    return `https://app.crmworkspace.com/${clientId}/contacts/${wealthboxClientId}`;
  } else if (orionClientId) {
    return `/crm/orion/contact/${orionClientId}`;
  } else if (clientId) {
    return `/crm/contact/${clientId}`;
  }
  
  // If no ID is available, return a fallback URL
  return '#';
}
