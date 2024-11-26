import { CacheModel } from './CacheModel';

export class CacheService {
  private cacheModel: CacheModel;

  constructor(cacheModel: CacheModel) {
    this.cacheModel = cacheModel;
  }

  async getExpiration(key: string): Promise<number | undefined> {
    return this.cacheModel.getExpiration(key);
  }


  async get<T>(key: string): Promise<T | null> {
    const value = await this.cacheModel.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set<T>(key: string, value: T, expiration?: number): Promise<void> {
    await this.cacheModel.set(key, JSON.stringify(value), expiration);
  }

  async remove(key: string): Promise<void> {
    await this.cacheModel.remove(key);
  }

  async clear(): Promise<void> {
    await this.cacheModel.clear();
  }
}