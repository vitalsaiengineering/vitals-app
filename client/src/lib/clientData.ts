import { db } from "@shared/db";
import { eq, or, and } from "drizzle-orm";
import { clients, clientAdvisorRelationships } from "@shared/schema";

export interface AgeGroup {
  name: string;
  range: string;
  count: number;
  percentage: number;
  colorClass: string;
}

/**
 * Get the average age of all clients for a specific advisor
 * @param advisorId The ID of the advisor/user
 * @returns Promise with the average age of clients
 */
export async function getAverageAge(advisorId?: number): Promise<number> {
  // If no advisorId is provided, return average age for all active clients
  if (!advisorId) {
    const allClients = await db
      .select()
      .from(clients)
      .where(eq(clients.status, "active"));

    if (allClients.length === 0) return 0;

    const totalAge = allClients.reduce(
      (sum, client) => sum + (client.age || 0),
      0,
    );
    return Math.round(totalAge / allClients.length);
  }
  
  // If advisorId is provided, get active clients where the user is the primary advisor 
  const primaryAdvisorClients = await db
    .select()
    .from(clients)
    .where(and(
      eq(clients.primaryAdvisorId, advisorId),
      eq(clients.status, "active")
    ));
    
  // Get active clients from the relationships table
  const clientRelationships = await db
    .select({
      client: clients
    })
    .from(clients)
    .innerJoin(
      clientAdvisorRelationships,
      eq(clients.id, clientAdvisorRelationships.clientId)
    )
    .where(and(
      eq(clientAdvisorRelationships.advisorId, advisorId),
      eq(clients.status, "active")
    ));
    
  // Combine both sets of clients
  const allClientRows = [
    ...primaryAdvisorClients.map((client: typeof clients.$inferSelect) => ({ client })),
    ...clientRelationships
  ];
  
  if (allClientRows.length === 0) return 0;

  // Use a Set to keep track of unique client IDs to avoid double-counting
  const uniqueClientIds = new Set<number>();
  const uniqueClients = allClientRows.filter(row => {
    if (!row.client || uniqueClientIds.has(row.client.id)) return false;
    uniqueClientIds.add(row.client.id);
    return true;
  });

  const totalAge = uniqueClients.reduce(
    (sum, row) => sum + (row.client?.age || 0),
    0,
  );
  
  return Math.round(totalAge / uniqueClients.length);
}

/**
 * Get age groups for client demographics visualization
 * @param advisorId Optional advisor ID to filter clients
 * @returns Array of age groups with counts and percentages
 */
export function getAgeGroups(): AgeGroup[] {
  // Static demo data
  const ageGroups: AgeGroup[] = [
    {
      name: "Under 30",
      range: "0-29",
      count: 42,
      percentage: 14,
      colorClass: "bg-[var(--ageBand-1)]",
    },
    {
      name: "30-45",
      range: "30-45",
      count: 78,
      percentage: 26,
      colorClass: "bg-[var(--ageBand-2)]",
    },
    {
      name: "46-60",
      range: "46-60",
      count: 96,
      percentage: 32,
      colorClass: "bg-[var(--ageBand-3)]",
    },
    {
      name: "61-75",
      range: "61-75",
      count: 63,
      percentage: 21,
      colorClass: "bg-[var(--ageBand-4)]",
    },
    {
      name: "Over 75",
      range: "76+",
      count: 21,
      percentage: 7,
      colorClass: "bg-[var(--ageBand-5)]",
    },
  ];

  return ageGroups;
}
