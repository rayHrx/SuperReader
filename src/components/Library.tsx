'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Upload, Trash2, BookOpen, Gauge, Clock } from 'lucide-react';
import { Book } from '@/types';

interface LibraryProps {
  initialBook: Book;
}

function calculateCompressionScore(book: Book) {
  const originalPages = book.chapters.reduce((sum, chapter) => 
    sum + chapter.content.original.length, 0);
  const condensedPages = book.chapters.reduce((sum, chapter) => 
    sum + chapter.content.condensed.length, 0);
  
  const score = Math.round(((originalPages - condensedPages) / originalPages) * 100);
  const originalTime = book.chapters.reduce((sum, chapter) => 
    sum + chapter.estimatedReadTime.original, 0);
  const condensedTime = book.chapters.reduce((sum, chapter) => 
    sum + chapter.estimatedReadTime.condensed, 0);

  return { score, originalTime, condensedTime };
}

export default function Library({ initialBook }: LibraryProps) {
  const [books, setBooks] = useState<Book[]>([initialBook]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    console.log('Dropped files:', files);
  };

  const handleDelete = (bookId: number) => {
    setBooks(books.filter(book => book.id !== bookId));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Library</h1>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mb-12 border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-gray-800/50'
            : 'border-gray-700 hover:border-gray-600'
        }`}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2 text-white">Upload a Book</h3>
        <p className="text-gray-400 mb-4">
          Drag and drop your book files here, or click to select files
        </p>
        <button className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Select Files
        </button>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map(book => {
          const { score, originalTime, condensedTime } = calculateCompressionScore(book);
          const timeSaved = originalTime - condensedTime;
          const progressPercentage = Math.round((condensedTime / originalTime) * 100);

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
                  <h3 className="text-xl font-bold text-white mb-1">{book.title}</h3>
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
                    <span>{originalTime}m → {condensedTime}m</span>
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
          <h3 className="text-xl font-semibold text-white mb-2">No Books Yet</h3>
          <p className="text-gray-400">
            Upload your first book to start reading
          </p>
        </div>
      )}
    </div>
  );
}