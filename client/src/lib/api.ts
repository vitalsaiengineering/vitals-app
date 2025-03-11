import { apiRequest } from "./queryClient";

// Authentication
export const login = async (username: string, password: string) => {
  const response = await apiRequest("POST", "/api/login", { username, password });
  return response.json();
};

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
export const getWealthboxAuthUrl = async () => {
  const response = await fetch("/api/wealthbox/auth", { credentials: "include" });
  if (!response.ok) {
    throw new Error("Failed to get auth URL");
  }
  return response.json();
};

export const getWealthboxStatus = async () => {
  const response = await fetch("/api/wealthbox/status", { credentials: "include" });
  if (!response.ok) {
    throw new Error("Failed to get status");
  }
  return response.json();
};

export const importWealthboxData = async () => {
  const response = await apiRequest("POST", "/api/wealthbox/import");
  return response.json();
};

// AI Query
export const executeAiQuery = async (query: string) => {
  const response = await apiRequest("POST", "/api/ai/query", { query });
  return response.json();
};
