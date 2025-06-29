# Express Server Error Handling Guide

## Overview

This guide documents the comprehensive error handling improvements implemented to prevent server crashes and provide graceful error recovery. The server now has multiple layers of protection against common failure scenarios.

## 🚨 Critical Issues Fixed

### 1. Fatal Error Handler Bug (FIXED)
**Problem**: The global error handler was rethrowing errors after sending responses, causing server crashes.
```typescript
// ❌ OLD - This crashed the server
app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
  throw err; // This line caused crashes!
});

// ✅ NEW - Safe error handling
app.use((err, req, res, next) => {
  // Proper logging and response without rethrowing
  console.error('Global error handler caught error:', err);
  if (!res.headersSent) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
  // Error is handled and logged, no crash
});
```

### 2. Process-Level Error Handlers (NEW)
Prevents crashes from uncaught exceptions and unhandled promise rejections:
```typescript
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Log but don't crash in development
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  // Log but don't crash
});
```

### 3. Database Connection Resilience (NEW)
Enhanced database setup with connection pooling and health checks:
```typescript
// Connection pool with error handling
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

// Error event listeners
pool.on('error', (err) => {
  console.error('Database pool error:', err);
  // Don't crash, just log
});
```

## 🛠️ Error Handling Utilities

### Custom Error Classes
```typescript
import { 
  ValidationError,     // 400 - Bad Request
  UnauthorizedError,   // 401 - Unauthorized  
  ForbiddenError,      // 403 - Forbidden
  NotFoundError,       // 404 - Not Found
  DatabaseError,       // 500 - Database issues
  ExternalAPIError     // 502 - External service issues
} from './utils/error-handler';

// Usage examples
throw new ValidationError('Email format is invalid');
throw new NotFoundError('User not found');
throw new DatabaseError('Connection failed');
```

### Async Route Handler Wrapper
Prevents unhandled promise rejections:
```typescript
import { asyncHandler } from './utils/error-handler';

// ❌ OLD - Dangerous async route
app.get('/users', async (req, res) => {
  const users = await database.getUsers(); // Could crash server if fails
  res.json(users);
});

// ✅ NEW - Safe async route
app.get('/users', asyncHandler(async (req, res) => {
  const users = await database.getUsers(); // Errors are caught automatically
  res.json(users);
}));
```

### Database Operation Wrapper
Provides automatic error handling for database operations:
```typescript
import { dbOperation } from './utils/error-handler';

// ✅ Safe database operation
const user = await dbOperation(async () => {
  return await storage.getUserByEmail(email);
}, 'Failed to retrieve user');

// Automatically handles:
// - Connection errors
// - Constraint violations  
// - Timeout issues
// - Provides meaningful error messages
```

### Input Validation Wrapper
Safe input validation with proper error handling:
```typescript
import { validateInput } from './utils/error-handler';
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2)
});

// ✅ Safe validation
const userData = validateInput(req.body, userSchema, 'Invalid user data');
// Throws ValidationError with detailed messages if invalid
```

### External API Call Wrapper
Handles external service failures gracefully:
```typescript
import { apiCall } from './utils/error-handler';

const wealthboxData = await apiCall(async () => {
  const response = await fetch('https://api.wealthbox.com/users');
  return response.json();
}, 'Wealthbox API');

// Automatically handles:
// - Network timeouts
// - HTTP error status codes
// - Connection refused errors
// - Provides service-specific error messages
```

### Retry Logic for Transient Failures
```typescript
import { withRetry } from './utils/error-handler';

const result = await withRetry(async () => {
  return await unreliableOperation();
}, 3, 1000); // 3 retries with 1 second delay
```

## 🚦 Middleware Enhancements

### 1. Rate Limiting
```typescript
import { rateLimitGuard } from './utils/error-handler';

app.use('/api/expensive-operation', 
  rateLimitGuard(10, 60000), // 10 requests per minute
  asyncHandler(async (req, res) => {
    // Route handler
  })
);
```

### 2. Request Timeout Protection
```typescript
import { withTimeout } from './utils/error-handler';

app.use('/api/slow-operation',
  withTimeout(30000), // 30 second timeout
  asyncHandler(async (req, res) => {
    // Route handler
  })
);
```

### 3. Enhanced Health Checks
```typescript
import { createHealthCheck, checkDatabaseHealth } from './utils/error-handler';

app.get('/health', createHealthCheck({
  database: checkDatabaseHealth,
  memory: async () => {
    const memUsage = process.memoryUsage();
    return memUsage.rss < 500 * 1024 * 1024; // 500MB limit
  },
  uptime: async () => process.uptime() > 0
}));
```

## 📋 Implementation Examples

### Complete Safe Route Example
```typescript
import { 
  asyncHandler, 
  validateInput, 
  dbOperation, 
  ValidationError,
  NotFoundError,
  rateLimitGuard,
  withTimeout 
} from './utils/error-handler';

app.post('/api/users', 
  rateLimitGuard(20, 60000),    // Rate limiting
  withTimeout(10000),           // Request timeout
  asyncHandler(async (req, res) => {
    // 1. Safe input validation
    const userData = validateInput(req.body, userSchema, 'Invalid user data');
    
    // 2. Safe database operations
    const existingUser = await dbOperation(async () => {
      return await storage.getUserByEmail(userData.email);
    }, 'Failed to check existing user');
    
    if (existingUser) {
      throw new ValidationError('User already exists');
    }
    
    // 3. Safe user creation
    const newUser = await dbOperation(async () => {
      return await storage.createUser(userData);
    }, 'Failed to create user');
    
    res.status(201).json({
      message: 'User created successfully',
      user: { id: newUser.id, email: newUser.email }
    });
  })
);
```

