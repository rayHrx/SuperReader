export type ReadingDepth = 'original' | 'condensed' | 'quick';

export interface PageRange {
  start: number;
  end: number;
}

export interface Page {
  content: string[];
  pageNumber: number;
  originalPageRange?: PageRange;
}

export interface ChapterContent {
  original: Page[];
  condensed: Page[];
  quick: Page[];
}

export interface Chapter {
  id: number;
  title: string;
  content: ChapterContent;
  estimatedReadTime: {
    original: number;
    condensed: number;
    quick: number;
  };
  totalPages: {
    original: number;
    condensed: number;
    quick: number;
  };
}

export interface Book {
  id: number;
  title: string;
  author: string;
  coverUrl: string;
  chapters: Chapter[];
}