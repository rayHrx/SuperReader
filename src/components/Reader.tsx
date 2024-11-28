'use client';

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
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
  Loader2,
  ArrowRight,
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
import {
  ContentSectionResponse,
  DistilledContentResponse,
} from "@/app/cache/Interfaces";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

interface ReaderProps {
  book: Book;
}

interface ViewSwitchProps {
  currentView: ReadingDepth;
  onViewChange: (view: ReadingDepth) => void;
}

function ViewSwitch({ currentView, onViewChange }: ViewSwitchProps) {
  return (
    <div className="flex items-center gap-2 bg-gray-700 p-1 rounded-lg">
      <button
        onClick={() => onViewChange("original")}
        className={clsx(
          "px-3 py-1.5 rounded text-sm font-medium transition-colors",
          currentView === "original"
            ? "bg-blue-500 text-white"
            : "text-gray-300 hover:bg-gray-600"
        )}
      >
        Original
      </button>
      <button
        onClick={() => onViewChange("condensed")}
        className={clsx(
          "px-3 py-1.5 rounded text-sm font-medium transition-colors",
          currentView === "condensed"
            ? "bg-blue-500 text-white"
            : "text-gray-300 hover:bg-gray-600"
        )}
      >
        Condensed
      </button>
    </div>
  );
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

interface ChapterDistilledContent {
  [chapterId: string]: {
    content?: DistilledContentResponse;
    isLoading: boolean;
    error?: string;
  };
}

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

  const [currentView, setCurrentView] = useState<ReadingDepth>("condensed");

  const [distilledContent, setDistilledContent] =
    useState<ChapterDistilledContent>({});
  const api = useMemo(() => new APIs(), []);

  const scrollToPage = useCallback((pageNumber: number) => {
    const pageElement = document.querySelector(`[data-page="${pageNumber}"]`);
    if (pageElement) {
      pageElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  const [pdfOutline, setPdfOutline] = useState<JSX.Element | null>(null);

  const [lastClickedParagraphId, setLastClickedParagraphId] = useState<
    string | null
  >(null);

  const [activeChapterId, setActiveChapterId] = useState<number | null>(null);
  const [activePdfPage, setActivePdfPage] = useState<number | null>(null);

  const [visibleChapterIds, setVisibleChapterIds] = useState<string[]>([]);

  const [visibleContentSegments, setVisibleContentSegments] = useState<
    number[]
  >([]);

  const [lastKnownPage, setLastKnownPage] = useState(1);

  const renderSidebarContent = () => {
    const getPdfOutline = () => {
      if (!pdfOutline) {
        setPdfOutline(
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
                "[&>ul>li>a]:hover:bg-gray-700"
              )}
              onItemClick={({ pageNumber }) => {
                setVisiblePages([pageNumber]);
                setActivePdfPage(pageNumber);
                setTimeout(() => {
                  scrollToPage(pageNumber);
                }, 0);
              }}
            />
          </Document>
        );
      }
      return pdfOutline;
    };

    return (
      <>
        <div className={currentView === "original" ? "block" : "hidden"}>
          {getPdfOutline()}
        </div>

        <div className={currentView === "condensed" ? "block" : "hidden"}>
          <div className="space-y-4">
            {book.chapters.map((chapter, index) => (
              <div key={chapter.id} className="px-4">
                <button
                  onClick={() => {
                    setActiveChapterId(chapter.id);
                    const chapterElement = document.querySelector(
                      `[data-chapter="${chapter.id}"]`
                    );
                    if (chapterElement) {
                      chapterElement.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }
                  }}
                  className={clsx(
                    "text-left w-full p-2 rounded hover:bg-gray-700 transition-colors",
                    visibleChapterIds.includes(String(chapter.id))
                      ? "bg-blue-600 text-white"
                      : "text-gray-300"
                  )}
                >
                  <span className="text-sm font-medium">{chapter.title}</span>
                  <div className="text-xs text-gray-400 mt-1">
                    Source: Pages {Math.min(...chapter.content.original)} -{" "}
                    {Math.max(...chapter.content.original)}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  const [isPdfLoaded, setIsPdfLoaded] = useState(false);

  const renderContent = () => {
    return (
      <div className="w-full">
        {/* Original PDF view - always rendered but conditionally hidden */}
        <div
          className={clsx(
            "w-full relative",
            currentView === "original" ? "block" : "hidden"
          )}
          ref={contentContainerRef}
        >
          <Document
            file={book.pdfUrl}
            onLoadSuccess={(pdf) => {
              onDocumentLoadSuccess(pdf);
              setIsPdfLoaded(true);
            }}
            onLoadError={(error) =>
              console.error("Error loading document:", error)
            }
            className="flex flex-col items-center"
            loading={
              <div className="flex items-center justify-center w-full h-64">
                <div className="text-white bg-gray-800 rounded-lg p-4">
                  Loading PDF...
                </div>
              </div>
            }
            error={
              <div className="flex items-center justify-center w-full h-64">
                <div className="text-red-500 bg-gray-800 rounded-lg p-4">
                  Error loading PDF. Please try again.
                </div>
              </div>
            }
          >
            {Array.from(new Array(numPages), (_, index) => (
              <div
                key={`page_${index + 1}`}
                data-page={index + 1}
                className="mb-4"
              >
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  width={Math.min(800, window.innerWidth - 48)}
                  className="pdf-page"
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  loading={
                    <div className="w-full h-[800px] bg-gray-800 rounded-lg flex items-center justify-center">
                      <div className="text-white">
                        Loading page {index + 1}...
                      </div>
                    </div>
                  }
                  error={
                    <div className="text-red-500 text-center py-4">
                      Error loading page {index + 1}
                    </div>
                  }
                />
                <div className="content-segment" data-page-number={index + 1}>
                  <ContentSegment
                    isPageIndicator
                    pageNumber={index + 1}
                    content=""
                    fontSize={fontSize}
                    fontFamily={fontFamily}
                  />
                </div>
              </div>
            ))}
          </Document>
        </div>

        {/* Condensed view - always rendered but conditionally hidden */}
        <div
          className={clsx(
            "max-w-4xl mx-auto",
            currentView === "condensed" ? "block" : "hidden"
          )}
        >
          {book.chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              className={clsx(
                "mb-6 p-6 bg-gray-800 rounded-lg shadow-lg",
                visibleChapterIds.includes(String(chapter.id)) &&
                  "ring-2 ring-blue-500",
                "transition-all duration-200"
              )}
              data-page={chapter.content.condensed}
              data-chapter={String(chapter.id)}
            >
              <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                {chapter.title}
                {visibleChapterIds.includes(String(chapter.id)) && (
                  <ArrowRight className="w-5 h-5 text-blue-500 animate-pulse" />
                )}
              </h3>

              {!distilledContent[chapter.id]?.content && (
                <button
                  onClick={() => fetchDistilledContent(chapter)}
                  disabled={distilledContent[chapter.id]?.isLoading}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded",
                    "bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400",
                    "text-white text-sm font-medium transition-colors"
                  )}
                >
                  {distilledContent[chapter.id]?.isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load Distilled Content"
                  )}
                </button>
              )}

              {distilledContent[chapter.id]?.error && (
                <div className="text-red-400 text-sm mt-2">
                  {distilledContent[chapter.id].error}
                </div>
              )}

              {distilledContent[chapter.id]?.content && (
                <div className="mt-4 p-4 bg-gray-700 rounded">
                  <div className="prose prose-invert max-w-none space-y-6">
                    {distilledContent[
                      chapter.id
                    ]?.content?.distilled_page.paragraphs.map(
                      (paragraph, index) => {
                        const paragraphId = `${chapter.id}-paragraph-${index}`;

                        return (
                          <div
                            key={index}
                            id={paragraphId}
                            onClick={() => {
                              setLastClickedParagraphId(paragraphId);
                              setCurrentView("original");
                              const startPage = paragraph.pages[0];
                              setTimeout(() => {
                                scrollToPage(startPage);
                              }, 100);
                            }}
                            className={clsx(
                              "relative cursor-pointer hover:bg-gray-600/30 transition-colors p-2 rounded",
                              paragraph.type === "core" &&
                                "pl-4 border-l-2 border-blue-500",
                              paragraph.type === "transition" &&
                                "pr-4 border-r-2 border-emerald-500/50 italic text-right"
                            )}
                          >
                            <div
                              className={clsx(
                                "transition-colors",
                                paragraph.type === "core" && "text-gray-100",
                                paragraph.type === "transition" &&
                                  "text-gray-400"
                              )}
                            >
                              {paragraph.content}
                            </div>

                            {paragraph.type === "core" &&
                              paragraph.pages.length > 0 && (
                                <div className="mt-2 text-xs text-gray-500">
                                  Source: Page
                                  {paragraph.pages.length > 1 ? "s" : ""}{" "}
                                  {paragraph.pages.join(", ")}
                                </div>
                              )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
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

  const fetchDistilledContent = async (chapter: Book["chapters"][0]) => {
    const startPage = Math.min(...chapter.content.original);
    const endPage = Math.max(...chapter.content.original);

    await api.initialize();

    // Set loading state
    setDistilledContent((prev) => ({
      ...prev,
      [chapter.id]: { isLoading: true },
    }));

    try {
      const content = await api.getDistilledContent(
        book.id,
        startPage,
        endPage
      );
      setDistilledContent((prev) => ({
        ...prev,
        [chapter.id]: { content, isLoading: false },
      }));
    } catch (error) {
      console.error("Error fetching distilled content:", error);
      setDistilledContent((prev) => ({
        ...prev,
        [chapter.id]: {
          isLoading: false,
          error: "Failed to load distilled content. Please try again.",
        },
      }));
    }
  };

  const lastPageNumber = useMemo(() => {
    if (!book.chapters.length) return 0;
    const lastChapter = book.chapters[book.chapters.length - 1];
    return Math.min(...lastChapter.content.original);
  }, [book.chapters]);

  useEffect(() => {
    if (currentView === "condensed" && lastClickedParagraphId) {
      setTimeout(() => {
        const element = document.getElementById(lastClickedParagraphId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, [currentView, lastClickedParagraphId]);

  useEffect(() => {
    if (visiblePages.length > 0 && currentView === "condensed") {
      const currentPage = Math.min(...visiblePages);
      const activeChapter = book.chapters.find((chapter) => {
        const chapterPages = chapter.content.original;
        return (
          currentPage >= Math.min(...chapterPages) &&
          currentPage <= Math.max(...chapterPages)
        );
      });

      if (activeChapter) {
        setActiveChapterId(activeChapter.id);
      }
    }
  }, [visiblePages, currentView, book.chapters]);

  useEffect(() => {
    if (visiblePages.length > 0 && currentView === "original") {
      setActivePdfPage(Math.min(...visiblePages));
    }
  }, [visiblePages, currentView]);

  useEffect(() => {
    if (currentView !== "condensed") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const chapterId = entry.target.getAttribute("data-chapter");

          if (chapterId) {
            setVisibleChapterIds((prev) => {
              if (entry.isIntersecting) {
                // Add chapter ID if not already present
                return prev.includes(chapterId) ? prev : [...prev, chapterId];
              } else {
                // Remove chapter ID when no longer visible
                return prev.filter((id) => id !== chapterId);
              }
            });
          }
        });
      },
      {
        root: contentRef.current,
        threshold: 0.3,
        rootMargin: "-10% 0px -10% 0px", // Adjusted to be more balanced
      }
    );

    const chapterElements = document.querySelectorAll("[data-chapter]");
    chapterElements.forEach((element) => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [currentView]);

  const getLastVisibleChapterEndPage = useCallback(() => {
    if (visibleChapterIds.length === 0) return 1;

    // Get all visible chapters
    const visibleChapters = book.chapters.filter((chapter) =>
      visibleChapterIds.includes(String(chapter.id))
    );

    if (visibleChapters.length === 0) return 1;

    // Get the last visible chapter
    const lastVisibleChapter = visibleChapters[visibleChapters.length - 1];
    // Return the highest page number from that chapter
    return Math.max(...lastVisibleChapter.content.original);
  }, [visibleChapterIds, book.chapters]);

  useEffect(() => {
    // Skip if not in condensed view
    if (currentView !== "condensed") return;

    // For each visible chapter ID, check if we need to fetch content
    visibleChapterIds.forEach(async (chapterId) => {
      const numericChapterId = parseInt(chapterId);

      // Skip if already loading or if content exists
      if (
        distilledContent[numericChapterId]?.isLoading ||
        distilledContent[numericChapterId]?.content
      ) {
        return;
      }

      // Find the chapter data
      const chapter = book.chapters.find((ch) => ch.id === numericChapterId);
      if (chapter) {
        // Fetch content for this chapter
        await fetchDistilledContent(chapter);
      }
    });
  }, [visibleChapterIds, currentView, distilledContent, book.chapters]); // Add fetchDistilledContent to deps if needed

  useEffect(() => {
    if (currentView !== "original") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const segmentElement = entry.target as HTMLElement;
          const pageNumber = parseInt(
            segmentElement.getAttribute("data-page-number") || "0"
          );

          if (entry.isIntersecting) {
            setVisibleContentSegments((prev) =>
              prev.includes(pageNumber)
                ? prev
                : [...prev, pageNumber].sort((a, b) => a - b)
            );
            setLastKnownPage(pageNumber);
          } else {
            setVisibleContentSegments((prev) =>
              prev.filter((p) => p !== pageNumber)
            );
          }
        });
      },
      {
        root: contentRef.current,
        threshold: 0.5,
        rootMargin: "-10% 0px -10% 0px",
      }
    );

    const segments = document.querySelectorAll(".content-segment");
    segments.forEach((segment) => observer.observe(segment));

    return () => observer.disconnect();
  }, [currentView]);

  const getProgressPercentage = () => {
    const totalPages = Math.max(
      ...book.chapters[book.chapters.length - 1].content.original
    );

    if (currentView === "original") {
      const currentPage = visibleContentSegments.length
        ? Math.max(...visibleContentSegments)
        : lastKnownPage;
      return (currentPage / totalPages) * 100;
    } else {
      // Condensed view progress calculation
      const lastVisibleChapterEndPage = getLastVisibleChapterEndPage();
      return (lastVisibleChapterEndPage / totalPages) * 100;
    }
  };

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
                  {currentView === "original"
                    ? `Page ${
                        visibleContentSegments.length
                          ? Math.max(...visibleContentSegments)
                          : lastKnownPage
                      } of ${lastPageNumber}`
                    : `Page ${
                        visibleChapterIds.length
                          ? Math.max(
                              ...(book.chapters.find(
                                (ch) =>
                                  ch.id ===
                                  parseInt(
                                    visibleChapterIds[
                                      visibleChapterIds.length - 1
                                    ]
                                  )
                              )?.content.original || [1])
                            )
                          : 1
                      } of ${lastPageNumber}`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ViewSwitch
                currentView={currentView}
                onViewChange={setCurrentView}
              />
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
                width: `${getProgressPercentage()}%`,
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