import { db } from "shared/db"; // Adjust the import path as necessary
import { integrationTypes } from "shared/schema"; // Adjust the import path as necessary

async function addIntegrationTypes() {
  await db.insert(integrationTypes).values([
    {
      name: "wealthbox",
      apiVersion: "v1",
      endpointBaseUrl: "https://api.wealthbox.com",
      requiredCredentials: {}, // empty because no firm API
      defaultFieldMappings: {}, // mappings
      authType: "advisor_only", // Custom field to indicate auth type
    },
    {
      name: "orion",
      apiVersion: "v2",
      endpointBaseUrl: "https://api.orion.com",
      requiredCredentials: {
        client_id: "string",
        client_secret: "string",
      },
      defaultFieldMappings: {}, // mappings
      authType: "firm_and_advisor", // Supports both
    },
    {
      name: "redtail",
      apiVersion: "v1",
      endpointBaseUrl: "https://api.redtailtechnology.com",
      requiredCredentials: {
        api_key: "string",
        username: "string",
        password: "string",
      },
      defaultFieldMappings: {}, // mappings
      authType: "firm_only", // Firm-level only
    },
  ]);

  console.log("Integration types added successfully");
}

// Call the function
addIntegrationTypes().catch((error) =>
  console.error("Error adding integration types:", error),
);
