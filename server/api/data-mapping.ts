import { Request, Response } from 'express';
import { db } from '../db';
import { firmDataMappings } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

interface DataMapping {
  sourceField: string;
  targetField: string;
  entityType?: string;
}

/**
 * Save data mappings for a specific integration
 */
export const saveDataMappingsHandler = async (req: Request, res: Response) => {
  try {
    const { integrationTypeId, entityType, mappings } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const userId = (req.user as any).id;
    const organizationId = (req.user as any).organizationId;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User does not have an associated organization' 
      });
    }
    
    if (!integrationTypeId || !entityType || !Array.isArray(mappings)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: integrationTypeId, entityType, or mappings' 
      });
    }
    
    // First, delete any existing mappings for this organization, integration, and entity type
    await db.delete(firmDataMappings)
      .where(
        and(
          eq(firmDataMappings.firmId, organizationId),
          eq(firmDataMappings.integrationTypeId, integrationTypeId),
          eq(firmDataMappings.entityType, entityType)
        )
      );
    
    // Then insert the new mappings
    const mappingsToInsert = mappings.map((mapping: DataMapping) => ({
      firmId: organizationId,
      integrationTypeId: integrationTypeId,
      entityType: entityType,
      sourceField: mapping.sourceField,
      targetField: mapping.targetField,
      transformationRule: null, // No transformation rule for now
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    if (mappingsToInsert.length > 0) {
      await db.insert(firmDataMappings).values(mappingsToInsert);
    }
    
    return res.json({ 
      success: true, 
      message: 'Data mappings saved successfully' 
    });
  } catch (error) {
    console.error('Error saving data mappings:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to save data mappings' 
    });
  }
};

/**
 * Get data mappings for a specific integration
 */
export const getDataMappingsHandler = async (req: Request, res: Response) => {
  try {
    const { integrationTypeId, entityType } = req.query;
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const userId = (req.user as any).id;
    const organizationId = (req.user as any).organizationId;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User does not have an associated organization' 
      });
    }
    
    if (!integrationTypeId || !entityType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required query parameters: integrationTypeId, entityType' 
      });
    }
    
    // Get all mappings for this organization, integration, and entity type
    const mappings = await db.select()
      .from(firmDataMappings)
      .where(
        and(
          eq(firmDataMappings.firmId, organizationId),
          eq(firmDataMappings.integrationTypeId, Number(integrationTypeId)),
          eq(firmDataMappings.entityType, entityType as string)
        )
      );
    
    // Format the response
    const formattedMappings = mappings.map(mapping => ({
      sourceField: mapping.sourceField,
      targetField: mapping.targetField,
      transformationRule: mapping.transformationRule
    }));
    
    return res.json({ 
      success: true, 
      mappings: formattedMappings 
    });
  } catch (error) {
    console.error('Error getting data mappings:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to get data mappings' 
    });
  }
};