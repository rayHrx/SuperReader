import { Suspense } from "react";
import Layout from "@/components/Layout";
import Reader from "@/components/Reader";
import { loadBookData } from "@/lib/bookLoader";
import { notFound } from "next/navigation";
import { APIs } from "@/app/cache/APIs";
import { Book } from "@/types";

interface Props {
  params: {
    bookId: string;
  };
}

async function fetchBookData(bookId: string): Promise<Book> {
  console.log("Starting fetchBookData for bookId:", bookId);

  // For bookId "1", return placeholder book
  if (bookId === "1") {
    return loadBookData();
  }

  // For actual books, fetch from API
  try {
    console.log("Initializing API...");
    const api = new APIs();
    await api.initialize();
    console.log("API initialized, fetching book...");

    const bookResponse = await api.getBook(bookId);
    console.log("Book response received:", bookResponse);

    // Create initial book structure
    // PDF metadata will be extracted on the client side
    return {
      id: bookId,
      title: "Loading...",
      author: "Loading...",
      coverUrl: "/placeholder-cover.jpg",
      pdfUrl: bookResponse.download_url,
      chapters: [
        {
          id: 0,
          title: "Loading...",
          content: {
            original: [],
            condensed: [],
            quick: [],
          },
          estimatedReadTime: {
            original: 0,
            condensed: 0,
            quick: 0,
          },
          totalPages: {
            original: 0,
            condensed: 0,
            quick: 0,
          },
        },
      ],
    };
  } catch (error) {
    console.error("Error fetching book:", error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
}

export default async function ReaderPage({ params }: Props) {
  try {
    const bookData = await fetchBookData(params.bookId);

    if (!bookData) {
      notFound();
    }

    return (
      <Layout>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-white text-lg">Loading book...</div>
            </div>
          }
        >
          <Reader book={bookData} />
        </Suspense>
      </Layout>
    );
  } catch (error) {
    console.error("Error in ReaderPage:", error);
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
}
