import { db } from "@shared/db";
import { eq } from "drizzle-orm";
import { clients } from "@shared/schema";

export async function getAverageAge(): Promise<number> {
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
