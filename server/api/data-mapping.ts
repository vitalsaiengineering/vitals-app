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
    
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    
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
    await db.delete(firm_data_mappings)
      .where(
        and(
          eq(firm_data_mappings.firm_id, organizationId),
          eq(firm_data_mappings.integration_type_id, integrationTypeId),
          eq(firm_data_mappings.entity_type, entityType)
        )
      );
    
    // Then insert the new mappings
    const mappingsToInsert = mappings.map((mapping: DataMapping) => ({
      firm_id: organizationId,
      integration_type_id: integrationTypeId,
      entity_type: entityType,
      source_field: mapping.sourceField,
      target_field: mapping.targetField,
      transformation_rule: null, // No transformation rule for now
      created_at: new Date(),
      updated_at: new Date()
    }));
    
    if (mappingsToInsert.length > 0) {
      await db.insert(firm_data_mappings).values(mappingsToInsert);
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
    
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    
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
      .from(firm_data_mappings)
      .where(
        and(
          eq(firm_data_mappings.firm_id, organizationId),
          eq(firm_data_mappings.integration_type_id, Number(integrationTypeId)),
          eq(firm_data_mappings.entity_type, entityType as string)
        )
      );
    
    // Format the response
    const formattedMappings = mappings.map(mapping => ({
      sourceField: mapping.source_field,
      targetField: mapping.target_field,
      transformationRule: mapping.transformation_rule
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