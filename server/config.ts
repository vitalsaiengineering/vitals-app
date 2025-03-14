/**
 * Global application configuration
 */
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

interface AppConfig {
  wealthbox: {
    apiBaseUrl: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    defaultToken: string | null;
  };
  server: {
    port: number;
    sessionSecret: string;
  };
}

const config: AppConfig = {
  wealthbox: {
    apiBaseUrl: "https://api.crmworkspace.com/v1",
    clientId: process.env.WEALTHBOX_CLIENT_ID || "",
    clientSecret: process.env.WEALTHBOX_CLIENT_SECRET || "",
    redirectUri: process.env.WEALTHBOX_REDIRECT_URI || "http://localhost:5000/api/wealthbox/callback",
    defaultToken: process.env.WEALTHBOX_API_TOKEN || null,
  },
  server: {
    port: parseInt(process.env.PORT || "5000"),
    sessionSecret: process.env.SESSION_SECRET || "your-secret-key",
  }
};

export default config;