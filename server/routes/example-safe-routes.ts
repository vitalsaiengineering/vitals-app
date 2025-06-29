import { Router } from 'express';
import { z } from 'zod';
import { 
  asyncHandler, 
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  dbOperation,
  apiCall,
  validateInput,
  withTimeout,
  rateLimitGuard,
  withRetry
} from '../utils/error-handler';
import { storage } from '../storage';
import { db } from '../db';

const router = Router();

// Example validation schemas
const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  organizationId: z.number().positive('Invalid organization ID')
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional()
});

/**
 * Example 1: Safe async route with comprehensive error handling
 * Shows: asyncHandler, input validation, database operations
 */
router.post('/safe-users', 
  rateLimitGuard(10, 60000), // Rate limit: 10 requests per minute
  withTimeout(10000), // 10 second timeout
  asyncHandler(async (req, res) => {
    // Safe input validation
    const userData = validateInput(req.body, createUserSchema, 'Invalid user data');
    
    // Safe database operation with retry
    const newUser = await dbOperation(async () => {
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        throw new ValidationError('User with this email already exists');
      }
      
             // Create new user
       return await storage.createUser({
         email: userData.email,
         firstName: userData.name,
         lastName: '',
         organizationId: userData.organizationId,
         passwordHash: null,
         status: 'active' as const
       });
    }, 'Failed to create user');
    
         res.status(201).json({
       message: 'User created successfully',
       user: {
         id: newUser.id,
         email: newUser.email,
         firstName: newUser.firstName,
         lastName: newUser.lastName
       }
     });
  })
);

/**
 * Example 2: Safe user retrieval with authorization
 * Shows: authentication, authorization, not found handling
 */
router.get('/safe-users/:id', asyncHandler(async (req, res) => {
  // Parse and validate ID
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    throw new ValidationError('Invalid user ID');
  }
  
  // Check authentication
  if (!req.isAuthenticated()) {
    throw new UnauthorizedError('Authentication required');
  }
  
  // Safe database operation
  const user = await dbOperation(async () => {
    return await storage.getUser(userId);
  }, 'Failed to retrieve user');
  
  // Handle not found
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Authorization check - users can only see their own data or admin can see all
  const currentUser = req.user as any;
  if (currentUser.id !== userId && currentUser.role !== 'admin') {
    throw new UnauthorizedError('Not authorized to view this user');
  }
  
     res.json({
     id: user.id,
     email: user.email,
     firstName: user.firstName,
     lastName: user.lastName,
     createdAt: user.createdAt
   });
}));

/**
 * Example 3: Safe update operation with partial validation
 * Shows: PATCH operations, partial validation, optimistic updates
 */
router.patch('/safe-users/:id', asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    throw new ValidationError('Invalid user ID');
  }
  
  if (!req.isAuthenticated()) {
    throw new UnauthorizedError('Authentication required');
  }
  
  // Validate partial update data
  const updateData = validateInput(req.body, updateUserSchema, 'Invalid update data');
  
  // If no valid fields to update
  if (Object.keys(updateData).length === 0) {
    throw new ValidationError('No valid fields provided for update');
  }
  
  // Safe database operation with transaction-like behavior
  const updatedUser = await dbOperation(async () => {
    // First check if user exists
    const existingUser = await storage.getUser(userId);
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }
    
    // Check authorization
    const currentUser = req.user as any;
    if (currentUser.id !== userId && currentUser.role !== 'admin') {
      throw new UnauthorizedError('Not authorized to update this user');
    }
    
    // If updating email, check for duplicates
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await storage.getUserByEmail(updateData.email);
      if (emailExists) {
        throw new ValidationError('Email already in use');
      }
    }
    
    // Perform the update
    return await storage.updateUser(userId, updateData);
  }, 'Failed to update user');
  
     res.json({
     message: 'User updated successfully',
     user: {
       id: updatedUser!.id,
       email: updatedUser!.email,
       firstName: updatedUser!.firstName,
       lastName: updatedUser!.lastName
     }
   });
}));

/**
 * Example 4: Safe external API integration
 * Shows: external API calls, retry logic, fallback handling
 */
