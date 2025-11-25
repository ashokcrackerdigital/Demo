import { describe, it, expect, beforeEach } from 'vitest';
import { redisService } from '../src/services/redisService';

describe('Rate Limiter', () => {
  beforeEach(async () => {
    // Connect to Redis if not connected
    if (!redisService.isReady()) {
      await redisService.connect();
    }
  });

  it('should increment rate limit counter', async () => {
    const ip = '127.0.0.1';
    const count = await redisService.incrementRateLimit(ip, 60);
    
    expect(count).toBeGreaterThan(0);
  });

  it('should get rate limit count', async () => {
    const ip = '127.0.0.1';
    
    // Reset counter
    const key = `ratelimit:${ip}`;
    const client = redisService.getClient();
    if (client) {
      await client.del(key);
    }

    // Increment and check
    await redisService.incrementRateLimit(ip, 60);
    const count = await redisService.getRateLimitCount(ip);
    
    expect(count).toBeGreaterThan(0);
  });

  it('should acquire and release lock', async () => {
    const lockKey = 'test:lock';
    
    // Acquire lock
    const acquired = await redisService.acquireLock(lockKey, 10);
    expect(acquired).toBe(true);

    // Try to acquire again (should fail)
    const acquired2 = await redisService.acquireLock(lockKey, 10);
    expect(acquired2).toBe(false);

    // Release lock
    await redisService.releaseLock(lockKey);

    // Should be able to acquire again
    const acquired3 = await redisService.acquireLock(lockKey, 10);
    expect(acquired3).toBe(true);

    // Clean up
    await redisService.releaseLock(lockKey);
  });
});

