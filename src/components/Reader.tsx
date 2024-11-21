import React, { useState, useRef } from 'react';
import { Book, ReadingDepth } from '../types';
import { ChevronLeft, ChevronRight, Clock, BookOpen, BookOpenCheck } from 'lucide-react';
import DepthControl from './DepthControl';
import clsx from 'clsx';

interface ReaderProps {
  book: Book;
}

export default function Reader({ book }: ReaderProps) {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [readingDepth, setReadingDepth] = useState<ReadingDepth>('condensed');
  const [currentPage, setCurrentPage] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);

  const chapter = book.chapters[currentChapter];
  const pages = chapter?.content[readingDepth] || [];
  const totalPages = pages.length;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!chapter) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* Side Navigation */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <BookOpenCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Pages</span>
          </div>
          <p className="text-sm text-gray-400">
            Pages {chapter.content[readingDepth][0].pageNumber} - {
              chapter.content[readingDepth][chapter.content[readingDepth].length - 1].pageNumber
            }
          </p>
        </div>

        {/* Page Thumbnails */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {pages.map((page, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              className={clsx(
                'w-full group relative transition-all',
                currentPage === index + 1 ? 'ring-2 ring-blue-500' : ''
              )}
            >
              {/* Thumbnail Preview */}
              <div className="aspect-[3/4] bg-gray-700 rounded-lg overflow-hidden">
                <div className="p-3 transform scale-[0.4] origin-top-left">
                  {page.content.map((paragraph, pIdx) => (
                    <div
                      key={pIdx}
                      className="h-2 bg-gray-500 rounded mb-1 w-full"
                      style={{
                        width: `${Math.random() * 30 + 70}%`,
                      }}
                    />
                  ))}
                </div>
                {/* Page Number & Range Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-gray-900 to-transparent">
                  <div className="text-xs text-white">Page {page.pageNumber}</div>
                  {page.originalPageRange && (
                    <div className="text-xs text-gray-400">
                      Original: {page.originalPageRange.start}-{page.originalPageRange.end}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentChapter(prev => Math.max(0, prev - 1))}
                disabled={currentChapter === 0}
                className="p-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 text-gray-300"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-white">
                <h2 className="text-lg font-semibold">{chapter.title}</h2>
                <div className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
              <button
                onClick={() => setCurrentChapter(prev => Math.min(book.chapters.length - 1, prev + 1))}
                disabled={currentChapter === book.chapters.length - 1}
                className="p-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 text-gray-300"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{chapter.estimatedReadTime[readingDepth]} min read</span>
            </div>
          </div>
        </div>

        {/* Reading Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto p-8 bg-gray-900"
        >
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-800 rounded-lg shadow-lg p-8">
              {pages[currentPage - 1]?.content.map((paragraph, idx) => (
                <p
                  key={idx}
                  className="text-gray-300 text-lg leading-relaxed mb-4 last:mb-0"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reading Depth Control */}
      <DepthControl currentDepth={readingDepth} onChange={setReadingDepth} />
    </div>
  );
}