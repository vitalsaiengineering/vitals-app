import { db } from "@shared/db";
import { eq, and, or } from "drizzle-orm";
import { clients, clientAdvisorRelationships } from "@shared/schema";

/**
 * Get the average age of all active clients for a specific advisor
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
  
  // If advisorId is provided, get clients where the user is either the primary advisor 
  // or has a relationship through the client_advisor_relationships table
  const clientsForAdvisor = await db
    .select()
    .from(clients)
    .leftJoin(
      clientAdvisorRelationships,
      eq(clients.id, clientAdvisorRelationships.clientId)
    )
    .where(
      and(
        eq(clients.status, "active"),
        or(
          eq(clients.primaryAdvisorId, advisorId),
          eq(clientAdvisorRelationships.advisorId, advisorId)
        )
      )
    );

  if (clientsForAdvisor.length === 0) return 0;

  // Use a Set to keep track of unique client IDs to avoid double-counting
  const uniqueClientIds = new Set<number>();
  const uniqueClients = clientsForAdvisor.filter(row => {
    const client = row.clients;
    if (!client || uniqueClientIds.has(client.id)) return false;
    uniqueClientIds.add(client.id);
    return true;
  });

  const totalAge = uniqueClients.reduce(
    (sum, row) => sum + (row.clients?.age || 0),
    0,
  );
  
  return Math.round(totalAge / uniqueClients.length);
}
