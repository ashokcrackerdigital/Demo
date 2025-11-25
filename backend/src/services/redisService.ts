import { createClient, RedisClientType } from 'redis';

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: false, // Don't reconnect automatically
          connectTimeout: 1000, // 1 second timeout
        },
      });

      // Suppress all error logs - Redis is optional
      this.client.on('error', () => {
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected');
        this.isConnected = true;
      });

      // Try to connect with timeout
      const connectPromise = this.client.connect();
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 1000);
      });

      await Promise.race([connectPromise, timeoutPromise]);
    } catch {
      // Redis is optional - silently continue without it
      this.isConnected = false;
      this.client = null;
      // Only log warning once at startup, not on every connection attempt
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      this.client = null;
    }
  }

  getClient(): RedisClientType | null {
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Acquire a distributed lock for a slot booking
   * @param key Lock key (e.g., `slot:${slotId}:lock`)
   * @param ttl Time to live in seconds (default: 10)
   * @returns true if lock acquired, false otherwise
   */
  async acquireLock(key: string, ttl: number = 10): Promise<boolean> {
    if (!this.isReady() || !this.client) {
      return false;
    }

    try {
      const result = await this.client.setNX(key, '1');
      if (result) {
        await this.client.expire(key, ttl);
      }
      return result;
    } catch (error) {
      console.error(`Failed to acquire lock for ${key}:`, error);
      return false;
    }
  }

  /**
   * Release a distributed lock
   * @param key Lock key
   */
  async releaseLock(key: string): Promise<void> {
    if (!this.isReady() || !this.client) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Failed to release lock for ${key}:`, error);
    }
  }

  /**
   * Get rate limit count for an IP
   * @param ip IP address
   * @returns Current request count
   */
  async getRateLimitCount(ip: string): Promise<number> {
    if (!this.isReady() || !this.client) {
      return 0;
    }

    try {
      const count = await this.client.get(`ratelimit:${ip}`);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error(`Failed to get rate limit count for ${ip}:`, error);
      return 0;
    }
  }

  /**
   * Increment rate limit counter for an IP
   * @param ip IP address
   * @param ttl Time to live in seconds
   * @returns New count
   */
  async incrementRateLimit(ip: string, ttl: number = 60): Promise<number> {
    if (!this.isReady() || !this.client) {
      return 0;
    }

    try {
      const key = `ratelimit:${ip}`;
      const count = await this.client.incr(key);
      if (count === 1) {
        await this.client.expire(key, ttl);
      }
      return count;
    } catch (error) {
      console.error(`Failed to increment rate limit for ${ip}:`, error);
      return 0;
    }
  }
}

export const redisService = new RedisService();

