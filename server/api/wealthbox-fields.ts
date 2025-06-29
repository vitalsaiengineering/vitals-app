/**
 * Server-side API handlers for Wealthbox field options
 * These endpoints proxy requests to the Wealthbox API to avoid CORS issues
 */

import { Request, Response } from "express";
import { getValidWealthboxToken, createWealthboxHeaders } from "../utils/wealthbox-auth";

// Wealthbox API base URL
const WEALTHBOX_API_BASE_URL = "https://api.crmworkspace.com/v1";

// Endpoints for retrieving field options
const ENDPOINTS = {
  CUSTOM_FIELDS: "/categories/custom_fields",
  CONTACT_TYPES: "/categories/contact_types", 
  CONTACT_ROLES: "/categories/contact_roles",
  TAGS: "/categories/tags",
};

/**
 * Interface for field option items within a field
 */
interface WealthboxFieldOptionItem {
  id: string | number;
  label: string;
}

/**
 * Interface for field items returned from API
 */
interface WealthboxFieldItem {
  id?: string | number;
  name: string;
  field_type?: string;
  document_type?: string;
  options?: WealthboxFieldOptionItem[];
  [key: string]: any;
}

/**
 * Fetches data from the specified Wealthbox API endpoint using server-side authentication
 */
const fetchFromWealthboxServer = async (
  accessToken: string,
  endpoint: string
): Promise<any[]> => {
  try {
    const response = await fetch(`${WEALTHBOX_API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: createWealthboxHeaders(accessToken),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch from Wealthbox API: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    
    // Extract field name from the endpoint
    // Example: "/categories/contact_types" -> "contact_types"
    const fieldName = endpoint.split('/').pop() || '';
    
    // Return the data from the appropriate field
    return data[fieldName] || [];
  } catch (error) {
    console.error(`Error fetching from Wealthbox API ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Converts Wealthbox field items to standardized format
 */
const convertToFieldOptions = (items: WealthboxFieldItem[], label: string) => {
  return items.map(item => ({
    label: `${item.document_type || ''} ${label} - ${item.name}`,
    value: label === "Contact Types" ? item.name : (item.id ? String(item.id) : item.name),
    fieldType: item.field_type,
    documentType: item.document_type,
    options: item.options ? item.options.map(option => ({
      label: option.label,
      value: String(option.id),
    })) : undefined,
  }));
};

/**
 * Handler for getting all Wealthbox field options
 */
export async function getWealthboxFieldOptionsHandler(req: Request, res: Response) {
  try {
    const user = req.user as any;
    const userId = user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated"
      });
    }

    // Check for token in Authorization header first
    let accessToken: string | null = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('Using token from Authorization header');
    } else {
      // Fall back to getting token from user ID
      accessToken = await getValidWealthboxToken(userId);
      console.log('Using token from user ID lookup');
    }

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: "No valid Wealthbox access token found"
      });
    }

    // Fetch all data in parallel
    const [customFields, contactTypes, contactRoles, tags] = await Promise.all([
      fetchFromWealthboxServer(accessToken, ENDPOINTS.CUSTOM_FIELDS),
      fetchFromWealthboxServer(accessToken, ENDPOINTS.CONTACT_TYPES),
      fetchFromWealthboxServer(accessToken, ENDPOINTS.CONTACT_ROLES),
      fetchFromWealthboxServer(accessToken, ENDPOINTS.TAGS),
    ]);

    // Convert each result to standardized format
    const result = {
      customFields: convertToFieldOptions(customFields, "Custom Fields"),
      contactTypes: convertToFieldOptions(contactTypes, "Contact Types"),
      contactRoles: convertToFieldOptions(contactRoles, "Contact Roles"),
      tags: convertToFieldOptions(tags, "Tags"),
    };

    return res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error("Error in getWealthboxFieldOptionsHandler:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch Wealthbox field options"
    });
  }
}

/**
 * Handler for searching Wealthbox field options
 */
export async function searchWealthboxFieldOptionsHandler(req: Request, res: Response) {
  try {
    const user = req.user as any;
    const userId = user?.id;
    const searchTerm = req.query.search as string || "";

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated"
      });
    }

    // Check for token in Authorization header first
    let accessToken: string | null = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('Using token from Authorization header for search');
    } else {
      // Fall back to getting token from user ID
      accessToken = await getValidWealthboxToken(userId);
      console.log('Using token from user ID lookup for search');
    }

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: "No valid Wealthbox access token found"
      });
    }

    // Fetch all data in parallel
    const [customFields, contactTypes, contactRoles, tags] = await Promise.all([
      fetchFromWealthboxServer(accessToken, ENDPOINTS.CUSTOM_FIELDS),
      fetchFromWealthboxServer(accessToken, ENDPOINTS.CONTACT_TYPES),
      fetchFromWealthboxServer(accessToken, ENDPOINTS.CONTACT_ROLES),
      fetchFromWealthboxServer(accessToken, ENDPOINTS.TAGS),
    ]);

    // Convert and combine all options
    const allOptions = [
      ...convertToFieldOptions(customFields, "Custom Fields"),
      ...convertToFieldOptions(contactTypes, "Contact Types"),
      ...convertToFieldOptions(contactRoles, "Contact Roles"),
      ...convertToFieldOptions(tags, "Tags"),
    ];

    // Filter options based on the search term
    let filteredOptions = allOptions;
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      filteredOptions = allOptions.filter(option => 
        option.label.toLowerCase().includes(searchTermLower)
      );
    }

    return res.json({
      success: true,
      data: filteredOptions
    });

  } catch (error: any) {
    console.error("Error in searchWealthboxFieldOptionsHandler:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to search Wealthbox field options"
    });
  }
} 