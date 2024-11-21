'use client';

import React from 'react';
import clsx from 'clsx';

interface ContentSegmentProps {
  title: string;
  content: string;
  pages: number[];
  isActive: boolean;
  fontSize: string;
  fontFamily: string;
}

export default function ContentSegment({
  title,
  content,
  pages,
  isActive,
  fontSize,
  fontFamily
}: ContentSegmentProps) {
  return (
    <div className="relative pl-4 my-6 first:mt-0">
      <div
        className={clsx(
          'absolute left-0 top-0 bottom-0 border-l-4 transition-colors',
          isActive ? 'border-blue-500' : 'border-blue-500/50'
        )}
      />
      <div className="mb-3">
        <h4 className="text-base font-medium text-gray-400">{title}</h4>
        <div className="text-xs text-gray-500 mt-1">
          Original pages: {pages.join(', ')}
        </div>
      </div>
      <div className={clsx(
        'text-gray-300 leading-relaxed whitespace-pre-wrap',
        fontSize,
        {
          'font-serif': fontFamily === 'serif',
          'font-mono': fontFamily === 'mono',
          'font-sans': fontFamily === 'inter'
        }
      )}>
        {content}
      </div>
    </div>
  );
}