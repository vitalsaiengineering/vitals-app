import { Request, Response } from "express";
import { User, Client, Activity } from "@shared/schema";
import { storage } from "./storage";
import { getWealthboxToken } from "./utils/wealthbox-token";
import { getValidWealthboxToken, createWealthboxHeaders, makeWealthboxRequest } from "./utils/wealthbox-auth";

// Wealthbox API base URL
const WEALTHBOX_API_BASE_URL = "https://api.crmworkspace.com/v1";

// Wealthbox API endpoints
const ENDPOINTS = {
  CONTACTS: `${WEALTHBOX_API_BASE_URL}/contacts`,
  ACTIVITIES: `${WEALTHBOX_API_BASE_URL}/activities`,
  USERS: `${WEALTHBOX_API_BASE_URL}/users`,
};

/**
 * Tests connection to Wealthbox API with Bearer token authentication
 */
export async function testWealthboxConnection(
  accessToken: string | null,
): Promise<boolean> {
  console.log("testWealthboxConnection", { accessToken });

  if (!accessToken) {
    console.error("No Wealthbox access token provided to test connection");
    return false;
  }
  try {
    const response = await fetch(`${ENDPOINTS.CONTACTS}?limit=1`, {
      method: "GET",
      headers: createWealthboxHeaders(accessToken),
    });

    if (response.ok) {
      return true;
    }

    console.error(
      `Wealthbox API connection failed: ${response.status} ${response.statusText}`,
    );
    return false;
  } catch (error) {
    console.error("Error connecting to Wealthbox API:", error);
    return false;
  }
}

/**
 * Tests connection to Wealthbox API using stored user tokens
 */
export async function testWealthboxConnectionWithUserToken(
  userId: number,
): Promise<boolean> {
  try {
    const accessToken = await getValidWealthboxToken(userId);
    if (!accessToken) {
      console.error("No valid Wealthbox access token for user");
      return false;
    }
    
    return await testWealthboxConnection(accessToken);
  } catch (error) {
    console.error("Error testing Wealthbox connection with user token:", error);
    return false;
  }
}

/**
 * Import contacts from Wealthbox and store them as clients
 */
export async function importWealthboxContacts(
  accessToken: string | null,
  userId: number,
  organizationId: number,
): Promise<{ success: boolean; imported: number; failed: number }> {
  if (!accessToken) {
    console.error("No Wealthbox access token provided for importing contacts");
    return { success: false, imported: 0, failed: 0 };
  }

  try {
    // Get all contacts from Wealthbox (paginated)
    let allContacts = await fetchAllContacts(accessToken);

    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    let imported = 0;
    let failed = 0;

    // Process each contact
    for (const contact of allContacts) {
      try {
        // Map Wealthbox contact to our client model
        const client = mapWealthboxContactToClient(
          contact,
          organizationId,
          userId,
        );

        // Store the client in our system
        await storage.upsertClientByWealthboxId(contact.id.toString(), client);
        imported++;
      } catch (error) {
        console.error(`Failed to import contact ${contact.id}:`, error);
        failed++;
      }
    }

    return { success: true, imported, failed };
  } catch (error) {
    console.error("Error importing Wealthbox contacts:", error);
    return { success: false, imported: 0, failed: 0 };
  }
}

/**
 * Handles requests to test Wealthbox connection
 */