### Batch Operations with Partial Success
```typescript
app.post('/api/users/batch', asyncHandler(async (req, res) => {
  const { users } = req.body;
  const results = { successful: [], failed: [], total: users.length };
  
  // Process each user safely - don't let one failure stop the whole batch
  for (let i = 0; i < users.length; i++) {
    try {
      const userData = validateInput(users[i], userSchema);
      const newUser = await dbOperation(async () => {
        return await storage.createUser(userData);
      });
      results.successful.push({ index: i, user: newUser });
    } catch (error) {
      results.failed.push({ index: i, error: error.message });
    }
  }
  
  const statusCode = results.failed.length === 0 ? 201 : 207; // Multi-status
  res.status(statusCode).json(results);
}));
```

## 🔧 Migration Guide

### Step 1: Wrap Existing Async Routes
```typescript
// Before
app.get('/api/data', async (req, res) => {
  // existing code
});

// After  
app.get('/api/data', asyncHandler(async (req, res) => {
  // existing code unchanged
}));
```

### Step 2: Replace Database Calls
```typescript
// Before
const user = await storage.getUser(id);

// After
const user = await dbOperation(async () => {
  return await storage.getUser(id);
}, 'Failed to retrieve user');
```

### Step 3: Add Input Validation
```typescript
// Before
const { email, name } = req.body;

// After
const userData = validateInput(req.body, userSchema, 'Invalid input');
```

### Step 4: Handle External APIs
```typescript
// Before
const response = await fetch(apiUrl);
const data = await response.json();

// After
const data = await apiCall(async () => {
  const response = await fetch(apiUrl);
  return await response.json();
}, 'External API');
```

## 🎯 Best Practices

### 1. Always Use asyncHandler for Async Routes
```typescript
// ✅ Good
app.get('/route', asyncHandler(async (req, res) => { ... }));

// ❌ Bad - can crash server
app.get('/route', async (req, res) => { ... });
```

### 2. Wrap Database Operations
```typescript
// ✅ Good
await dbOperation(async () => await db.query(), 'Operation description');

// ❌ Bad - database errors can crash server
await db.query();
```

### 3. Use Appropriate Error Types
```typescript
// ✅ Good - specific error types
if (!user) throw new NotFoundError('User not found');
if (!authorized) throw new UnauthorizedError('Access denied');

// ❌ Bad - generic errors
if (!user) throw new Error('User not found');
```

### 4. Validate All Input
```typescript
// ✅ Good
const data = validateInput(req.body, schema, 'Invalid data');

// ❌ Bad - no validation
const data = req.body;
```

### 5. Add Rate Limiting to Sensitive Endpoints
```typescript
// ✅ Good
app.post('/api/login', rateLimitGuard(5, 60000), ...);

// ❌ Bad - no rate limiting on sensitive endpoints
app.post('/api/login', ...);
```

## 🚀 Production Considerations

### 1. Logging
In production, enhance the logging to send to external services:
```typescript
// In error-handler.ts, uncomment and configure:
if (process.env.NODE_ENV === 'production') {
  // Send to logging service like DataDog, New Relic, etc.
  sendToLoggingService(errorData);
}
```

### 2. Health Checks
Monitor the `/health` endpoint for:
- Database connectivity
- Memory usage
- External service availability
- Application uptime

### 3. Error Alerting
Set up alerts for:
- High error rates
- Database connection failures
- Memory usage spikes
- External API failures

## 🔍 Monitoring and Debugging

### Error Logs Structure
All errors now include structured logging:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "error",
  "message": "Database operation failed",
  "stack": "Error stack trace...",
  "request": {
    "method": "POST",
    "path": "/api/users",
    "userId": 123
  },
  "error": {
    "code": "DB_CONNECTION_FAILED",
    "details": "Connection timeout"
  }
}
```

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": { "status": "healthy" },
    "memory": { "status": "healthy" },
    "uptime": { "status": "healthy" }
  }
}
```

## 📈 Benefits

1. **No More Server Crashes**: Comprehensive error catching prevents process termination
2. **Better User Experience**: Meaningful error messages instead of generic 500 errors
3. **Easier Debugging**: Structured logging and error context
4. **Resilient Operations**: Retry logic and fallback handling
5. **Performance Protection**: Rate limiting and timeout controls
6. **Health Monitoring**: Real-time application health visibility

## 🔧 Next Steps

1. **Apply to Existing Routes**: Gradually migrate existing routes to use these patterns
2. **Add Monitoring**: Set up external monitoring for the health check endpoints
3. **Enhance Logging**: Configure production logging service integration
4. **Performance Testing**: Test error handling under load
5. **Documentation**: Update API documentation with new error response formats

Remember: The goal is to **fail gracefully** rather than crash the entire application. Every error is an opportunity to provide a better user experience while maintaining system stability. 