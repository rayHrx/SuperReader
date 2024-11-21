'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Book, ReadingDepth } from '@/types';
import { Clock, BookOpenCheck, BarChart2, Lightbulb } from 'lucide-react';
import DepthControl from './DepthControl';
import TextSettings from './TextSettings';
import ContentSegment from './ContentSegment';
import ReadingStats from './ReadingStats';
import KeyInsights from './KeyInsights';
import clsx from 'clsx';

interface ReaderProps {
  book: Book;
}

export default function Reader({ book }: ReaderProps) {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [readingDepth, setReadingDepth] = useState<ReadingDepth>('original');
  const [visiblePages, setVisiblePages] = useState<number[]>([1]);
  const [activeSegment, setActiveSegment] = useState<number>(0);
  const [fontSize, setFontSize] = useState('text-base');
  const [fontFamily, setFontFamily] = useState('inter');
  const [showStats, setShowStats] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [readingStats, setReadingStats] = useState({
    readingStreak: 5,
    pagesRead: 0,
    bookmarks: 0,
    notes: 0
  });
  
  const contentRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const chapter = book.chapters[currentChapter];
  if (!chapter?.content?.[readingDepth]) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const pages = chapter.content[readingDepth];
  const totalPages = pages.length;

  const registerPageRef = useCallback((pageNumber: number, element: HTMLDivElement | null) => {
    if (element) {
      pageRefs.current.set(pageNumber, element);
    } else {
      pageRefs.current.delete(pageNumber);
    }
  }, []);

  const scrollToPage = useCallback((pageNumber: number) => {
    const element = pageRefs.current.get(pageNumber);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNumber = Number(entry.target.getAttribute('data-page'));
          if (entry.isIntersecting) {
            setVisiblePages((prev) => 
              prev.includes(pageNumber) ? prev : [...prev, pageNumber].sort((a, b) => a - b)
            );
            setReadingStats(prev => ({
              ...prev,
              pagesRead: Math.max(prev.pagesRead, pageNumber)
            }));
          } else {
            setVisiblePages((prev) => prev.filter(p => p !== pageNumber));
          }
        });
      },
      {
        root: null,
        threshold: 0.1,
        rootMargin: '-20% 0px -20% 0px'
      }
    );

    const currentRefs = Array.from(pageRefs.current.values());
    currentRefs.forEach(element => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [readingDepth]);

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
            {book.title} - {readingDepth} view
          </p>
        </div>

        {/* Page Thumbnails */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {pages.map((page, index) => (
            <button
              key={index}
              onClick={() => scrollToPage(index + 1)}
              className={clsx(
                'w-full group relative transition-all',
                visiblePages.includes(index + 1) ? 'ring-2 ring-blue-500' : ''
              )}
            >
              <div className="aspect-[3/4] bg-gray-700 rounded-lg overflow-hidden p-3">
                <div className="text-xs text-white">Page {page.pageNumber}</div>
                {readingDepth === 'original' ? (
                  <div className="mt-2 text-xs text-gray-400 line-clamp-3">
                    {page.content[0]}
                  </div>
                ) : (
                  page.paragraphs && (
                    <div className="mt-2 text-xs text-gray-400 line-clamp-3">
                      {page.paragraphs[0].title}
                    </div>
                  )
                )}
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
              <div className="text-white">
                <h2 className="text-lg font-semibold">{book.title}</h2>
                <div className="text-sm text-gray-400">
                  Page {visiblePages.join(', ')} of {totalPages}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowStats(!showStats)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Show Reading Stats"
              >
                <BarChart2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowInsights(!showInsights)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Show Key Insights"
              >
                <Lightbulb className="w-5 h-5" />
              </button>
              <TextSettings
                fontSize={fontSize}
                fontFamily={fontFamily}
                onFontSizeChange={setFontSize}
                onFontFamilyChange={setFontFamily}
              />
              <DepthControl currentDepth={readingDepth} onChange={setReadingDepth} />
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{chapter.estimatedReadTime[readingDepth]} min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reading Content */}
        <div className="flex-1 flex overflow-hidden">
          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto p-8 bg-gray-900 scroll-smooth"
          >
            <div className="max-w-3xl mx-auto space-y-8">
              {pages.map((page, pageIndex) => (
                <div
                  key={pageIndex}
                  ref={(el) => registerPageRef(pageIndex + 1, el as HTMLDivElement)}
                  data-page={pageIndex + 1}
                  className="bg-gray-800 rounded-lg shadow-lg p-8"
                >
                  {readingDepth === 'original' ? (
                    <div className={clsx(
                      'text-gray-300 whitespace-pre-wrap',
                      fontSize,
                      {
                        'font-serif': fontFamily === 'serif',
                        'font-mono': fontFamily === 'mono',
                        'font-sans': fontFamily === 'inter'
                      }
                    )}>
                      {page.content.map((text, idx) => (
                        <p key={idx} className="mb-4 last:mb-0">{text}</p>
                      ))}
                    </div>
                  ) : (
                    page.paragraphs?.map((paragraph, pIndex) => (
                      <ContentSegment
                        key={pIndex}
                        title={paragraph.title}
                        content={paragraph.content}
                        pages={paragraph.pages}
                        isActive={activeSegment === pIndex}
                        fontSize={fontSize}
                        fontFamily={fontFamily}
                      />
                    ))
                  )}
                  
                  {/* Page Number */}
                  <div className="mt-6 pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-400">
                      Page {page.pageNumber}
                      {page.originalPageRange && readingDepth !== 'original' && (
                        <span> (Original pages {page.originalPageRange.start}-{page.originalPageRange.end})</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Side Panels */}
          {showStats && (
            <ReadingStats
              readingStreak={readingStats.readingStreak}
              pagesRead={readingStats.pagesRead}
              totalPages={totalPages}
              bookmarks={readingStats.bookmarks}
              notes={readingStats.notes}
              onClose={() => setShowStats(false)}
            />
          )}
          
          {showInsights && (
            <KeyInsights
              paragraphs={pages.flatMap(p => p.paragraphs || [])}
              onClose={() => setShowInsights(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}