export async function testWealthboxConnectionHandler(
  req: Request,
  res: Response,
) {
  try {
    const { accessToken } = req.body;
    console.log("testWealthboxConnectionHandler", { accessToken });
    if (!accessToken) {
      return res
        .status(400)
        .json({ success: false, message: "Access token is required" });
    }

    const isConnected = await testWealthboxConnection(accessToken);

    if (isConnected) {
      return res.json({
        success: true,
        message: "Successfully connected to Wealthbox API",
      });
    } else {
      return res
        .status(401)
        .json({
          success: false,
          message: "Failed to connect to Wealthbox API",
        });
    }
  } catch (error) {
    console.error("Error in testWealthboxConnectionHandler:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

/**
 * Handles requests to import data from Wealthbox
 */
export async function importWealthboxDataHandler(req: Request, res: Response) {
  try {
    let { accessToken } = req.body;
    console.log("importWealthboxDataHandler", { accessToken });
    const user = req.user as any;
    const userId = user?.id;
    const organizationId = user?.organizationId;

    // If no token provided, try to get from configuration
    if (!accessToken) {
      const token = await getWealthboxToken(userId);
      if (!token) {
        return res
          .status(400)
          .json({ success: false, message: "Access token is required" });
      }
      accessToken = token;
      console.log("Using configured Wealthbox token for import");
    }

    if (!userId || !organizationId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    // First test the connection
    const isConnected = await testWealthboxConnection(accessToken);
    if (!isConnected) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Failed to connect to Wealthbox API",
        });
    }

    // Import contacts
    const contactsResult = await importWealthboxContacts(
      accessToken,
      userId,
      organizationId,
    );


    // Return combined results
    return res.json({
      success: contactsResult.success,
      contacts: {
        imported: contactsResult.imported,
        failed: contactsResult.failed,
      },
    });
  } catch (error) {
    console.error("Error in importWealthboxDataHandler:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

/**
 * Fetches all contacts from Wealthbox using pagination with Bearer token
 */
async function fetchAllContacts(
  accessToken: string,
  limit: number = 100,
): Promise<any[]> {
  let allContacts: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${ENDPOINTS.CONTACTS}?page=${page}`,
      {
        method: "GET",
        headers: createWealthboxHeaders(accessToken),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch contacts: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    allContacts = [...allContacts, ...data.contacts];

    // Check if there are more pages
    hasMore = data.meta.total_pages === page;
    page++;
  }

  return allContacts;
}

/**
 * Maps a Wealthbox contact to our client model
 */
function mapWealthboxContactToClient(
  contact: any,
  organizationId: number,
  advisorId: number,
): Partial<Client> {
  return {
    firmId: organizationId,
    primaryAdvisorId: advisorId,
    firstName: contact.first_name || contact.name || "",
    lastName: contact.last_name || "",
    title: contact.type !== "Person" ? (contact.name || null) : null,
    contactType: contact.type || null,
    segment: contact.segment || null,
    referredBy: contact.referred_by || null,
    dateOfBirth: contact.birth_date || null,
    inceptionDate: contact.client_since || null,
    emailAddress: contact.email_addresses && contact.email_addresses.length > 0 ? contact.email_addresses[0].address : null,
    age: contact.age || null,
    phoneNumber: contact.phone_numbers && contact.phone_numbers.length > 0 ? contact.phone_numbers[0].address : null,
    contactInfo: contact.street_addresses && contact.street_addresses.length > 0 ? {
      address: `${contact.street_addresses[0].street_line_1 || ""}, ${contact.street_addresses[0].city || ""}, ${contact.street_addresses[0].state || ""} ${contact.street_addresses[0].zip_code || ""}`.trim(),
      state: contact.street_addresses[0].state || null,
      city: contact.street_addresses[0].city || null,
      zip: contact.street_addresses[0].zip_code || null,
    } : {},
    source: "wealthbox",
    wealthboxClientId: contact.id.toString(),
    isActive: true,
    status: "active" as const,
  };
}


/**
 * Fetches all users from Wealthbox API with Bearer token authentication
 */
export async function fetchWealthboxUsers(
  accessToken: string | null,
): Promise<any[]> {
  if (!accessToken) {
    console.error("No Wealthbox access token provided");
    return [];
  }

  try {
    const response = await fetch(`${ENDPOINTS.USERS}`, {
      method: "GET",
      headers: createWealthboxHeaders(accessToken),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch users: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.error("Error fetching Wealthbox users:", error);
    throw error;
  }
}

/**
 * Fetches active clients from Wealthbox and groups them by age
 */
export async function fetchActiveClientsByAge(
  accessToken: string | null,
): Promise<any> {
  if (!accessToken) {
    console.error(
      "No Wealthbox access token provided for fetching clients by age",
    );
    return {
      ageGroups: [],
      totalActiveClients: 0,
      averageAge: 0,
      largestAgeSegment: "N/A",
    };
  }

  try {
    const url = `${ENDPOINTS.CONTACTS}?contact_type=Client&active=true&per_page=100`;

    console.log("Fetching active clients by age from Wealthbox API:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: createWealthboxHeaders(accessToken),
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch active clients: ${response.status} ${response.statusText}`,
      );
      throw new Error(
        `Failed to fetch active clients: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    console.log(
      `Retrieved ${data.contacts?.length || 0} active clients from Wealthbox`,
    );

    // Initialize age groups
    const ageGroups: Record<string, number> = {
      "18-30": 0,
      "31-40": 0,
      "41-50": 0,
      "51-60": 0,
      "61-70": 0,
      "71+": 0,
    };

    let totalAge = 0;
    let clientsWithAge = 0;

    // Process each client and extract age information
    data.contacts.forEach((contact: any) => {
      let age = null;

      if (contact.date_of_birth) {
        const birthDate = new Date(contact.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();

        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      } else if (contact.custom_fields) {
        const ageField = Object.entries(contact.custom_fields).find(([key]) =>
          key.toLowerCase().includes("age"),
        );

        if (ageField && ageField[1]) {
          const parsedAge = parseInt(ageField[1].toString(), 10);
          if (!isNaN(parsedAge)) {
            age = parsedAge;
          }
        }
      }

      if (age !== null && age >= 18) {
        if (age <= 30) ageGroups["18-30"]++;
        else if (age <= 40) ageGroups["31-40"]++;
        else if (age <= 50) ageGroups["41-50"]++;
        else if (age <= 60) ageGroups["51-60"]++;
        else if (age <= 70) ageGroups["61-70"]++;
        else ageGroups["71+"]++;

        totalAge += age;
        clientsWithAge++;
      }
    });

    const averageAge =
      clientsWithAge > 0 ? Math.round(totalAge / clientsWithAge) : 0;

    let largestSegment = "N/A";
    let maxCount = 0;

    Object.entries(ageGroups).forEach(([range, count]) => {
      if (count > maxCount) {
        maxCount = count;
        largestSegment = range;
      }
    });

    const result = Object.entries(ageGroups).map(([range, count]) => ({
      range,
      count,
    }));

    return {
      ageGroups: result,
      totalActiveClients: data.contacts.length,
      averageAge,
      largestAgeSegment: largestSegment,
    };
  } catch (error) {
    console.error("Error fetching active clients by age:", error);
    throw error;
  }
}

/**
 * Fetches active clients from Wealthbox and groups them by state
 */
export async function fetchActiveClientsByState(
  accessToken: string | null,
): Promise<any> {
  if (!accessToken) {
    console.error("No Wealthbox access token provided for fetching clients");
    return { clientsByState: [], totalActiveClients: 0 };
  }

  try {
    const url = `${ENDPOINTS.CONTACTS}?contact_type=Client&active=true&per_page=100`;

    console.log("Fetching active clients by state from Wealthbox API:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: createWealthboxHeaders(accessToken),
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch active clients: ${response.status} ${response.statusText}`,
      );
      throw new Error(
        `Failed to fetch active clients: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    console.log(
      `Retrieved ${data.contacts?.length || 0} active clients from Wealthbox`,
    );

    // Group clients by state
    const clientsByState: Record<string, number> = {};

    // Process each client and extract state information
    data.contacts.forEach((contact: any) => {
      let state = "Unknown";

      // Try street_addresses first (as per API docs)
      if (contact.street_addresses && contact.street_addresses.length > 0) {
        const principalAddress =
          contact.street_addresses.find((addr: any) => addr.principal) ||
          contact.street_addresses[0];
        state = principalAddress.state || "Unknown";
      }
      // Fall back to addresses if available
      else if (contact.addresses && contact.addresses.length > 0) {
        const principalAddress =
          contact.addresses.find((addr: any) => addr.principal) ||
          contact.addresses[0];
        state = principalAddress.state || "Unknown";
      }

      // Increment count for this state
      if (state in clientsByState) {
        clientsByState[state]++;
      } else {
        clientsByState[state] = 1;
      }
    });

    // Convert to format expected by frontend
    const result = Object.entries(clientsByState).map(([state, count]) => ({
      state,
      count,
      percentage: Math.round((count / data.contacts.length) * 100) / 100,
    }));

    // Sort by count descending
    result.sort((a, b) => b.count - a.count);

    return {
      clientsByState: result,
      totalActiveClients: data.contacts.length,
    };
  } catch (error) {
    console.error("Error fetching active clients by state:", error);
    throw error;
  }
}

/**
 * Handler for retrieving active clients by state
 */
export async function getActiveClientsByStateHandler(
  req: Request,
  res: Response,
) {
  try {
    const requestedUserId = req.query.wealthboxUserId
      ? Number(req.query.wealthboxUserId)
      : undefined;
    let accessToken = null;

    if (req.query.access_token) {
      accessToken = req.query.access_token as string;
    } else if (req.user && (req.user as any).wealthboxToken) {
      accessToken = (req.user as any).wealthboxToken;
    } else {
      const userId = (req.user as any)?.id;
      const configToken = await getWealthboxToken(userId);

      if (configToken) {
        accessToken = configToken;
      } else {
        return res.status(400).json({
          success: false,
          error: "WealthBox access token is required",
        });
      }
    }

    const isConnected = await testWealthboxConnection(accessToken);
    if (!isConnected) {
      return res.status(401).json({
        success: false,
        error: "WealthBox authentication failed",
      });
    }

    const result = await fetchActiveClientsByState(accessToken);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error in getActiveClientsByStateHandler:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch active clients by state",
    });
  }
}

/**
 * Handler for retrieving active clients by age
 */
export async function getActiveClientsByAgeHandler(
  req: Request,
  res: Response,
) {
  try {
    const requestedUserId = req.query.wealthboxUserId
      ? Number(req.query.wealthboxUserId)
      : undefined;
    let accessToken = null;

    if (req.query.access_token) {
      accessToken = req.query.access_token as string;
    } else if (req.user && (req.user as any).wealthboxToken) {
      accessToken = (req.user as any).wealthboxToken;
    } else {
      const userId = (req.user as any)?.id;
      const configToken = await getWealthboxToken(userId);

      if (configToken) {
        accessToken = configToken;
      } else {
        return res.status(400).json({
          success: false,
          error: "WealthBox access token is required",
        });
      }
    }

    const isConnected = await testWealthboxConnection(accessToken);
    if (!isConnected) {
      return res.status(401).json({
        success: false,
        error: "WealthBox authentication failed",
      });
    }

    const result = await fetchActiveClientsByAge(accessToken);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error in getActiveClientsByAgeHandler:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch active clients by age",
    });
  }
}

/**
 * Handler for retrieving Wealthbox users
 */
export async function getWealthboxUsersHandler(req: Request, res: Response) {
  try {
    let accessToken = null;

    if (req.query.access_token) {
      accessToken = req.query.access_token as string;
    } else if (req.user && (req.user as any).wealthboxToken) {
      accessToken = (req.user as any).wealthboxToken;
    } else {
      const userId = (req.user as any)?.id;
      const configToken = await getWealthboxToken(userId);

      if (configToken) {
        accessToken = configToken;
      } else {
        return res.status(400).json({
          success: false,
          error: "WealthBox access token is required",
        });
      }
    }

    const isConnected = await testWealthboxConnection(accessToken);
    if (!isConnected) {
      return res.status(401).json({
        success: false,
        error: "WealthBox authentication failed",
      });
    }

    const users = await fetchWealthboxUsers(accessToken);

    res.json({
      success: true,
      data: {
        users,
        count: users.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching Wealthbox users:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch Wealthbox users",
    });
  }
}

/**
 * Function to retrieve Wealthbox users for internal use
 * Returns the users directly instead of sending an HTTP response
 */
export async function getWealthboxUsers(
  accessTokenOrUserId: string | number | null,
): Promise<{ success: boolean; users?: any[]; error?: string }> {
  try {
    let accessToken = null;

    // Handle different types of input
    if (typeof accessTokenOrUserId === "string") {
      // Direct token provided
      accessToken = accessTokenOrUserId;
    } else if (typeof accessTokenOrUserId === "number") {
      // User ID provided, retrieve token from config
      const configToken = await getWealthboxToken(accessTokenOrUserId);
      if (configToken) {
        accessToken = configToken;
      } else {
        return {
          success: false,
          error: "WealthBox access token not found for user",
        };
      }
    }

    if (!accessToken) {
      return {
        success: false,
        error: "WealthBox access token is required",
      };
    }

    // Test connection
    const isConnected = await testWealthboxConnection(accessToken);
    if (!isConnected) {
      return {
        success: false,
        error: "WealthBox authentication failed",
      };
    }

    // Fetch users
    const users = await fetchWealthboxUsers(accessToken);
  console.log("Retrieved Wealthbox users:", users);
    return {
      success: true,
      users,
    };
  } catch (error: any) {
    console.error("Error fetching Wealthbox users:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch Wealthbox users",
    };
  }
}
