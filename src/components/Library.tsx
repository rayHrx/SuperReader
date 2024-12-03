'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Upload, Trash2, BookOpen, Gauge, Clock } from "lucide-react";
import { Book } from "@/types";
import { useAPIs } from "@/app/cache/useAPIs";
import { PostBookResponse } from "@/app/cache/Interfaces";

interface LibraryProps {
  initialBooks?: Book[];
}

interface UploadingBook {
  file: File;
  bookId?: string;
  uploadUrl?: string;
  isUploading: boolean;
  isComplete?: boolean;
  error?: string;
  title?: string;
  showTitleInput?: boolean;
}

function calculateCompressionScore(book: Book) {
  const compressionPercentage = book.compression_ratio
    ? Math.round((1 - book.compression_ratio) * 100)
    : 0;

  const minutesPerPage = 2;
  const originalTime = book.total_page ? book.total_page * minutesPerPage : 0;
  const condensedTime = book.compression_ratio
    ? Math.round(originalTime * book.compression_ratio)
    : originalTime;

  const totalTimeSaved = originalTime - condensedTime;

  const progress =
    book.progress && book.total_page ? book.progress / book.total_page : 0;
  const timeSaved = Math.round(totalTimeSaved * progress);

  return {
    score: compressionPercentage,
    originalTime,
    condensedTime,
    timeSaved,
    totalTimeSaved,
  };
}

function formatUploadDate(dateString?: string): string {
  if (!dateString) return "Unknown date";

  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    }
    const hours = Math.floor(diffInHours);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  }

  return date.toLocaleDateString();
}

