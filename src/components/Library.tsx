'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Upload, Trash2, BookOpen, Gauge, Clock } from 'lucide-react';
import { Book } from '@/types';
import { useAPIs } from "@/app/cache/useAPIs";
import { PostBookResponse } from "@/app/cache/Interfaces";

interface LibraryProps {
  initialBook: Book;
}

interface UploadingBook {
  file: File;
  bookId?: string;
  uploadUrl?: string;
  isUploading: boolean;
  uploadProgress: number;
  isComplete?: boolean;
  error?: string;
}

function calculateCompressionScore(book: Book) {
  const originalPages = book.chapters.reduce(
    (sum, chapter) => sum + chapter.content.original.length,
    0
  );
  const condensedPages = book.chapters.reduce(
    (sum, chapter) => sum + chapter.content.condensed.length,
    0
  );

  const score = Math.round(
    ((originalPages - condensedPages) / originalPages) * 100
  );
  const originalTime = book.chapters.reduce(
    (sum, chapter) => sum + chapter.estimatedReadTime.original,
    0
  );
  const condensedTime = book.chapters.reduce(
    (sum, chapter) => sum + chapter.estimatedReadTime.condensed,
    0
  );

  return { score, originalTime, condensedTime };
}

export default function Library({ initialBook }: LibraryProps) {
  const [books, setBooks] = useState<Book[]>([initialBook]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingBooks, setUploadingBooks] = useState<UploadingBook[]>([]);
  const { apis, isInitialized } = useAPIs();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processFiles = async (files: File[]) => {
    const newUploadingBooks = files.map((file) => ({
      file,
      isUploading: false,
      uploadProgress: 0,
    }));

    setUploadingBooks((prev) => [...prev, ...newUploadingBooks]);

    for (const uploadingBook of newUploadingBooks) {
      try {
        const bookRequest = {
          type: uploadingBook.file.name.toLowerCase().endsWith(".pdf")
            ? "pdf"
            : "epub",
        };

        const response: PostBookResponse = await apis!.postBook(bookRequest);

        setUploadingBooks((prev) =>
          prev.map((book) =>
            book === uploadingBook
              ? {
                  ...book,
                  bookId: response.book_id,
                  uploadUrl: response.upload_url,
                }
              : book
          )
        );
      } catch (error) {
        console.error("Error getting upload URL:", error);
        // Remove the failed book from uploading list
        setUploadingBooks((prev) =>
          prev.filter((book) => book !== uploadingBook)
        );
      }
    }
  };

  const uploadBookFile = async (uploadingBook: UploadingBook) => {
    if (!uploadingBook.uploadUrl || !uploadingBook.bookId) return;

    try {
      setUploadingBooks((prev) =>
        prev.map((book) =>
          book === uploadingBook
            ? {
                ...book,
                isUploading: true,
                error: undefined,
                uploadProgress: 0,
              }
            : book
        )
      );

      // Use fetch instead of XMLHttpRequest
      const response = await fetch(uploadingBook.uploadUrl, {
        method: "PUT",
        body: uploadingBook.file,
        mode: "cors", // Explicitly set CORS mode
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      // Set progress to 100% when complete
      setUploadingBooks((prev) =>
        prev.map((book) =>
          book === uploadingBook ? { ...book, uploadProgress: 100 } : book
        )
      );

      // Notify backend that upload is complete
      await apis!.setBookUploaded({ book_id: uploadingBook.bookId });

      setUploadingBooks((prev) =>
        prev.map((book) =>
          book === uploadingBook
            ? { ...book, isUploading: false, isComplete: true }
            : book
        )
      );
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadingBooks((prev) =>
        prev.map((book) =>
          book === uploadingBook
            ? {
                ...book,
                isUploading: false,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : book
        )
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
        {uploadingBooks.length > 0 ? (
          <div className="space-y-4">
            {uploadingBooks.map((book, index) => (
              <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white">{book.file.name}</span>
                  <span className="text-gray-400">
                    {(book.file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>

                {book.error && (
                  <div className="text-red-500 mb-4 text-sm">
                    Error: {book.error}
                  </div>
                )}

                <div className="flex justify-center space-x-4">
                  {book.isComplete ? (
                    <button
                      onClick={() => setUploadingBooks([])}
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
                  ) : book.isUploading ? (
                    <div className="flex items-center space-x-2 text-blue-500">
                      <svg
                        className="animate-spin h-5 w-5"
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
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <>
                      {!book.uploadUrl ? (
                        <div className="flex items-center space-x-2 text-gray-400">
                          <svg
                            className="animate-spin h-5 w-5"
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
                          <span>Preparing...</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => uploadBookFile(book)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                          Start Upload
                        </button>
                      )}
                      <button
                        onClick={() => setUploadingBooks([])}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>

                {book.isUploading && (
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${book.uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2 text-white">
              Upload a Book
            </h3>
            <p className="text-gray-400 mb-4">
              Drag and drop your book files here, or click to select files
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.epub,.txt"
              multiple
            />
            <button
              onClick={handleSelectClick}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Select Files
            </button>
          </>
        )}
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => {
          const { score, originalTime, condensedTime } =
            calculateCompressionScore(book);
          const timeSaved = originalTime - condensedTime;
          const progressPercentage = Math.round(
            (condensedTime / originalTime) * 100
          );

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
                  <p className="text-gray-300">{book.author}</p>
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
                      {score}% reduced
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
                      {originalTime}m → {condensedTime}m
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                    <span>Reading Progress</span>
                    <span>{progressPercentage}%</span>
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
                  <Link
                    href={`/read/${book.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    Read Now
                  </Link>
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
      {books.length === 0 && (
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
    </div>
  );
}