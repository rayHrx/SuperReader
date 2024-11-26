// app/cache/AppConfigService.ts

import { CacheService } from './CacheService';

export interface AppConfig<T> {
  key: string;
  value: T;
}

export class AppConfigService {
  private cacheService: CacheService;

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService;
  }

  async setConfig<T>(config: AppConfig<T>): Promise<void> {
    console.log(`Setting config: ${config.key}`);
    await this.cacheService.set(config.key, config.value);
  }

  async getConfig<T>(key: string): Promise<T | null> {
    return this.cacheService.get<T>(key);
  }

  async removeConfig(key: string): Promise<void> {
    await this.cacheService.remove(key);
  }
}