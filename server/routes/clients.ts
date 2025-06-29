/**
 * Unified Clients API Endpoint
 * Replaces all individual KPI endpoints with standardized client data access
 */

import { Request, Response, Router } from 'express';
import { ClientService } from '../services/client.service';

const router = Router();

/**
 * GET /api/clients
 * Unified endpoint for all client data with filtering and pagination
 * Replaces: /api/analytics/age-demographics-report, /api/analytics/birthday-report, 
 *          /api/analytics/client-distribution-report, /api/analytics/segmentation-dashboard, etc.
 */
async function getClientsHandler(req: Request, res: Response) {
  try {
    const user = req.user as any;
    const organizationId = user?.organizationId;

    if (!organizationId) {
      return res.status(401).json({
        error: 'Organization ID not found'
      });
    }

    // Parse filters and pagination from query parameters
    const filters = ClientService.parseFiltersFromQuery(req.query);
    const pagination = ClientService.parsePaginationFromQuery(req.query);

    // Create client service instance
    const clientService = new ClientService();
    
    // Get filtered and paginated client data
    const userId = user?.id;
    const result = await clientService.getClients(organizationId, filters, pagination, userId);

    res.json(result);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      error: 'Failed to fetch clients',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Register the route
router.get('/clients', getClientsHandler);

export default router; 