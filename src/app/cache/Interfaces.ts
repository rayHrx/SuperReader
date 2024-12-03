export interface PostBookRequest {
  type: string;
}

export interface PostBookResponse {
  book_id: string;
  upload_url: string;
}

export interface SetBookUploadedRequest {
  is_uploaded?: boolean;
  title?: string;
}

export interface SetBookProgressRequest {
  progress: number;
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

interface Paragraph {
  type: 'core' | 'transition';
  content: string;
  pages: number[];
}

interface DistilledPage {
  book_id: string;
  user_id: string;
  start_page: number;
  end_page: number;
  paragraphs: Paragraph[];
  created_datetime: string;
  processing_status: 'COMPLETED' | string;
}

export interface DistilledContentResponse {
  distilled_page: DistilledPage;
}

export interface ContentSectionResponse {
  // Define content section response structure
  book_id: string;
  user_id: string;
  start_page: number;
  end_page: number;
  pages: number[];
}

export interface AllContentSectionsResponse {
  // Define all content sections response structure
  content_sections: ContentSectionResponse[];
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

export interface Book {
  id: string;
  title: string;
  type: string;
  user_id: string;
  created_datetime: string;
  is_uploaded: boolean;
  progress: number;
  content_section_generated: boolean;
  total_page: number | null;
  compression_ratio: number | null;
}

export interface GetBooksResponse {
  books: Book[];
}

// Add these new interfaces after the existing ones
export interface CheckIn {
  user_id: string;
  created_datetime: string;
}

export interface DailyCheckIn {
  date: string;
  checked_in: boolean;
}

export interface GetLastNCheckInResponse {
  check_ins: CheckIn[];
}
