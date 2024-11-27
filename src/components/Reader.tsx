'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Book, ReadingDepth, PageMapping } from "@/types";
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
import DepthControl from "./DepthControl";
import TextSettings from "./TextSettings";
import ContentSegment from "./ContentSegment";
import ReadingStats from "./ReadingStats";
import KeyInsights from "./KeyInsights";
import clsx from "clsx";
import { useState as useReactState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { Outline } from "react-pdf";
import { APIs } from "@/app/cache/APIs";
import { ContentSectionResponse } from "@/app/cache/Interfaces";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface ReaderProps {
  book: Book;
}

const MIN_SIDEBAR_WIDTH = 250;
const MIN_CONTENT_WIDTH = 460;
const HIDE_SIDEBAR_THRESHOLD = 200;

const scrollableContentStyles =
  "flex-1 overflow-y-auto px-4 sm:px-8 py-8 bg-gray-900 scroll-smooth overscroll-none";
const sidebarStyles =
  "flex-1 overflow-y-auto p-4 pt-0 space-y-2 scroll-smooth overscroll-none scrollbar-hide";

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

// Update the ConnectionLine component
interface ConnectionLineProps {
  originalPages: number[];
  condensedPage: number;
  sectionIndex: number;
}

const ConnectionLine = ({
  originalPages,
  condensedPage,
  sectionIndex,
}: ConnectionLineProps) => {
  const colors = [
    "rgb(59, 130, 246)", // blue-500
    "rgb(16, 185, 129)", // green-500
    "rgb(239, 68, 68)", // red-500
    "rgb(168, 85, 247)", // purple-500
    "rgb(245, 158, 11)", // amber-500
  ];

  const color = colors[sectionIndex % colors.length];

  // Get the elements directly
  const firstPageEl = document.querySelector(
    `[data-page="${originalPages[0]}"]`
  );
  const lastPageEl = document.querySelector(
    `[data-page="${originalPages[originalPages.length - 1]}"]`
  );
  const containerEl = document.querySelector(".pdf-page")?.parentElement;

  if (!firstPageEl || !lastPageEl || !containerEl) return null;

  const containerRect = containerEl.getBoundingClientRect();
  const firstPageRect = firstPageEl.getBoundingClientRect();
  const lastPageRect = lastPageEl.getBoundingClientRect();

  const startY = firstPageRect.top - containerRect.top;
  const endY = lastPageRect.bottom - containerRect.top;

  return (
    <>
      {/* Vertical line next to original pages */}
      <div
        className="absolute w-1"
        style={{
          top: `${startY}px`,
          height: `${endY - startY}px`,
          left: "7%",
          backgroundColor: color,
        }}
      />

      {/* Horizontal connector line */}
      <div
        className="absolute h-1"
        style={{
          top: `${(startY + endY) / 2}px`,
          left: "7%",
          width: "100px",
          backgroundColor: color,
        }}
      />
    </>
  );
};

export default function Reader({ book }: ReaderProps) {
  const [visiblePages, setVisiblePages] = useState<number[]>([1]);
  const [fontSize, setFontSize] = useState("text-base");
  const [fontFamily, setFontFamily] = useState("inter");
  const [showStats, setShowStats] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [readingStats, setReadingStats] = useState({
    readingStreak: 5,
    pagesRead: 0,
    bookmarks: 0,
    notes: 0,
  });
  const [sidebarWidth, setSidebarWidth] = useReactState(256);
  const [isResizing, setIsResizing] = useReactState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [pdfPages, setPdfPages] = useState<JSX.Element[]>([]);
  const [currentSection, setCurrentSection] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const scrollToPage = useCallback((pageNumber: number) => {
    const pageElement = document.querySelector(`[data-page="${pageNumber}"]`);
    if (pageElement) {
      pageElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  const renderSidebarContent = () => {
    return (
      <Document
        file={book.pdfUrl}
        onLoadSuccess={(pdf) => {
          onDocumentLoadSuccess(pdf);
        }}
        loading={<div className="text-white">Loading outline...</div>}
      >
        <Outline
          className={clsx(
            "text-gray-300 space-y-2 p-2",
            "[&>ul]:space-y-2",
            "[&>ul>li]:text-sm",
            "[&>ul>li>a]:block",
            "[&>ul>li>a]:p-2",
            "[&>ul>li>a]:rounded",
            "[&>ul>li>a]:transition-colors",
            "[&>ul>li>a]:cursor-pointer",
            "[&>ul>li>a]:hover:bg-gray-700",
            "[&>ul>li>a.active]:bg-blue-600"
          )}
          onItemClick={({ pageNumber }) => {
            setVisiblePages([pageNumber]);
            setTimeout(() => {
              scrollToPage(pageNumber);
            }, 0);
          }}
        />
      </Document>
    );
  };

  const renderContent = () => {
    return (
      <div className="flex w-full">
        {/* PDF container - left half */}
        <div className="w-1/2 relative" ref={contentContainerRef}>
          <Document
            file={book.pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) =>
              console.error("Error loading document:", error)
            }
            className="flex flex-col items-center"
            loading={
              <div className="text-white text-center py-8">Loading PDF...</div>
            }
            error={
              <div className="text-red-500 text-center py-8">
                Error loading PDF!
              </div>
            }
          >
            {pdfPages.map((pdfPage, index) => {
              const pageNum = index + 1;
              return (
                <div key={index} data-page={pageNum} className="mb-4">
                  {pdfPage}
                  <ContentSegment
                    isPageIndicator
                    pageNumber={pageNum}
                    content=""
                    fontSize={fontSize}
                    fontFamily={fontFamily}
                  />
                </div>
              );
            })}
          </Document>
        </div>
        {/* Connection lines and condensed content - right half */}
        <div className="w-1/2 relative overflow-visible">
          {/* Connection lines container */}
          <div className="absolute inset-0">
            {book.chapters.map((chapter, index) => {
              return (
                <ConnectionLine
                  key={index}
                  originalPages={chapter.content.original}
                  condensedPage={chapter.content.condensed[0]}
                  sectionIndex={index}
                />
              );
            })}
          </div>

          {/* Condensed content */}
          <div className="relative h-full">{renderCondensedContent()}</div>
        </div>
      </div>
    );
  };

  const renderCondensedContent = () => {
    return (
      <div className="flex flex-col">
        {book.chapters.map((chapter, index) => {
          // Find the corresponding original pages element to match position
          const firstPageEl = document.querySelector(
            `[data-page="${chapter.content.original[0]}"]`
          );
          const lastPageEl = document.querySelector(
            `[data-page="${
              chapter.content.original[chapter.content.original.length - 1]
            }"]`
          );

          if (!firstPageEl || !lastPageEl) return null;

          const containerRect =
            contentContainerRef.current?.getBoundingClientRect();
          const firstPageRect = firstPageEl.getBoundingClientRect();
          const lastPageRect = lastPageEl.getBoundingClientRect();

          if (!containerRect) return null;

          // Calculate the vertical position to match the connection line
          const topPosition =
            (firstPageRect.top + lastPageRect.bottom) / 2 - containerRect.top;

          return (
            <div
              key={index}
              className="bg-gray-800 rounded-lg p-4 absolute left-32 -translate-y-1/2"
              style={{
                top: `${topPosition}px`,
                width: "calc(100% - 140px)", // Account for the left spacing
              }}
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                {chapter.title}
              </h3>
              <p className="text-gray-400 text-sm mb-2">
                Original Pages: {chapter.content.original.join(", ")}
                <br />
                Condensed Page: {chapter.content.condensed[0]}
              </p>
              <p className="text-gray-300">
                Condensed content for section {index + 1}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    const handleWindowResize = () => {
      if (window.innerWidth >= 768) {
        if (window.innerWidth > MIN_SIDEBAR_WIDTH + 400) {
          setIsSidebarOpen(true);
        }
      }
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  const onDocumentLoadSuccess = ({
    numPages: nextNumPages,
  }: {
    numPages: number;
  }) => {
    setNumPages(nextNumPages);
    setReadingStats((prev) => ({
      ...prev,
      totalPages: nextNumPages,
    }));
  };

  const startResizing = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = e.clientX;
        const windowWidth = window.innerWidth;
        const maxSidebarWidth = windowWidth - MIN_CONTENT_WIDTH;

        // Hide sidebar if dragged too narrow
        if (newWidth < HIDE_SIDEBAR_THRESHOLD) {
          setIsSidebarOpen(false);
          setIsResizing(false);
          return;
        }

        // Constrain width between min and max values
        if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= maxSidebarWidth) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

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

  useEffect(() => {
    const loadPdfPages = async () => {
      try {
        const pages = [];
        for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
          pages.push(
            <div key={pageNumber} className="pdf-page" data-page={pageNumber}>
              <Page
                pageNumber={pageNumber}
                width={Math.min(800, window.innerWidth - 48)}
                className="pdf-page"
                renderAnnotationLayer={false}
                renderTextLayer={false}
                scale={1}
                loading={
                  <div className="text-white text-center py-4">
                    Loading page {pageNumber}...
                  </div>
                }
                error={
                  <div className="text-red-500 text-center py-4">
                    Error loading page {pageNumber}!
                  </div>
                }
              />
            </div>
          );
        }
        setPdfPages(pages);
      } catch (error) {
        console.error("Error loading PDF pages:", error);
      }
    };

    if (numPages > 0) {
      loadPdfPages();
    }
  }, [numPages]);

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

    const pdfPageElements = document.querySelectorAll(".pdf-page");
    pdfPageElements.forEach((element) => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  // Update container height when content loads
  useEffect(() => {
    if (contentContainerRef.current) {
      setContainerHeight(contentContainerRef.current.clientHeight);
    }
  }, [pdfPages]);

  useEffect(() => {
    const updateConnections = () => {
      // Force a re-render of connection lines when pages are loaded
      setPdfPages([...pdfPages]);
    };

    const observer = new MutationObserver(updateConnections);

    if (contentContainerRef.current) {
      observer.observe(contentContainerRef.current, {
        childList: true,
        subtree: true,
      });
    }

    return () => observer.disconnect();
  }, [pdfPages]);

  return (
    <div className="flex bg-gray-900 overflow-hidden">
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={clsx(
          "fixed bottom-4 left-4 z-50 bg-gray-800 p-3 rounded-full shadow-lg text-white hover:bg-gray-700",
          isMobile ? "" : "bottom-8"
        )}
      >
        {isSidebarOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {isSidebarOpen && (
        <div
          style={{
            width: isMobile ? "100%" : sidebarWidth,
            maxWidth: `calc(100% - ${MIN_CONTENT_WIDTH}px)`,
          }}
          className={clsx(
            "bg-gray-800 border-r border-gray-700 flex flex-col h-[calc(100vh-64px)]",
            isMobile ? "fixed z-40 left-0 top-16" : "relative"
          )}
        >
          <h2 className="text-lg font-semibold text-white p-4 bg-gray-800 sticky top-0 z-10 border-b border-gray-700">
            Table of Contents
          </h2>

          <div ref={sidebarRef} className={sidebarStyles}>
            {renderSidebarContent()}
          </div>

          <div
            onMouseDown={startResizing}
            className={clsx(
              "absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500",
              isResizing ? "bg-blue-500" : "bg-gray-700"
            )}
          />
        </div>
      )}

      <div
        className={clsx(
          "flex-1 flex flex-col h-[calc(100vh-64px)]",
          isMobile && isSidebarOpen && "opacity-50"
        )}
      >
        <div className="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-10 w-full">
          <div className="flex items-center justify-between max-w-full">
            <div className="flex items-center gap-4 min-w-0">
              <div className="text-white overflow-hidden">
                <h2 className="text-lg font-semibold" title={book.title}>
                  {book.title}
                </h2>
                <div className="text-sm text-gray-400">
                  Page {visiblePages.join(", ")} of {numPages}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-6">
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
            </div>
          </div>

          <div className="h-1 bg-gray-700 mt-4 rounded-full relative">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{
                width: `${(Math.max(...visiblePages) / numPages) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div ref={contentRef} className={scrollableContentStyles}>
            <div className="w-full">{renderContent()}</div>
          </div>

          {showStats && (
            <ReadingStats
              readingStreak={readingStats.readingStreak}
              pagesRead={readingStats.pagesRead}
              totalPages={numPages}
              bookmarks={readingStats.bookmarks}
              notes={readingStats.notes}
              onClose={() => setShowStats(false)}
            />
          )}

          {showInsights && (
            <KeyInsights
              paragraphs={[]}
              onClose={() => setShowInsights(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}