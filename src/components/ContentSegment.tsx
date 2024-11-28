'use client';

import React from 'react';
import clsx from 'clsx';

interface ContentSegmentProps {
  title?: string;
  content: string;
  pages?: number[];
  isActive?: boolean;
  fontSize?: string;
  fontFamily?: string;
  originalContent?: string[];
  isShowingOriginal?: boolean;
  onToggleView?: () => void;
  isPageIndicator?: boolean;
  pageNumber?: number;
  isPartOfCondensed?: boolean;
  onNavigateToCondensed?: () => void;
  condensedPageRange?: string;
  chapterNumber?: number;
}

export default function ContentSegment({
  title,
  content,
  pages,
  isActive,
  fontSize,
  fontFamily,
  originalContent,
  isShowingOriginal,
  onToggleView,
  isPageIndicator,
  pageNumber,
  isPartOfCondensed,
  onNavigateToCondensed,
  condensedPageRange,
  chapterNumber,
}: ContentSegmentProps) {
  if (isPageIndicator) {
    return (
      <div className="relative px-6 py-4 my-4 rounded-lg transition-all duration-200 bg-gray-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Page {pageNumber}</span>
            {isPartOfCondensed && (
              <button
                onClick={onNavigateToCondensed}
                className="flex items-center gap-1 group"
              >
                <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 flex items-center gap-1 group-hover:bg-blue-500/30">
                  Chapter {chapterNumber} • Pages {condensedPageRange}
                  <SwitchIcon className="w-4 h-4" />
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-6 py-4 sm:py-8 my-4 sm:my-8 first:mt-0 rounded-lg transition-all duration-200 hover:bg-gray-900/20">
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-lg bg-blue-500/30" />

      <header className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          {title && (
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-gray-300">
              {title}
            </h2>
          )}
          {pages && (
            <div className="flex items-center gap-2 mt-2">
              <div className="text-xs sm:text-sm text-gray-500">
                From Original Pages {pages.join(", ")}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 self-end sm:self-auto">
          {originalContent && onToggleView && (
            <button
              onClick={onToggleView}
              className={clsx(
                "p-1.5 sm:p-2 rounded-full",
                isShowingOriginal
                  ? "text-blue-400 bg-blue-500/10 hover:bg-blue-500/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              )}
              title={isShowingOriginal ? "Show Summary" : "Show Original"}
            >
              <SwitchIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
          <button className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-800">
            <BookmarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-800">
            <HighlightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      <div
        className={clsx(
          "prose prose-invert max-w-none",
          "leading-relaxed whitespace-pre-wrap text-gray-300",
          fontSize,
          {
            "font-serif": fontFamily === "serif",
            "font-mono": fontFamily === "mono",
            "font-sans": fontFamily === "inter",
          }
        )}
      >
        {isShowingOriginal ? originalContent?.join("\n\n") : content}
      </div>
    </div>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function HighlightIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function SwitchIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );
}