router.get('/safe-external-data/:id', asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    throw new ValidationError('Invalid user ID');
  }
  
  if (!req.isAuthenticated()) {
    throw new UnauthorizedError('Authentication required');
  }
  
  // Get user from database first
  const user = await dbOperation(async () => {
    return await storage.getUser(userId);
  }, 'Failed to retrieve user');
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Example external API call with retry
  let externalData;
  try {
    externalData = await withRetry(async () => {
      return await apiCall(async () => {
                 // Simulate external API call
         const response = await fetch(`https://api.example.com/users/${userId}`, {
           headers: {
             'Authorization': `Bearer ${process.env.API_TOKEN}`
           }
         });
        
        if (!response.ok) {
          throw new Error(`API responded with status ${response.status}`);
        }
        
        return await response.json();
      }, 'External User API');
    }, 3, 1000); // 3 retries with 1 second delay
  } catch (error) {
    console.warn('External API failed, using fallback data:', error);
    // Provide fallback data instead of failing
    externalData = {
      external_id: null,
      status: 'unavailable',
      last_sync: null
    };
  }
  
     res.json({
     user: {
       id: user.id,
       email: user.email,
       firstName: user.firstName,
       lastName: user.lastName,
       external_data: externalData
     }
   });
}));

/**
 * Example 5: Safe batch operation
 * Shows: batch processing, partial success handling, transaction-like operations
 */
router.post('/safe-users/batch', asyncHandler(async (req, res) => {
  if (!req.isAuthenticated()) {
    throw new UnauthorizedError('Authentication required');
  }
  
  const { users } = req.body;
  if (!Array.isArray(users) || users.length === 0) {
    throw new ValidationError('Users array is required and must not be empty');
  }
  
  if (users.length > 100) {
    throw new ValidationError('Cannot process more than 100 users at once');
  }
  
  const results = {
    successful: [] as any[],
    failed: [] as any[],
    total: users.length
  };
  
  // Process each user safely
  for (let i = 0; i < users.length; i++) {
    try {
      // Validate each user
      const userData = validateInput(users[i], createUserSchema);
      
      // Create user with error handling
      const newUser = await dbOperation(async () => {
        const existingUser = await storage.getUserByEmail(userData.email);
        if (existingUser) {
          throw new ValidationError(`User with email ${userData.email} already exists`);
        }
        
                 return await storage.createUser({
           email: userData.email,
           firstName: userData.name,
           lastName: '',
           organizationId: userData.organizationId,
           passwordHash: null,
           status: 'active' as const
         });
      });
      
      results.successful.push({
        index: i,
                 user: {
           id: newUser.id,
           email: newUser.email,
           firstName: newUser.firstName,
           lastName: newUser.lastName
         }
      });
      
    } catch (error: any) {
      results.failed.push({
        index: i,
        email: users[i]?.email || 'unknown',
        error: error.message
      });
    }
  }
  
  const statusCode = results.failed.length === 0 ? 201 : 
                    results.successful.length === 0 ? 400 : 207; // Multi-status
  
  res.status(statusCode).json({
    message: `Processed ${results.total} users. ${results.successful.length} successful, ${results.failed.length} failed.`,
    results
  });
}));

/**
 * Example 6: Safe file upload handling (if needed)
 * Shows: file validation, size limits, type checking
 */
router.post('/safe-upload', asyncHandler(async (req, res) => {
  if (!req.isAuthenticated()) {
    throw new UnauthorizedError('Authentication required');
  }
  
  // Note: This is a simplified example. In real implementation, you'd use multer or similar
  const file = req.body.file; // Assume file data is in body
  
  if (!file) {
    throw new ValidationError('File is required');
  }
  
  // Validate file properties
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    throw new ValidationError('File size cannot exceed 10MB');
  }
  
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError('Invalid file type. Only JPEG, PNG, and PDF are allowed');
  }
  
  // Process file safely
  const result = await dbOperation(async () => {
    // Save file metadata to database
    return {
      id: Date.now(), // In real app, this would be a proper ID
      filename: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date()
    };
  }, 'Failed to save file metadata');
  
  res.status(201).json({
    message: 'File uploaded successfully',
    file: result
  });
}));

export default router; 