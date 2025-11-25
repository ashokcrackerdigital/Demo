import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { redisService } from './services/redisService';
import { requestLogger, logger } from './middleware/logger';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import slotsRouter from './routes/slots';
import bookingRouter from './routes/booking';
import adminRouter from './routes/admin';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://healthbookpro.netlify.app'
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Request logging
app.use(requestLogger);

// Health check endpoint (before rate limiting)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    redis: redisService.isReady() ? 'connected' : 'disconnected',
  });
});

// Rate limiting (apply to all routes except health check)
app.use(rateLimiter);

// API routes
app.use('/api/slots', slotsRouter);
app.use('/api/book', bookingRouter);
app.use('/api/admin', adminRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Initialize Redis connection
async function startServer() {
  try {
    // Try to connect to Redis (optional - server will work without it)
    await redisService.connect();

    // Start server (even if Redis is not available)
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📡 API available at http://localhost:${PORT}/api`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
      if (!redisService.isReady()) {
        logger.warn('⚠️  Running without Redis - rate limiting and distributed locking disabled');
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await redisService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await redisService.disconnect();
  process.exit(0);
});

// Start the server
startServer();

