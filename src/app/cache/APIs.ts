"use client";

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
  AllContentSectionsResponse,
  AppConfig,
  GetBooksResponse,
  CheckInResponse,
  DailyCheckIn,
  GetLastNCheckInResponse
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

  private async fetchFromAPI<T>(
    url: string,
    options?: RequestInit,
    returnStatusCode: boolean = false
  ): Promise<T | { data: T; status: number }> {
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

    // Try parsing as JSON first, fall back to text if it fails
    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const textData = await response.text();
      try {
        data = JSON.parse(textData);
      } catch {
        data = textData;
      }
    }

    return returnStatusCode
      ? { data, status: response.status }
      : data;
  }

  // Book endpoints
  async postBook(request: PostBookRequest): Promise<PostBookResponse> {
    const response = await this.fetchFromAPI<PostBookResponse>('/book', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response as PostBookResponse;
  }

  async getBook(bookId: string): Promise<BookResponse> {
    const response = await this.cacheController.getData(
      `book_${bookId}`,
      () => this.fetchFromAPI(`/book/${bookId}`),
      1
    );
    return response as BookResponse;
  }

  async setBookUploaded(bookId: string): Promise<void> {
    await this.fetchFromAPI('/book/${bookId}', {
      method: 'PATCH',
    });
  }

  // Distilled content endpoints
  async getDistilledContent(bookId: string, startPage: number, endPage: number): Promise<DistilledContentResponse> {
    const cacheKey = `distilled_content_${bookId}_${startPage}_${endPage}`;
    const cacheDuration = 24 * 60 * 60 * 1000; // 24 hours

    return this.cacheController.getData(
      cacheKey,
      async () => {
        const maxAttempts = 60;
        const pollingInterval = 1000; // 1 second

        const fetchWithStatus = async () => {
          const result = await this.fetchFromAPI<DistilledContentResponse>(
            `/get_distilled_content?book_id=${bookId}&start_page=${startPage}&end_page=${endPage}`,
            undefined,
            true // Set returnStatusCode to true
          );
          return result as { data: DistilledContentResponse; status: number };
        };

        let attempts = 0;
        while (attempts < maxAttempts) {
          const response = await fetchWithStatus();
          console.log(`Attempt ${attempts + 1} for ${bookId}_${startPage}_${endPage}, status code: ${response.status}`);

          if (response.status === 200) {
            console.log(`Returned status code 200, data: ${JSON.stringify(response.data, null, 2)}`);
            return response.data;
          }

          // If not successful, wait before trying again
          await new Promise(resolve => setTimeout(resolve, pollingInterval));
          attempts++;
        }

        throw new Error(`Failed to get distilled content after ${maxAttempts} attempts`);
      },
      cacheDuration
    );
  }

  // Content section endpoints of a page
  async getContentSection(bookId: string, pageNum: number): Promise<ContentSectionResponse> {
    const response = await this.cacheController.getData(
      `content_section_${bookId}_${pageNum}`,
      () => this.fetchFromAPI(`/get_content_section?book_id=${bookId}&page_num=${pageNum}`),
      24 * 60 * 60 * 1000 // Cache for 24 hours
    );
    return response as ContentSectionResponse;
  }

  // Get all content sections from a book
  async getAllContentSections(bookId: string): Promise<AllContentSectionsResponse> {
    const response = await this.cacheController.getData(
      `all_content_sections_${bookId}`,
      () => this.fetchFromAPI(`/content_section?book_id=${bookId}`),
      24 * 60 * 60 * 1000 // Cache for 24 hours
    );
    return response as AllContentSectionsResponse;
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

  // Get all books
  async getBooks(): Promise<GetBooksResponse> {
    const response = await this.cacheController.getData(
      'all_books',
      () => this.fetchFromAPI<GetBooksResponse>('/book'),
      5 * 60 * 1000 // Cache for 5 minutes
    );
    return response as GetBooksResponse;
  }

  // Save check-in for the current day
  async saveCheckIn(): Promise<CheckInResponse> {
    const response = await this.fetchFromAPI<CheckInResponse>('/save_check_in', {
      method: 'POST'
    });
    return response as CheckInResponse;
  }

  // Get last n days of check-ins
  async getLastNCheckIns(n: number): Promise<GetLastNCheckInResponse> {
    const response = await this.cacheController.getData(
      `last_${n}_check_ins`,
      () => this.fetchFromAPI<GetLastNCheckInResponse>(`/get_last_n_check_in?n=${n}`),
      5 * 60 * 1000 // Cache for 5 minutes
    );
    return response as GetLastNCheckInResponse;
  }
}