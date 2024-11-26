'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Book, ReadingDepth } from '@/types';
import {
  Clock,
  BookOpenCheck,
  BarChart2,
  Lightbulb,
  ChevronRight,
  ChevronDown,
  Sparkles,
  X,
  Menu,
  MoreVertical,
} from "lucide-react";
import DepthControl from './DepthControl';
import TextSettings from './TextSettings';
import ContentSegment from './ContentSegment';
import ReadingStats from './ReadingStats';
import KeyInsights from './KeyInsights';
import clsx from 'clsx';
import { useState as useReactState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface ReaderProps {
  book: Book;
}

interface Page {
  content: string[];
  pageNumber: number;
  originalPageRange?: {
    start: number;
    end: number;
  };
}

function findCondensedPageForOriginal(
  originalPageNum: number,
  condensedPages: any[]
): number | null {
  for (let i = 0; i < condensedPages.length; i++) {
    const page = condensedPages[i];
    if (
      page.originalPageRange &&
      originalPageNum >= page.originalPageRange.start &&
      originalPageNum <= page.originalPageRange.end
    ) {
      return i + 1; // Adding 1 because page numbers are 1-based
    }
  }
  return null;
}

const scrollableContentStyles =
  "flex-1 overflow-y-auto px-4 sm:px-8 py-8 bg-gray-900 scroll-smooth overscroll-none";
const sidebarStyles =
  "flex-1 overflow-y-auto p-4 pt-0 space-y-2 scroll-smooth overscroll-none scrollbar-hide";
const MIN_SIDEBAR_WIDTH = 250; // increased from 200 to accommodate text
const MAX_SIDEBAR_WIDTH = 400; // reduced from 600 as we don't need as much space now

function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

function MobileMenu({
  showStats,
  setShowStats,
  showInsights,
  setShowInsights,
  fontSize,
  fontFamily,
  onFontSizeChange,
  onFontFamilyChange,
}: {
  showStats: boolean;
  setShowStats: (show: boolean) => void;
  showInsights: boolean;
  setShowInsights: (show: boolean) => void;
  fontSize: string;
  fontFamily: string;
  onFontSizeChange: (size: string) => void;
  onFontFamilyChange: (family: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <button
              onClick={() => {
                setShowStats(!showStats);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
            >
              <BarChart2 className="w-4 h-4 mr-2" />
              Reading Stats
            </button>
            <button
              onClick={() => {
                setShowInsights(!showInsights);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Key Insights
            </button>
            <div className="border-t border-gray-700 my-1" />
            <div className="px-4 py-2">
              <TextSettings
                fontSize={fontSize}
                fontFamily={fontFamily}
                onFontSizeChange={onFontSizeChange}
                onFontFamilyChange={onFontFamilyChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Reader({ book }: ReaderProps) {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [readingDepth, setReadingDepth] = useState<ReadingDepth>("condensed");
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
  const [sidebarWidth, setSidebarWidth] = useReactState(256); // 256px is 'w-64' equivalent
  const [isResizing, setIsResizing] = useReactState(false);
  const [segmentViewStates, setSegmentViewStates] = useState<
    Record<string, boolean>
  >({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [outline, setOutline] = useState<any[]>([]);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const sidebarRef = useRef<HTMLDivElement>(null);

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

  const registerPageRef = useCallback(
    (pageNumber: number, element: HTMLDivElement | null) => {
      if (element) {
        pageRefs.current.set(pageNumber, element);
      } else {
        pageRefs.current.delete(pageNumber);
      }
    },
    []
  );

  const scrollToPage = useCallback((pageNumber: number) => {
    const element = pageRefs.current.get(pageNumber);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  const scrollSidebarToPage = useCallback((pageNumber: number) => {
    if (!sidebarRef.current) return;

    const pageSection = sidebarRef.current.querySelector(
      `[data-page-section="${pageNumber}"]`
    );
    if (pageSection) {
      const sidebarContainer = sidebarRef.current;
      const containerRect = sidebarContainer.getBoundingClientRect();
      const elementRect = pageSection.getBoundingClientRect();

      // Calculate the scroll position to center the element
      const scrollOffset =
        pageSection.getBoundingClientRect().top +
        sidebarContainer.scrollTop -
        containerRect.top -
        containerRect.height / 2 +
        elementRect.height / 2;

      sidebarContainer.scrollTo({
        top: Math.max(0, scrollOffset),
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNumber = Number(entry.target.getAttribute("data-page"));
          if (entry.isIntersecting) {
            setVisiblePages((prev) =>
              prev.includes(pageNumber)
                ? prev
                : [...prev, pageNumber].sort((a, b) => a - b)
            );
            setReadingStats((prev) => ({
              ...prev,
              pagesRead: Math.max(prev.pagesRead, pageNumber),
            }));
            scrollSidebarToPage(pageNumber);
          } else {
            setVisiblePages((prev) => prev.filter((p) => p !== pageNumber));
          }
        });
      },
      {
        root: null,
        threshold: 0.1,
        rootMargin: "-20% 0px -20% 0px",
      }
    );

    const currentRefs = Array.from(pageRefs.current.values());
    currentRefs.forEach((element) => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [readingDepth, scrollSidebarToPage]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = e.clientX;
        if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const getOriginalContent = useCallback(
    (pageNumbers: number[]) => {
      const originalPages = book.chapters[currentChapter].content.original;
      return pageNumbers.flatMap(
        (pageNum) => originalPages[pageNum - 1]?.content || []
      );
    },
    [book.chapters, currentChapter]
  );

  const calculateCompressionMetrics = useCallback(
    (page: any) => {
      if (!page.originalPageRange || readingDepth === "original") return null;

      const originalPages = book.chapters[currentChapter].content.original;
      const originalText = originalPages
        .slice(page.originalPageRange.start - 1, page.originalPageRange.end)
        .map((p: Page) => p.content)
        .flat()
        .join(" ");

      const condensedText = page.paragraphs
        .map((p: { content: string }) => p.content)
        .join(" ");

      const originalWords = countWords(originalText);
      const condensedWords = countWords(condensedText);
      const compressionMultiplier = originalWords / condensedWords;
      const timeSaved = Math.abs(originalWords - condensedWords) / 200;

      return {
        originalWords,
        condensedWords,
        compressionMultiplier,
        timeSaved,
      };
    },
    [book.chapters, currentChapter, readingDepth]
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const navigateToCondensedView = useCallback(
    (pageNumber: number) => {
      setReadingDepth("condensed");
      scrollToPage(pageNumber);
    },
    [scrollToPage]
  );

  const onDocumentLoadSuccess = async ({
    numPages: nextNumPages,
  }: {
    numPages: number;
  }) => {
    setNumPages(nextNumPages);

    // Get PDF outline (table of contents)
    if (pdfDocument) {
      const outline = await pdfDocument.getOutline();
      if (outline) {
        setOutline(outline);

        // Update chapters based on outline
        const pdfChapters = outline.map((item: any, index: number) => ({
          title: item.title,
          content: {
            original: Array.from({ length: numPages }, (_, i) => ({
              content: [],
              pageNumber: i + 1,
            })),
            condensed: [],
          },
        }));

        // Update book chapters
        book.chapters = pdfChapters;
      }
    }
  };

  return (
    <div className="flex bg-gray-900 overflow-hidden">
      {/* Sidebar Toggle Button - now shown on both mobile and desktop */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={clsx(
          "fixed bottom-4 left-4 z-50 bg-gray-800 p-3 rounded-full shadow-lg text-white hover:bg-gray-700",
          // Move up slightly when on desktop to avoid overlap with other elements
          isMobile ? "" : "bottom-8"
        )}
      >
        {isSidebarOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Sidebar */}
      {isSidebarOpen && (
        <div
          style={{ width: isMobile ? "100%" : sidebarWidth }}
          className={clsx(
            "bg-gray-800 border-r border-gray-700 flex flex-col h-[calc(100vh-64px)]",
            isMobile ? "fixed z-40 left-0 top-16" : "relative"
          )}
        >
          {/* Sticky Table of Contents header */}
          <h2 className="text-lg font-semibold text-white p-4 bg-gray-800 sticky top-0 z-10 border-b border-gray-700">
            Table of Contents
          </h2>

          <div ref={sidebarRef} className={sidebarStyles}>
            {/* Chapter Selection */}
            <div className="space-y-2">
              {book.chapters.map((chapter, chapterIndex) => (
                <div key={chapterIndex} className="text-gray-300">
                  <button
                    className={clsx(
                      "w-full flex items-center justify-between p-2 mt-4 rounded hover:bg-gray-700 transition-colors",
                      currentChapter === chapterIndex ? "bg-gray-700" : ""
                    )}
                    onClick={() => setCurrentChapter(chapterIndex)}
                  >
                    <span className="text-sm font-medium">
                      Chapter {chapterIndex + 1}: {chapter.title}
                    </span>
                    {currentChapter === chapterIndex ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {/* Section list - only show for current chapter */}
                  {currentChapter === chapterIndex && (
                    <div className="mt-2 space-y-1">
                      {pages.map((page, pageIndex) => (
                        <div
                          key={pageIndex}
                          data-page-section={pageIndex + 1}
                          className="relative"
                        >
                          {/* Add page number indicator */}
                          <div className="px-2 py-1">
                            <span className="text-sm text-gray-500">
                              Page {pageIndex + 1}
                            </span>
                          </div>

                          {readingDepth === "original" ? (
                            <button
                              onClick={() => scrollToPage(pageIndex + 1)}
                              className={clsx(
                                "w-full text-left p-2 text-sm",
                                "hover:bg-gray-700 transition-colors",
                                visiblePages.includes(pageIndex + 1)
                                  ? "bg-gray-700 text-blue-400"
                                  : "text-gray-400"
                              )}
                            >
                              {`Content`}
                            </button>
                          ) : (
                            // Show all paragraph titles with better alignment
                            page.paragraphs?.map(
                              (paragraph, paragraphIndex) => (
                                <button
                                  key={`${pageIndex}-${paragraphIndex}`}
                                  onClick={() => scrollToPage(pageIndex + 1)}
                                  className={clsx(
                                    "w-full text-left p-2 text-sm",
                                    "hover:bg-gray-700 transition-colors",
                                    visiblePages.includes(pageIndex + 1)
                                      ? "bg-gray-700 text-blue-400"
                                      : "text-gray-400"
                                  )}
                                >
                                  {paragraph.title}
                                </button>
                              )
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Resize handle */}
            <div
              onMouseDown={startResizing}
              className={clsx(
                "absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500",
                isResizing ? "bg-blue-500" : "bg-gray-700"
              )}
            />
          </div>
        </div>
      )}

      {/* Main Content - adjust padding when sidebar is open on mobile */}
      <div
        className={clsx(
          "flex-1 flex flex-col h-[calc(100vh-64px)]",
          isMobile && isSidebarOpen && "opacity-50"
        )}
      >
        {/* Top Bar */}
        <div className="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-10 w-full">
          <div className="flex items-center justify-between max-w-full">
            <div className="flex items-center gap-4 min-w-0">
              <div className="text-white overflow-hidden">
                <h2
                  className="text-lg font-semibold truncate max-w-[150px] sm:max-w-[300px]"
                  title={book.title}
                >
                  {book.title}
                </h2>
                <div className="text-sm text-gray-400">
                  Page {visiblePages.join(", ")} of {totalPages}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-6">
              {/* Time saved stats - only show on larger screens */}
              {!isMobile && readingDepth !== "original" && (
                <div className="hidden lg:flex items-center text-sm">
                  <div className="flex items-center px-3 py-1.5 bg-yellow-500/10 rounded-lg">
                    <Sparkles className="w-4 h-4 mr-1.5 text-yellow-500" />
                    <span className="font-medium text-yellow-500">
                      {pages
                        .slice(0, Math.max(...visiblePages))
                        .reduce((acc, page) => {
                          const metrics = calculateCompressionMetrics(page);
                          return acc + (metrics?.timeSaved || 0);
                        }, 0)
                        .toFixed(1)}{" "}
                      min
                    </span>
                  </div>
                </div>
              )}

              {/* Always show depth control */}
              <DepthControl
                currentDepth={readingDepth}
                onChange={setReadingDepth}
              />

              {/* Show other controls in dropdown on mobile, directly on desktop */}
              {isMobile ? (
                <MobileMenu
                  showStats={showStats}
                  setShowStats={setShowStats}
                  showInsights={showInsights}
                  setShowInsights={setShowInsights}
                  fontSize={fontSize}
                  fontFamily={fontFamily}
                  onFontSizeChange={setFontSize}
                  onFontFamilyChange={setFontFamily}
                />
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* Slim Progress Bar */}
          <div className="h-1 bg-gray-700 mt-4 rounded-full relative">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{
                width: `${(Math.max(...visiblePages) / totalPages) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Reading Content */}
        <div className="flex-1 flex overflow-hidden">
          <div ref={contentRef} className={scrollableContentStyles}>
            <div className="w-full max-w-3xl mx-auto space-y-8">
              {pages.map((page, pageIndex) => (
                <div
                  key={pageIndex}
                  ref={(el) =>
                    registerPageRef(pageIndex + 1, el as HTMLDivElement)
                  }
                  data-page={pageIndex + 1}
                  className="bg-gray-800 rounded-lg shadow-lg p-4 sm:p-8"
                >
                  {readingDepth === "original" ? (
                    <div className="pdf-container">
                      <Document
                        file={book.pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={console.error}
                        loading={
                          <div className="text-white">Loading PDF...</div>
                        }
                      >
                        {Array.from(new Array(numPages), (el, index) => (
                          <div
                            key={`page_${index + 1}`}
                            ref={(el) =>
                              registerPageRef(index + 1, el as HTMLDivElement)
                            }
                            data-page={index + 1}
                            className="mb-8"
                          >
                            <Page
                              pageNumber={index + 1}
                              className="pdf-page"
                              scale={1}
                              loading={
                                <div className="text-white">
                                  Loading page...
                                </div>
                              }
                            />
                          </div>
                        ))}
                      </Document>
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
                        originalContent={getOriginalContent(paragraph.pages)}
                        isShowingOriginal={
                          segmentViewStates[
                            `${currentChapter}-${pageIndex}-${pIndex}`
                          ] || false
                        }
                        onToggleView={() => {
                          setSegmentViewStates((prev) => ({
                            ...prev,
                            [`${currentChapter}-${pageIndex}-${pIndex}`]:
                              !prev[`${currentChapter}-${pageIndex}-${pIndex}`],
                          }));
                        }}
                      />
                    ))
                  )}

                  {/* Page Information Card */}
                  <div className="mt-6 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-gray-400">
                          <span className="text-lg font-medium">
                            Page{" "}
                            {readingDepth === "original"
                              ? pageIndex
                              : page.pageNumber}
                          </span>
                          {readingDepth === "original"
                            ? (() => {
                                const condensedPages =
                                  book.chapters[currentChapter].content
                                    .condensed;
                                const condensedPageNum =
                                  findCondensedPageForOriginal(
                                    pageIndex,
                                    condensedPages
                                  );

                                if (condensedPageNum !== null) {
                                  const condensedPage =
                                    condensedPages[condensedPageNum - 1];
                                  return (
                                    <div className="flex items-center mt-1 text-sm text-gray-500">
                                      <BookOpenCheck className="w-4 h-4 mr-1" />
                                      <span>
                                        Part of condensed page{" "}
                                        {condensedPageNum}
                                        {condensedPage.originalPageRange &&
                                          ` (with pages ${condensedPage.originalPageRange.start}-${condensedPage.originalPageRange.end})`}
                                      </span>
                                    </div>
                                  );
                                }
                                return null;
                              })()
                            : page.originalPageRange && (
                                <div className="flex items-center mt-1 text-sm text-gray-500">
                                  <BookOpenCheck className="w-4 h-4 mr-1" />
                                  <span>
                                    Original pages{" "}
                                    {page.originalPageRange.start}-
                                    {page.originalPageRange.end}
                                  </span>
                                </div>
                              )}
                        </div>
                      </div>

                      {readingDepth === "original" ? (
                        (() => {
                          const condensedPages =
                            book.chapters[currentChapter].content.condensed;
                          const condensedPageNum = findCondensedPageForOriginal(
                            pageIndex,
                            condensedPages
                          );

                          if (condensedPageNum !== null) {
                            return (
                              <button
                                onClick={() =>
                                  navigateToCondensedView(condensedPageNum)
                                }
                                className="flex items-center px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-md hover:bg-blue-500/20 transition-colors"
                              >
                                <Sparkles className="w-4 h-4 mr-1.5" />
                                View Condensed
                              </button>
                            );
                          }
                          return null;
                        })()
                      ) : (
                        <div className="flex items-center space-x-6">
                          {(() => {
                            const metrics = calculateCompressionMetrics(page);
                            if (!metrics) return null;

                            return (
                              <>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-blue-400">
                                    {metrics.compressionMultiplier.toFixed(1)}x
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Compressed
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-green-400">
                                    {metrics.timeSaved.toFixed(1)}min
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Time Saved
                                  </div>
                                </div>
                                <div className="hidden sm:block text-left border-l border-gray-700 pl-6">
                                  <div className="flex items-center text-sm text-gray-400">
                                    <Sparkles className="w-4 h-4 mr-1 text-yellow-500" />
                                    <span>
                                      Original: {metrics.originalWords} words
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm text-gray-400 mt-1">
                                    <Sparkles className="w-4 h-4 mr-1 text-blue-500" />
                                    <span>
                                      Condensed: {metrics.condensedWords} words
                                    </span>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
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
              paragraphs={pages.flatMap((p) => p.paragraphs || [])}
              onClose={() => setShowInsights(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}