export default function Library({ initialBooks = [] }: LibraryProps) {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingBook, setUploadingBook] = useState<UploadingBook | null>(
    null
  );
  const { apis, isInitialized } = useAPIs();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      if (!apis) return;

      try {
        await apis.initialize();
        setIsLoading(true);

        const response = await apis.getBooks();
        const uploadedBooks: Book[] = response.books
          .filter((book) => book.is_uploaded)
          .map((book) => ({
            id: book.id,
            title: book.title || "Untitled Book",
            type: book.type as "pdf" | "epub",
            user_id: book.user_id,
            created_at: book.created_datetime,
            updated_at: book.created_datetime,
            status: "ready",
            is_uploaded: book.is_uploaded,
            progress: book.progress,
            content_section_generated: book.content_section_generated,
            total_page: book.total_page,
            compression_ratio: book.compression_ratio,
            coverUrl:
              "https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&auto=format&fit=crop&q=60",
            author: "",
            pdfUrl: "",
            chapters: [],
          }))
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
        setBooks(uploadedBooks);
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isInitialized) {
      fetchBooks();
    }
  }, [apis, isInitialized]);

  const processFiles = async (files: File[]) => {
    if (!apis || files.length === 0) return;

    try {
      await apis.initialize();
      const file = files[0];

      setUploadingBook({
        file,
        isUploading: false,
      });

      const bookRequest = {
        type: file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "epub",
      };

      const response: PostBookResponse = await apis.postBook(bookRequest);

      setUploadingBook((prev) =>
        prev
          ? {
              ...prev,
              bookId: response.book_id,
              uploadUrl: response.upload_url,
            }
          : null
      );
    } catch (error) {
      console.error("Error getting upload URL:", error);
      setUploadingBook(null);
    }
  };

  const uploadBookFile = async (book: UploadingBook) => {
    if (!book.uploadUrl || !book.bookId) return;

    try {
      setUploadingBook((prev) =>
        prev
          ? {
              ...prev,
              isUploading: true,
              error: undefined,
            }
          : null
      );

      const response = await fetch(book.uploadUrl, {
        method: "PUT",
        body: book.file,
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      setUploadingBook((prev) =>
        prev
          ? {
              ...prev,
              isUploading: false,
              showTitleInput: true,
              title: book.file.name.replace(/\.[^/.]+$/, ""),
            }
          : null
      );
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadingBook((prev) =>
        prev
          ? {
              ...prev,
              isUploading: false,
              error: error instanceof Error ? error.message : "Upload failed",
            }
          : null
      );
    }
  };

  const finishUpload = async (book: UploadingBook) => {
    if (!book.bookId || !book.title) return;

    try {
      await apis!.setBookUploaded(book.bookId, {
        is_uploaded: true,
        title: book.title,
      });

      // Reset upload UI
      setUploadingBook(null);

      // Refresh books list
      if (apis) {
        const response = await apis.getBooks();
        const uploadedBooks: Book[] = response.books
          .filter((book) => book.is_uploaded)
          .map((book) => ({
            id: book.id,
            title: book.title || "Untitled Book",
            type: book.type as "pdf" | "epub",
            user_id: book.user_id,
            created_at: book.created_datetime,
            updated_at: book.created_datetime,
            status: "ready",
            is_uploaded: book.is_uploaded,
            progress: book.progress,
            content_section_generated: book.content_section_generated,
            total_page: book.total_page,
            compression_ratio: book.compression_ratio,
            coverUrl:
              "https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&auto=format&fit=crop&q=60",
            author: "",
            pdfUrl: "",
            chapters: [],
          }))
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
        setBooks(uploadedBooks);
      }
    } catch (error) {
      console.error("Error finishing upload:", error);
      setUploadingBook((prev) =>
        prev
          ? {
              ...prev,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to finish upload",
            }
          : null
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (!isInitialized || !apis) {
      console.error("APIs not initialized");
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleDelete = (bookId: string) => {
    setBooks(books.filter((book) => book.id !== bookId));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !isInitialized || !apis) return;

    const files = Array.from(e.target.files);
    await processFiles(files);
  };

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mb-12 border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-gray-800/50"
            : "border-gray-700 hover:border-gray-600"
        }`}
      >
        {uploadingBook ? (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white">{uploadingBook.file.name}</span>
              <span className="text-gray-400">
                {(uploadingBook.file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>

            {uploadingBook.error && (
              <div className="text-red-500 mb-4 text-sm">
                Error: {uploadingBook.error}
              </div>
            )}

            <div className="flex justify-center space-x-4">
              {uploadingBook.showTitleInput ? (
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <label
                      htmlFor="bookTitle"
                      className="text-sm text-gray-400"
                    >
                      Book Title
                    </label>
                    <input
                      id="bookTitle"
                      type="text"
                      value={uploadingBook.title}
                      onChange={(e) =>
                        setUploadingBook((prev) =>
                          prev
                            ? {
                                ...prev,
                                title: e.target.value,
                              }
                            : null
                        )
                      }
                      className="px-3 py-2 bg-gray-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Enter book title"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => finishUpload(uploadingBook)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <span>Finish Upload</span>
                    </button>
                    <button
                      onClick={() => setUploadingBook(null)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : uploadingBook.isComplete ? (
                <button
                  onClick={() => setUploadingBook(null)}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Upload Complete</span>
                </button>
              ) : uploadingBook.isUploading ? (
                <div className="flex items-center justify-center mt-4">
                  <div className="animate-spin w-8 h-8">
                    <svg
                      className="w-full h-full text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => uploadBookFile(uploadingBook)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Start Upload
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2 text-white">
              Upload a Book
            </h3>
            <p className="text-gray-400 mb-4">
              Drag and drop your book file here, or click to select file
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.epub,.txt"
            />
            <button
              onClick={handleSelectClick}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Select File
            </button>
          </>
        )}
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => {
          const {
            score,
            originalTime,
            condensedTime,
            timeSaved,
            totalTimeSaved,
          } = calculateCompressionScore(book);
          const progressPercentage =
            book.progress && book.total_page
              ? Math.round((book.progress / book.total_page) * 100)
              : 0;

          return (
            <div
              key={book.id}
              className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
            >
              <div className="relative h-48">
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-300">
                    Uploaded {formatUploadDate(book.created_at)}
                  </p>
                </div>
              </div>

              <div className="p-4">
                {/* Compression Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-gray-400">Compression</span>
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {score}%
                    </div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-gray-400">Time Saved</span>
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {timeSaved} min
                    </div>
                  </div>
                </div>

                {/* Reading Times */}
                <div className="bg-gray-700/30 rounded-lg p-3 mb-4">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Reading Time</span>
                    <span>
                      {book.compression_ratio
                        ? `${originalTime}m → ${condensedTime}m`
                        : "..."}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                    <span>Reading Progress</span>
                    <span>
                      {/* {typeof book.progress === "number" &&
                      typeof book.total_page === "number"
                        ? `${book.progress}/${book.total_page} pages`
                        : "0/0 pages"} */}
                      {`${book.progress}/${book.total_page} pages`}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-600 rounded-full">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center">
                  {score === 0 ? (
                    <button
                      disabled
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-gray-300 rounded-lg cursor-not-allowed"
                    >
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Processing
                    </button>
                  ) : (
                    <Link
                      href={`/read/${book.id}?progress=${book.progress || 1}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      Read Now
                    </Link>
                  )}
                  <button
                    onClick={() => handleDelete(book.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Delete book"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {!isLoading && books.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Books Yet
          </h3>
          <p className="text-gray-400">
            Upload your first book to start reading
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin w-16 h-16 mx-auto mb-4">
            <svg
              className="w-full h-full text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Loading Your Library
          </h3>
          <p className="text-gray-400">
            Please wait while we fetch your books...
          </p>
        </div>
      )}
    </div>
  );
}