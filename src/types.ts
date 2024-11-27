export type ReadingDepth = 'original' | 'condensed' | 'quick';

export interface PageRange {
  start: number;
  end: number;
}

export interface Paragraph {
  title: string;
  content: string;
  pages: number[];
}

export interface DistilledPage {
  start_page: number;
  end_page: number;
  paragraphs: Paragraph[];
}

export interface Page {
  content: string[];
  pageNumber: number;
  originalPageRange?: PageRange;
  paragraphs?: Paragraph[];
}

export interface ChapterContent {
  original: Page[];
  condensed: Page[];
  quick: Page[];
}

export interface Chapter {
  id: number;
  title: string;
  content: {
    original: number[];
    condensed: number[];
    quick: number[];
  };
  estimatedReadTime: {
    original: number;
    condensed: number;
    quick: number | null;
  };
  totalPages: {
    original: number;
    condensed: number;
    quick: number | null;
  };
}

export interface PageMapping {
  condensedSection: number;
  pageRange: {
    start: number;
    end: number;
  };
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  pdfUrl: string;
  chapters: Chapter[];
}