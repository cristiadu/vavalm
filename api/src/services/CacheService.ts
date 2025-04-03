/**
 * Cache service for storing and retrieving data from memory
 * Used to reduce database queries and improve performance
 */

class MemoryCache {
  private cache: Map<string, { value: unknown, expiry: number | null }>
  private defaultTTL: number

  constructor(defaultTTL = 300) { // Default 5 minutes TTL
    this.cache = new Map()
    this.defaultTTL = defaultTTL
  }

  get<T>(key: string): T | undefined {
    const item = this.cache.get(key)
    
    // Return undefined if item doesn't exist
    if (!item) return undefined
    
    // Check if item has expired
    if (item.expiry && item.expiry < Date.now()) {
      this.del(key)
      return undefined
    }
    
    return item.value as T
  }
  
  set<T>(key: string, value: T, ttl?: number): boolean {
    const expiry = ttl ? Date.now() + (ttl * 1000) : 
      this.defaultTTL ? Date.now() + (this.defaultTTL * 1000) : null
    
    this.cache.set(key, { value, expiry })
    return true
  }
  
  del(key: string): boolean {
    return this.cache.delete(key)
  }
  
  flushAll(): void {
    this.cache.clear()
  }

  // Clean up expired items periodically
  startCleanupInterval(intervalMs = 60000): NodeJS.Timeout {
    return setInterval(() => {
      const now = Date.now()
      for (const [key, item] of this.cache.entries()) {
        if (item.expiry && item.expiry < now) {
          this.cache.delete(key)
        }
      }
    }, intervalMs)
  }

  // Get current cache stats
  getStats(): { size: number, keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Export a singleton instance
const memoryCache = new MemoryCache()
memoryCache.startCleanupInterval()

const CacheService = {
  get: <T>(key: string): T | undefined => {
    return memoryCache.get<T>(key)
  },
  
  set: <T>(key: string, value: T, ttl?: number): boolean => {
    return memoryCache.set<T>(key, value, ttl)
  },
  
  delete: (key: string): boolean => {
    return memoryCache.del(key)
  },
  
  flush: (): void => {
    memoryCache.flushAll()
  },

  getStats: (): { size: number, keys: string[] } => {
    return memoryCache.getStats()
  },
}

export default CacheService 
