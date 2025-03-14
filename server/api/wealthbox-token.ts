/**
 * API endpoints for Wealthbox token management
 */

import { Request, Response } from 'express';
import { getWealthboxToken } from '../utils/wealthbox-token';

/**
 * Get Wealthbox API token for the current user or system default
 */
export async function getWealthboxTokenHandler(req: Request, res: Response) {
  try {
    const userId = req.user ? (req.user as any).id : undefined;
    const token = await getWealthboxToken(userId);
    
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'No Wealthbox token available'
      });
    }
    
    res.json({
      success: true,
      token
    });
  } catch (error: any) {
    console.error('Error getting Wealthbox token:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving Wealthbox token',
      error: error.message
    });
  }
}