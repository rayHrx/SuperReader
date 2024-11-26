import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { CacheModel } from './CacheModel';
import { CacheService } from './CacheService';
import { CacheController } from './CacheController';
import {
  PostBookRequest,
  SetBookUploadedRequest,
  BookResponse,
  DistilledContentResponse,
  ContentSectionResponse,
  PostBookResponse,
  AppConfig
} from './Interfaces';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';
import { getAuth } from 'firebase/auth';

export class APIs {
  private sqlite: SQLiteConnection;
  private db!: SQLiteDBConnection;
  private cacheController!: CacheController;
  private baseUrl: string = 'https://superreader-442520.uc.r.appspot.com'; // Replace with your actual API base URL

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async initialize(): Promise<void> {
    const platform = Capacitor.getPlatform();
    if (platform === 'web') {
      jeepSqlite(window);
      const jeepEl = document.createElement("jeep-sqlite");
      document.body.appendChild(jeepEl);
      await customElements.whenDefined("jeep-sqlite");
      await this.sqlite.initWebStore();
    }

    this.db = await this.sqlite.createConnection('cache_db', false, 'no-encryption', 1, false);
    await this.db.open();

    const cacheModel = new CacheModel(this.db);
    await cacheModel.initializeCache();

    const cacheService = new CacheService(cacheModel);
    this.cacheController = new CacheController(cacheService, this);
  }

  private async fetchFromAPI<T>(url: string, options?: RequestInit): Promise<T> {
    const auth = getAuth();
    const user = auth.currentUser;

    let headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (user) {
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    const finalOptions: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...(options?.headers || {}),
      },
    };

    const response = await fetch(`${this.baseUrl}${url}`, finalOptions);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    return response.json();
  }

  // Book endpoints
  async postBook(request: PostBookRequest): Promise<PostBookResponse> {
    return this.fetchFromAPI<PostBookResponse>('/book', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getBook(bookId: string): Promise<BookResponse> {
    return this.cacheController.getData(
      `book_${bookId}`,
      () => this.fetchFromAPI(`/book/${bookId}`),
      60 * 60 * 1000 // Cache for 1 hour
    );
  }

  async setBookUploaded(request: SetBookUploadedRequest): Promise<void> {
    await this.fetchFromAPI('/set_book_uploaded', {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  }

  // Distilled content endpoints
  async getDistilledContent(bookId: string, startPage: number, endPage: number): Promise<DistilledContentResponse> {
    return this.cacheController.getData(
      `distilled_content_${bookId}_${startPage}_${endPage}`,
      () => this.fetchFromAPI(`/get_distilled_content?book_id=${bookId}&start_page=${startPage}&end_page=${endPage}`),
      30 * 60 * 1000 // Cache for 30 minutes
    );
  }

  // Content section endpoints
  async getContentSection(bookId: string, pageNum: number): Promise<ContentSectionResponse> {
    return this.cacheController.getData(
      `content_section_${bookId}_${pageNum}`,
      () => this.fetchFromAPI(`/get_content_section?book_id=${bookId}&page_num=${pageNum}`),
      30 * 60 * 1000 // Cache for 30 minutes
    );
  }

  // Cache management
  async clearCache(): Promise<void> {
    await this.cacheController.clearCache();
  }

  async saveToStore(database: string): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      await this.sqlite.saveToStore(database);
    }
  }

  // App Config Service
  async setAppConfig(config: AppConfig, expiration?: number): Promise<void> {
    const defaultExpiration = 60 * 1000; // 1 minute
    const expirationTime = expiration || defaultExpiration;

    console.log(`Setting config: ${config.key}`);
    await this.cacheController.set(
      `app_config_${config.key}`,
      config.value,
      expirationTime
    );
  }

  async getAppConfig(key: string): Promise<any> {
    return this.cacheController.getData(
      `app_config_${key}`,
      null,
      0 // No expiration for this get operation
    );
  }

  async removeAppConfig(key: string): Promise<void> {
    await this.cacheController.invalidateCache(`app_config_${key}`);
  }
}