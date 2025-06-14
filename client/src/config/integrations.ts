/**
 * Centralized integration configuration
 */

export interface IntegrationConfig {
  name: string;
  oauthUrl: string;
  clientId: string;
  redirectUri: string;
  scope: string;
}

export const INTEGRATIONS: Record<string, IntegrationConfig> = {
  wealthbox: {
    name: "Wealthbox",
    oauthUrl: "https://app.crmworkspace.com/oauth/authorize",
    clientId: "MbnIzrEtWejPZ96qHXFwxbkU1R9euNqfrSeynciUgL0",
    redirectUri: process.env.NODE_ENV === "development" ? "https://moved-repeatedly-mongrel.ngrok-free.app/settings" : "https://app.advisorvitals.com/settings",
    scope: "login+data"
  },
  orion: {
    name: "Orion",
    oauthUrl: "https://stagingapi.orionadvisor.com/api/oauth",
    clientId: "2112",
    redirectUri: process.env.NODE_ENV === "development" ? "http://localhost:5001/settings" : "https://app.advisorvitals.com/settings",
    scope: ""
  }
};

/**
 * Generate OAuth URL for a given integration
 */
export function getOAuthUrl(integrationKey: string): string {
  const config = INTEGRATIONS[integrationKey];
  if (!config) {
    throw new Error(`Integration ${integrationKey} not found`);
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code"
  });


  // Add specific parameters for different integrations
  if (integrationKey === "orion") {
    params.append("state", "Login");
  }

  return `${config.oauthUrl}?${params.toString()}${config.scope ? `&scope=${config.scope}` : ""}`;
}

/**
 * Get integration config by key
 */
export function getIntegrationConfig(key: string): IntegrationConfig | undefined {
  return INTEGRATIONS[key];
} 