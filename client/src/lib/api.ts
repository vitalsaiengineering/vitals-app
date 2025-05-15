import { apiRequest } from "./queryClient";

// Authentication
export const login = async (username: string, password: string) => {
  const response = await apiRequest("POST", "/api/login", { username, password });
  return response.json();
};

export const signup = async (userData: any) => {
  const response = await apiRequest("POST", "/api/signup", userData);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Signup failed" }));
    
    // Extract just the real error message
    let errorMessage = errorData.message || "Signup failed";
    try {
      // Check if the error message contains a JSON string
      if (errorMessage.includes('{"message":')) {
        const match = errorMessage.match(/\{"message":"([^"]+)"\}/);
        if (match && match[1]) {
          errorMessage = match[1];
        }
      }
    } catch (e) {
      // If parsing fails, keep using the original error message
    }
    
    throw new Error(errorMessage);
  }
  return response.json();
}


export const logout = async () => {
  const response = await apiRequest("POST", "/api/logout");
  return response.json();
};

export const getCurrentUser = async () => {
  const response = await fetch("/api/me", { credentials: "include" });
  if (!response.ok) {
    throw new Error("Not authenticated");
  }
  return response.json();
};

// Users
export const createUser = async (userData: any) => {
  const response = await apiRequest("POST", "/api/users", userData);
  console.log("Create user response:", response)
  if (!response.ok) {
    console.error("Failed to create user:", response)
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create user");
  }
  return response.json();
};

export const updateUser = async (id: number, userData: any) => {
  
  console.log("Updating user with ID:", id, "and data:", userData)
  const response = await apiRequest("PUT", `/api/users/${id}`, userData);
  return response.json();
};

export const fetchRoles = async () => {
  const response = await apiRequest("GET", "/api/roles");
  return response.json();
};

export const fetchStatuses = async () => {
  const response = await apiRequest("GET", "/api/statuses");
  return response.json();
};

export const getUsersByOrganization = async (organizationId: number) => {
  const response = await apiRequest("GET", `/api/users?organizationId=${organizationId}`);
  return response.json();
};

// Organizations
export const createOrganization = async (orgData: any) => {
  const response = await apiRequest("POST", "/api/organizations", orgData);
  return response.json();
};

// Clients
export const createClient = async (clientData: any) => {
  const response = await apiRequest("POST", "/api/clients", clientData);
  return response.json();
};

// Data Mappings
export const createMapping = async (mappingData: any) => {
  const response = await apiRequest("POST", "/api/mappings", mappingData);
  return response.json();
};

export const deleteMapping = async (id: number) => {
  await apiRequest("DELETE", `/api/mappings/${id}`);
};

// WealthBox Integration
export const setupWealthboxOAuth = async (
  clientId?: string,
  clientSecret?: string,
  redirectUri?: string
) => {
  // If no parameters are provided, just initiate OAuth with defaults
  if (!clientId && !clientSecret && !redirectUri) {
    const response = await fetch("/api/wealthbox/oauth/start", {
      method: "GET",
      credentials: "include"
    });
    return response.json();
  }
  
  // Otherwise, setup OAuth with custom parameters
  const response = await fetch("/api/wealthbox/oauth/setup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientId,
      clientSecret,
      redirectUri,
    }),
  });
  return response.json();
} 

export const testWealthboxConnection = async (accessToken: string) => {
  const response = await apiRequest("POST", "/api/wealthbox/test-connection", { accessToken });
  return response.json();
};

export const getWealthboxStatus = async () => {
  const response = await apiRequest("GET", "/api/wealthbox/status");
  return response.json();
};

export const importWealthboxData = async (accessToken?: string) => {
  const response = await apiRequest("POST", "/api/wealthbox/import-data", 
    accessToken ? { accessToken } : undefined);
  return response.json();
};

export const syncWealthboxData = async (accessToken?: string) => {
  const response = await apiRequest("POST", "/api/wealthbox/sync", 
    accessToken ? { accessToken } : undefined);
  return response.json();
};

export const getWealthboxUsers = async (accessToken: string) => {
  const response = await fetch(`/api/wealthbox/users?access_token=${accessToken}`);
  if (!response.ok) {
    throw new Error('Failed to fetch Wealthbox users');
  }
  return response.json();
};

export const getClientsByState = async (wealthboxUserId?: number) => {
  let url = '/api/wealthbox/clients/by-state';
  if (wealthboxUserId) {
    url += `?wealthboxUserId=${wealthboxUserId}`;
  }
  
  console.log('Fetching clients by state:', url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch clients by state');
  }
  return response.json();
};

export const getClientsByAge = async (wealthboxUserId?: number) => {
  let url = '/api/wealthbox/clients/by-age';
  if (wealthboxUserId) {
    url += `?wealthboxUserId=${wealthboxUserId}`;
  }
  
  console.log('Fetching clients by age:', url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch clients by age');
  }
  return response.json();
};

export const getWealthboxToken = async () => {
  const response = await apiRequest("GET", "/api/wealthbox/token");
  return response.json();
};

// AI Query
export const executeAiQuery = async (query: string) => {
  const response = await apiRequest("POST", "/api/ai/query", { query });
  return response.json();
};

// Orion API Integration
export const getOrionStatus = async () => {
  const response = await apiRequest("GET", "/api/orion/status");
  return response.json();
};

export const connectToOrion = async () => {
  const response = await apiRequest("GET", "/api/orion/token");
  return response.json();
};

export const getClientAumOverTime = async (clientId: string) => {
  const response = await apiRequest("GET", `/api/orion/client/${clientId}/aum`);
  return response.json();
};
