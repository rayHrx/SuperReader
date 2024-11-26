export interface PostBookRequest {
  type: string;
}

export interface PostBookResponse {
  book_id: string;
  upload_url: string;
}

export interface SetBookUploadedRequest {
  book_id: string;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

// API Response interfaces
export interface BookResponse {
  // Define book response structure based on your needs
  book_id: string;
  download_url: string;
}

export interface DistilledContentResponse {
  // Define distilled content response structure
  content: string;
  // Add other properties
}

export interface ContentSectionResponse {
  // Define content section response structure
  section: string;
  // Add other properties
}

// Cache-specific interfaces
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiration: number;
}

// App configuration interfaces
export interface AppConfig {
  key: string;
  value: any;
}
