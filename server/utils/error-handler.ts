import { Request, Response, NextFunction } from 'express';

// Custom error classes for better error handling
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500);
  }
}

export class ExternalAPIError extends AppError {
  constructor(message: string = 'External API call failed') {
    super(message, 502);
  }
}

// Type for async route handlers
type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;
type RouteHandler = (req: Request, res: Response, next: NextFunction) => any;

/**
 * Wraps async route handlers to catch promise rejections
 * This prevents unhandled promise rejections from crashing the server
 */
export const asyncHandler = (fn: AsyncRouteHandler): RouteHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error('Async handler caught error:', error);
      next(error);
    });
  };
};

/**
 * Database operation wrapper with automatic error handling
 */
export const dbOperation = async <T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Database operation failed'
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    console.error(`Database error: ${errorMessage}`, error);
    
    // Check for common database error patterns
    if (error.code === '23505') {
      throw new ValidationError('Duplicate entry - record already exists');
    } else if (error.code === '23503') {
      throw new ValidationError('Foreign key constraint violation');
    } else if (error.code === '23502') {
      throw new ValidationError('Required field is missing');
    } else if (error.message?.includes('connection')) {
      throw new DatabaseError('Database connection failed');
    } else {
      throw new DatabaseError(`${errorMessage}: ${error.message}`);
    }
  }
};

/**
 * External API call wrapper with automatic error handling
 */
export const apiCall = async <T>(
  operation: () => Promise<T>,
  serviceName: string = 'External API'
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    console.error(`${serviceName} error:`, error);
    
    // Handle common HTTP error patterns
    if (error.response?.status === 401) {
      throw new UnauthorizedError(`${serviceName} authentication failed`);
    } else if (error.response?.status === 403) {
      throw new ForbiddenError(`${serviceName} access denied`);
    } else if (error.response?.status === 404) {
      throw new NotFoundError(`${serviceName} resource not found`);
    } else if (error.response?.status >= 500) {
      throw new ExternalAPIError(`${serviceName} server error`);
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new ExternalAPIError(`${serviceName} connection failed`);
    } else {
      throw new ExternalAPIError(`${serviceName} request failed: ${error.message}`);
    }
  }
};

/**
 * Input validation wrapper
 */
export const validateInput = (data: any, schema: any, errorMessage: string = 'Invalid input') => {
  try {
    return schema.parse(data);
  } catch (error: any) {
    console.error('Validation error:', error);
    
    if (error.errors) {
      const errorMessages = error.errors.map((err: any) => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      throw new ValidationError(`${errorMessage}: ${errorMessages}`);
    } else {
      throw new ValidationError(errorMessage);
    }
  }
};

/**
 * Safe JSON parsing with error handling
 */
export const safeParse = (jsonString: string, fallback: any = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
};

/**
 * Retry wrapper for operations that might fail temporarily
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  backoff: number = 2
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(backoff, attempt - 1)));
    }
  }
  
  throw lastError!;
};

/**
 * Rate limiting helper
 */
export const rateLimitGuard = (
  maxRequests: number = 100,
  windowMs: number = 60000, // 1 minute
  keyGenerator: (req: Request) => string = (req) => req.ip || 'unknown'
) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    let requestInfo = requests.get(key);
    
    if (!requestInfo || now > requestInfo.resetTime) {
      requestInfo = { count: 1, resetTime: now + windowMs };
      requests.set(key, requestInfo);
      return next();
    }
    
    if (requestInfo.count >= maxRequests) {
      return res.status(429).json({
        message: 'Too many requests',
        retryAfter: Math.ceil((requestInfo.resetTime - now) / 1000)
      });
    }
    
    requestInfo.count++;
    next();
  };
};

/**
 * Request timeout wrapper
 */
export const withTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({ message: 'Request timeout' });
      }
    }, timeoutMs);
    
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    
    next();
  };
};

/**
 * Enhanced logging function
 */
export const logError = (error: Error, context?: Record<string, any>) => {
  const logData = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    ...context
  };
  
  console.error('Error Log:', JSON.stringify(logData, null, 2));
  
  // In production, you would send this to external logging service
  // if (process.env.NODE_ENV === 'production') {
  //   sendToLoggingService(logData);
  // }
};

/**
 * Health check helper
 */
export const createHealthCheck = (checks: Record<string, () => Promise<boolean>>) => {
  return async (req: Request, res: Response) => {
    const results: Record<string, any> = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {}
    };
    
    let overallHealthy = true;
    
    for (const [name, check] of Object.entries(checks)) {
      try {
        const isHealthy = await Promise.race([
          check(),
          new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          )
        ]);
        
        results.checks[name] = { status: isHealthy ? 'healthy' : 'unhealthy' };
        if (!isHealthy) overallHealthy = false;
      } catch (error: any) {
        results.checks[name] = { status: 'error', error: error.message };
        overallHealthy = false;
      }
    }
    
    results.status = overallHealthy ? 'healthy' : 'unhealthy';
    res.status(overallHealthy ? 200 : 503).json(results);
  };
}; 