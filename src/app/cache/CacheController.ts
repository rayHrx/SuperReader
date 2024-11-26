import { Capacitor } from '@capacitor/core';
import { CacheService } from './CacheService';
import { APIs } from './APIs';

export class CacheController {
  private cacheService: CacheService;
  private apis: APIs;

  constructor(cacheService: CacheService, apis: APIs) {
    this.cacheService = cacheService;
    this.apis = apis;
  }

  async getData<T>(key: string, fetchFn: (() => Promise<T>) | null, expiration?: number): Promise<T> {
    const cachedData = await this.cacheService.get<T>(key);
    if (cachedData) {
      console.log(`✅ Cache hit for key: ${key}`);
      return cachedData;
    }

    console.log(`❌ Cache miss for key: ${key}`);

    if (!fetchFn) {
      console.log(`⚠️ No fetch function provided for key: ${key}`);
      // To make this enpoint backwards compatible with return type of Promise<T> instead of Promise<T | null> after
      // adding support for null fetchFn, we need to cast null to T. This is safe because we know that fetchFn is null
      return null as unknown as T;
    }

    const freshData = await fetchFn();
    console.log(`🌐 Fetched fresh data for key: ${key}`);
    await this.cacheService.set(key, freshData, expiration);
    console.log(`💾 Cache set for key: ${key}`);

    // Save to store for web platform
    if (Capacitor.getPlatform() === 'web') {
      await this.apis.saveToStore('cache_db');
    }
    console.log(`📦 Cache saved to store for key: ${key}`);
    return freshData;
  }

  async invalidateCache(key: string): Promise<void> {
    await this.cacheService.remove(key);
  }

  async refreshCache<T>(key: string, fetchFn: () => Promise<T>, expiration?: number): Promise<T> {
    const freshData = await fetchFn();
    await this.cacheService.set(key, freshData, expiration);
    return freshData;
  }

  async set<T>(key: string, value: T, expiration?: number): Promise<void> {
    await this.cacheService.set(key, value, expiration);

    // Save to store for web platform
    if (Capacitor.getPlatform() === 'web') {
      await this.apis.saveToStore('cache_db');
    }
  }

  async writeToBackend<T>(
    key: string,
    data: T,
    writeFn: (data: T) => Promise<void>
  ): Promise<void> {
    await writeFn(data);
  }

  async clearCache(): Promise<void> {
    await this.cacheService.clear();
    console.log("All local cache content has been deleted.");

    // Save to store for web platform
    if (Capacitor.getPlatform() === 'web') {
      await this.apis.saveToStore('cache_db');
    }
  }
}