'use client';

import React from 'react';
import { ReadingDepth } from '@/types';
import { BookOpen, BookCopy } from 'lucide-react';
import clsx from 'clsx';

interface DepthControlProps {
  currentDepth: ReadingDepth;
  onChange: (depth: ReadingDepth) => void;
}

export default function DepthControl({ currentDepth, onChange }: DepthControlProps) {
  const depths: Array<{
    value: ReadingDepth;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      value: 'original',
      label: 'Original',
      icon: <BookOpen className="w-4 h-4" />
    },
    {
      value: 'condensed',
      label: 'Condensed',
      icon: <BookCopy className="w-4 h-4" />
    }
  ];

  return (
    <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg p-1">
      {depths.map(({ value, label, icon }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            currentDepth === value
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-300 hover:bg-gray-600'
          )}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}