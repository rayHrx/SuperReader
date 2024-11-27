"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Reader from "@/components/Reader";
import { loadBookData } from "@/lib/bookLoader";
import { notFound, useRouter } from "next/navigation";
import { APIs } from "@/app/cache/APIs";
import { Book, PageMapping } from "@/types";
import { pdfjs, Document } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// Type for PDF metadata info
interface PDFMetadata {
  info: {
    Title?: string;
    Author?: string;
    [key: string]: any;
  };
}

interface Props {
  params: {
    bookId: string;
  };
}

// Add this helper function at the top level
function createPageToSectionMap(sections: any[]): Record<number, PageMapping> {
  const mapping: Record<number, PageMapping> = {};

  sections.forEach((section, sectionIndex) => {
    // For each page in the section's range
    for (let page = section.start_page; page <= section.end_page; page++) {
      mapping[page] = {
        condensedSection: sectionIndex,
        pageRange: {
          start: section.start_page,
          end: section.end_page,
        },
      };
    }
  });

  return mapping;
}

export default function ReaderPage({ params }: Props) {
  const [bookData, setBookData] = useState<Book | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    async function fetchBookData() {
      try {
        const api = new APIs();
        await api.initialize();

        // await api.clearCache();

        const bookResponse = await api.getBook(params.bookId);
        const contentSectionsResponse = await api.getAllContentSections(
          params.bookId
        );

        contentSectionsResponse.content_sections.sort(
          (a, b) => a.start_page - b.start_page
        );

        console.log(
          `contentSectionsResponse: ${JSON.stringify(
            contentSectionsResponse,
            null,
            2
          )}`
        );

        // Create initial book structure
        const initialBookData: Book = {
          id: params.bookId,
          title: "Loading...",
          author: "Loading...",
          coverUrl: "/placeholder-cover.jpg",
          pdfUrl: bookResponse.download_url,
          chapters: [],
        };

        let cachedMetadata = await api.getAppConfig(
          `book_metadata_${params.bookId}`
        );
        let updatedBookData;

        if (cachedMetadata) {
          updatedBookData = cachedMetadata;
        } else {
          const loadingTask = pdfjs.getDocument(bookResponse.download_url);
          const pdf = await loadingTask.promise;
          const metadata = (await pdf.getMetadata()) as PDFMetadata;

          updatedBookData = {
            ...initialBookData,
            title: metadata.info?.Title || "Untitled Document",
            author: metadata.info?.Author || "Unknown Author",
            chapters: contentSectionsResponse.content_sections.map(
              (section, index) => ({
                id: index,
                title: `Section ${index + 1}`,
                content: {
                  original: Array.from(
                    { length: section.end_page - section.start_page + 1 },
                    (_, i) => section.start_page + i
                  ),
                  condensed: index + 1,
                  quick: [],
                },
                estimatedReadTime: {
                  original: section.end_page - section.start_page + 1,
                  condensed: 1,
                  quick: null,
                },
                totalPages: {
                  original: section.end_page - section.start_page + 1,
                  condensed: 1,
                  quick: null,
                },
              })
            ),
          };

          // Cache the metadata
          await api.setAppConfig(
            {
              key: `book_metadata_${params.bookId}`,
              value: updatedBookData,
            },
            24 * 60 * 60 * 1000
          );
        }

        console.log(
          `updatedBookData: ${JSON.stringify(updatedBookData, null, 2)}`
        );
        setBookData(updatedBookData);
      } catch (error) {
        console.error("Error fetching book:", error);
        setError(true);
      }
    }

    fetchBookData();
  }, [params.bookId]);

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-500 text-lg">
            Error loading book. Please try again later.
          </div>
        </div>
      </Layout>
    );
  }

  if (!bookData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white text-lg">Loading book...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Reader book={bookData} />
    </Layout>
  );
}
