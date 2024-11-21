import { Book, Chapter, ChapterContent, Page, PageRange } from '../types';

interface RawBookData {
  title: string;
  author: string;
  sections: {
    start_page: number;
    end_page: number;
    original_content: string[];
    condensed_content: string[];
    quick_content: string[];
  }[];
}

function createPages(
  content: string[],
  startPageNumber: number,
  originalPageRange?: PageRange
): Page[] {
  return content.map((text, index) => ({
    content: [text],
    pageNumber: startPageNumber + index,
    ...(originalPageRange && {
      originalPageRange: {
        start: originalPageRange.start,
        end: originalPageRange.end
      }
    })
  }));
}

const fallbackBook: Book = {
  id: 1,
  title: "The Psychology of Money",
  author: "Morgan Housel",
  coverUrl: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&q=80&w=2070",
  chapters: [{
    id: 1,
    title: "Introduction",
    content: {
      original: [{ content: ["Loading content..."], pageNumber: 1 }],
      condensed: [{ content: ["Loading content..."], pageNumber: 1 }],
      quick: [{ content: ["Loading content..."], pageNumber: 1 }]
    },
    estimatedReadTime: { original: 1, condensed: 1, quick: 1 },
    totalPages: { original: 1, condensed: 1, quick: 1 }
  }]
};

export async function loadBookData(): Promise<Book> {
  try {
    const response = await fetch('/book_data.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch book data: ${response.statusText}`);
    }
    
    const data: RawBookData = await response.json();
    
    if (!data || !Array.isArray(data.sections) || data.sections.length === 0) {
      throw new Error('Invalid or empty book data format');
    }

    const chapters: Chapter[] = data.sections.map((section, index) => {
      const validateContent = (content: unknown[]): string[] => {
        if (!Array.isArray(content) || content.some(item => typeof item !== 'string')) {
          throw new Error(`Invalid content format in section ${index + 1}`);
        }
        return content;
      };

      const originalContent = validateContent(section.original_content);
      const condensedContent = validateContent(section.condensed_content);
      const quickContent = validateContent(section.quick_content);

      const content: ChapterContent = {
        original: createPages(originalContent, section.start_page),
        condensed: createPages(condensedContent, 1, {
          start: section.start_page,
          end: section.end_page
        }),
        quick: createPages(quickContent, 1)
      };

      return {
        id: index + 1,
        title: `Chapter ${index + 1}: Pages ${section.start_page}-${section.end_page}`,
        content,
        estimatedReadTime: {
          original: Math.ceil(originalContent.length * 2),
          condensed: Math.ceil(condensedContent.length * 1.5),
          quick: Math.ceil(quickContent.length)
        },
        totalPages: {
          original: originalContent.length,
          condensed: condensedContent.length,
          quick: quickContent.length
        }
      };
    });

    return {
      id: 1,
      title: data.title || fallbackBook.title,
      author: data.author || fallbackBook.author,
      coverUrl: fallbackBook.coverUrl,
      chapters
    };
  } catch (error) {
    console.error('Error loading book data:', error);
    throw error;
  }
}