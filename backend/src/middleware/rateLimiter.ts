import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redisService';

const RATE_LIMIT_REQUESTS = 5; // 5 requests per minute
const RATE_LIMIT_WINDOW = 60; // 60 seconds

/**
 * Rate limiting middleware
 * Limits requests to 5 per minute per IP address
 */
export async function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    // Check if Redis is available
    if (!redisService.isReady()) {
      // If Redis is not available, allow the request (graceful degradation)
      // Rate limiting is disabled when Redis is unavailable
      return next();
    }

    // Get current request count
    const count = await redisService.incrementRateLimit(ip, RATE_LIMIT_WINDOW);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_REQUESTS.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT_REQUESTS - count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + RATE_LIMIT_WINDOW * 1000).toISOString());

    // Check if limit exceeded
    if (count > RATE_LIMIT_REQUESTS) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Maximum ${RATE_LIMIT_REQUESTS} requests per minute.`,
        retryAfter: RATE_LIMIT_WINDOW,
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    // On error, allow the request (fail open)
    next();
  }
}

