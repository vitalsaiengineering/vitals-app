import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDemoData } from './demo-data';
import { testDatabaseConnection, checkDatabaseHealth, closeDatabaseConnections } from './db';
import { createHealthCheck } from './utils/error-handler';
import dotenv from "dotenv";

dotenv.config();

// Process-level error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Log to external service in production
  // Don't exit in development, but log the error
  if (process.env.NODE_ENV === 'production') {
    // Give time for cleanup
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Log to external service in production
  // Don't exit, just log the error
});

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  try {
    await closeDatabaseConnections();
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  try {
    await closeDatabaseConnections();
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
  }
  process.exit(0);
});

const app = express();

// Trust proxy for production deployments
app.set('trust proxy', 1);

// Body parsing middleware with error handling
app.use(express.json({ 
  limit: '10mb',
  verify: (req: any, res: Response, buf: Buffer) => {
    try {
      JSON.parse(buf.toString());
    } catch (error) {
      res.status(400).json({ message: 'Invalid JSON payload' });
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ 
  extended: false,
  limit: '10mb'
}));

// Request logging middleware with error handling
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    try {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    } catch (error) {
      console.error('Error in request logging:', error);
    }
  });

  next();
});

// Health check endpoint with comprehensive checks
app.get('/health', createHealthCheck({
  database: checkDatabaseHealth,
  memory: async () => {
    const memUsage = process.memoryUsage();
    const maxMemory = 500 * 1024 * 1024; // 500MB threshold
    return memUsage.rss < maxMemory;
  },
  uptime: async () => process.uptime() > 0
}));

(async () => {
  try {
    console.log('Starting server...');
    
    // Test database connection first
    await testDatabaseConnection();
    
    // Register routes with error handling
    const server = await registerRoutes(app);
    
    // Seed demo data with error handling
    try {
      await seedDemoData();
    } catch (error) {
      console.error('Error seeding demo data:', error);
      // Don't crash the server if demo data fails
    }

    // // 404 handler for unmatched routes
    // app.use('*', (req, res) => {
    //   if (req.path.startsWith('/api')) {
    //     res.status(404).json({ message: 'API endpoint not found' });
    //   } else {
    //     // Let Vite handle non-API routes in development
    //     res.status(404).send('Page not found');
    //   }
    // });

    // Global error handler - FIXED to not rethrow errors
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      console.error('Global error handler caught error:', err);
      console.error('Error stack:', err.stack);
      console.error('Request path:', req.path);
      console.error('Request method:', req.method);
      
      // Don't send response if headers already sent
      if (res.headersSent) {
        console.error('Headers already sent, cannot send error response');
        return;
      }

      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Don't expose internal errors in production
      const responseMessage = process.env.NODE_ENV === 'production' && status === 500 
        ? 'Internal Server Error' 
        : message;

      res.status(status).json({ 
        message: responseMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
      
      // DO NOT rethrow the error - this was causing crashes
      // The error has been handled and logged
    });

    // Setup Vite/static serving with error handling
    if (app.get("env") === "development") {
      try {
        await setupVite(app, server);
      } catch (error) {
        console.error('Error setting up Vite:', error);
        // Continue without Vite if it fails
      }
    } else {
      try {
        serveStatic(app);
      } catch (error) {
        console.error('Error setting up static serving:', error);
        // Continue without static serving if it fails
      }
    }

    // Start server with error handling
    const port = process.env.PORT || 5000;
    server.listen({
      port: Number(port),
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Server running on port ${port}`);
      console.log(`Health check available at http://localhost:${port}/health`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
      if (process.env.NODE_ENV === 'production') {
        // In production, try to restart gracefully
        setTimeout(() => {
          process.exit(1);
        }, 5000);
      }
    });

  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
})();