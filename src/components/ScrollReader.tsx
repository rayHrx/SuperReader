import React, { useRef, useEffect, useState } from 'react';
import { Book, ReadingDepth } from '../types';
import { Clock, Book as BookIcon } from 'lucide-react';

interface ScrollReaderProps {
  book: Book;
  readingDepth: ReadingDepth;
}

export default function ScrollReader({ book, readingDepth }: ScrollReaderProps) {
  const [activeChapter, setActiveChapter] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pagesRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageData = entry.target.getAttribute('data-page')?.split('-');
            if (pageData) {
              const [chapterIndex, pageNumber] = pageData;
              setActiveChapter(Number(chapterIndex));
              setActivePage(Number(pageNumber));
            }
          }
        });
      },
      { threshold: 0.3, rootMargin: '-20% 0px -20% 0px' }
    );

    pagesRef.current.forEach((page) => {
      if (page) observerRef.current?.observe(page);
    });

    return () => observerRef.current?.disconnect();
  }, [readingDepth]);

  const totalPages = book.chapters.reduce(
    (sum, chapter) => sum + chapter.totalPages[readingDepth],
    0
  );

  return (
    <div className="max-w-3xl mx-auto px-4">
      {/* Progress indicator */}
      <div className="fixed top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-50">
        <div className="text-sm font-medium text-gray-500">
          Chapter {activeChapter + 1} of {book.chapters.length}
        </div>
        <div className="mt-1 text-lg font-bold text-gray-900">
          {book.chapters[activeChapter].title}
        </div>
        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {book.chapters[activeChapter].estimatedReadTime[readingDepth]} min read
          </div>
          <div className="flex items-center">
            <BookIcon className="w-4 h-4 mr-1" />
            Page {activePage} of {totalPages}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-24 pb-32">
        {book.chapters.map((chapter, chapterIndex) => (
          <div key={chapter.id} className="relative">
            {/* Chapter title with visual divider */}
            <div className="relative mb-8">
              <h2 className="text-3xl font-bold text-gray-900 px-8 py-6 bg-white rounded-lg shadow-md">
                {chapter.title}
              </h2>
              {chapterIndex > 0 && (
                <div className="absolute -top-4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              )}
            </div>

            {/* Chapter pages */}
            {chapter.content[readingDepth].map((page, pageIndex) => (
              <div
                key={`${chapterIndex}-${page.pageNumber}`}
                ref={(el) => (pagesRef.current[page.pageNumber - 1] = el)}
                data-page={`${chapterIndex}-${page.pageNumber}`}
                className="relative bg-white rounded-lg shadow-md mb-8 overflow-hidden"
              >
                {/* Page content */}
                <div className="p-8">
                  <div className="space-y-6">
                    {page.content.map((paragraph, pIndex) => (
                      <p
                        key={pIndex}
                        className="text-lg leading-relaxed text-gray-700"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Simplified page footer */}
                <div className="absolute bottom-2 right-4">
                  <div className="text-sm text-gray-400">
                    {page.pageNumber}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}