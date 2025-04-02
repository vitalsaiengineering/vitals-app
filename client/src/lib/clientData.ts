import { db } from "@shared/db";
import { eq, or, and } from "drizzle-orm";
import { clients, clientAdvisorRelationships } from "@shared/schema";

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
