const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const CACHE_TTL = 300; // 5 minutes in seconds

let redisClient = null;
let redisPubSub = null;
let isRedisConnected = false;

// Fallback in-memory cache for local development/offline Redis
const localCache = new Map();

// Helper: check if a local key has expired
const isExpired = (item) => {
  return Date.now() > item.expiresAt;
};

// Initialize Redis Connections
const initRedis = () => {
  try {
    console.log(`Connecting to Redis at: ${REDIS_URL}`);
    
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('⚠️ Redis client connection attempts exhausted. Falling back to local memory cache permanently.');
          return null; // Stop retrying
        }
        // Slow down retries if offline
        return Math.min(times * 2000, 10000);
      }
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis Connected');
    });

    redisClient.on('ready', () => {
      isRedisConnected = true;
      console.log('✅ Redis Client Ready');
    });

    redisClient.on('error', (err) => {
      // Log errors without crashing
      console.warn('⚠️ Redis Connection/Client Error:', err.message);
      isRedisConnected = false;
    });

    redisClient.on('close', () => {
      isRedisConnected = false;
    });

    // Redis Pub/Sub Subscriber Client
    redisPubSub = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('⚠️ Redis Pub/Sub connection attempts exhausted.');
          return null; // Stop retrying
        }
        return Math.min(times * 2000, 10000);
      }
    });

    redisPubSub.on('ready', () => {
      console.log('✅ Redis Pub/Sub Subscriber Ready');
      redisPubSub.subscribe('accounting-event', (err) => {
        if (err) console.error('Subscription error:', err);
      });
    });

    redisPubSub.on('message', (channel, message) => {
      if (channel === 'accounting-event') {
        try {
          const { companyId } = JSON.parse(message);
          invalidateLocalCache(companyId);
          if (isRedisConnected) {
            invalidateRedisCache(companyId);
          }
        } catch (e) {
          console.error('Error parsing accounting event:', e);
        }
      }
    });

    redisPubSub.on('error', (err) => {
      // Quietly log subscriber errors
      console.warn('⚠️ Redis Pub/Sub Error:', err.message);
    });

  } catch (err) {
    console.warn('⚠️ Failed to initialize Redis client. Falling back entirely to memory cache:', err.message);
    isRedisConnected = false;
  }
};

// Flush cache locally in Node memory
const invalidateLocalCache = (companyId) => {
  console.log(`Invalidating memory cache for company: ${companyId}`);
  const prefix = `reports:${companyId}:`;
  for (const key of localCache.keys()) {
    if (key.startsWith(prefix)) {
      localCache.delete(key);
    }
  }
};

// Flush keys matching in Redis
const invalidateRedisCache = async (companyId) => {
  if (!isRedisConnected || !redisClient) return;
  console.log(`Invalidating Redis cache keys for company: ${companyId}`);
  try {
    const pattern = `reports:${companyId}:*`;
    const keys = await redisClient.keys(pattern);
    if (keys && keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (err) {
    console.error('Error invalidating Redis keys:', err.message);
  }
};

// Determine if Redis should be enabled
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true' || 
  (!!process.env.REDIS_URL && process.env.REDIS_ENABLED !== 'false');

// Initialize connection if enabled
if (REDIS_ENABLED) {
  initRedis();
} else {
  console.log('ℹ️ Redis caching is disabled. Falling back entirely to memory cache.');
}


const get = async (key) => {
  // 1. Try Redis
  if (isRedisConnected && redisClient) {
    try {
      const data = await redisClient.get(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      console.warn('Redis read failed, falling back to memory:', err.message);
    }
  }

  // 2. Fallback to Local Memory Cache
  const item = localCache.get(key);
  if (item) {
    if (!isExpired(item)) {
      return item.value;
    }
    // Purge expired key
    localCache.delete(key);
  }
  return null;
};

const set = async (key, value, ttl = CACHE_TTL) => {
  // Always set in Local Memory Cache first for speed & safety
  localCache.set(key, {
    value,
    expiresAt: Date.now() + (ttl * 1000)
  });

  // Then try setting in Redis
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (err) {
      console.warn('Redis write failed:', err.message);
    }
  }
};

const publishCacheInvalidation = async (companyId) => {
  if (!companyId) return;

  const payload = JSON.stringify({ companyId });

  // 1. Trigger local memory invalidation instantly (handles local development gracefully)
  invalidateLocalCache(companyId);

  // 2. Publish event to Redis Pub/Sub for other cluster instances
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.publish('accounting-event', payload);
      console.log(`Published accounting cache invalidation event for company: ${companyId}`);
    } catch (err) {
      console.warn('Failed to publish accounting invalidation event:', err.message);
    }
  }
};

module.exports = {
  get,
  set,
  publishCacheInvalidation,
  isRedisConnected: () => isRedisConnected
};
