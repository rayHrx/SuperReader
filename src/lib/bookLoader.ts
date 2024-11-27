import { Book, Chapter, Paragraph } from '@/types';

interface BookDataPage {
  page_num: number;
  content: string;
}

interface DistilledPage {
  start_page: number;
  end_page: number;
  paragraphs: Paragraph[];
}

interface BookData {
  [title: string]: {
    original_pages: BookDataPage[];
    distileed_pages: DistilledPage[];
  };
}

const fallbackBook: Book = {
  id: "1",
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
    // Fetch the JSON file from the public directory
    const response = await fetch('/book_data.json');
    if (!response.ok) {
      throw new Error('Failed to fetch book data');
    }
    
    const data: BookData = await response.json();
    const bookTitle = "The psychology of money";
    const bookData = data[bookTitle];

    if (!bookData?.original_pages || !bookData?.distileed_pages) {
      console.error('Invalid book data structure:', bookData);
      throw new Error('Invalid book data format');
    }

    // Create original pages
    const originalPages = bookData.original_pages
      .filter(page => page.content.trim() !== '')
      .map(page => ({
        content: [page.content],
        pageNumber: page.page_num
      }));

    // Create condensed pages from distilled pages with paragraphs
    const condensedPages = bookData.distileed_pages.map((page, index) => {
      if (!Array.isArray(page.paragraphs)) {
        console.error('Invalid paragraphs for page:', page);
        return {
          content: ["Error loading content"],
          pageNumber: index + 1,
          originalPageRange: {
            start: page.start_page,
            end: page.end_page
          },
          paragraphs: []
        };
      }

      return {
        content: page.paragraphs.map(p => `${p.title}\n\n${p.content}`),
        pageNumber: index + 1,
        originalPageRange: {
          start: page.start_page,
          end: page.end_page
        },
        paragraphs: page.paragraphs
      };
    });

    // Create the chapter
    const chapter: Chapter = {
      id: 1,
      title: "The Psychology of Money",
      content: {
        original: originalPages,
        condensed: condensedPages,
        quick: [] // Ignoring quick read for now
      },
      estimatedReadTime: {
        original: Math.ceil(originalPages.length * 2),
        condensed: Math.ceil(condensedPages.length * 1.5),
        quick: 0
      },
      totalPages: {
        original: originalPages.length,
        condensed: condensedPages.length,
        quick: 0
      }
    };

    const book: Book = {
      id: "1",
      title: "The Psychology of Money",
      author: "Morgan Housel",
      coverUrl: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&q=80&w=2070",
      chapters: [chapter]
    };

    return book;
  } catch (error) {
    console.error('Error loading book data:', error);
    return fallbackBook;
  }
}