import React from 'react';
import { ReadingDepth } from '../types';
import { BookOpen, BookCopy, Zap } from 'lucide-react';
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
    description: string;
  }> = [
    {
      value: 'condensed',
      label: 'Condensed',
      icon: <BookCopy className="w-5 h-5" />,
      description: 'Core ideas with key examples'
    },
    {
      value: 'quick',
      label: 'Quick Read',
      icon: <Zap className="w-5 h-5" />,
      description: 'Essential concepts only'
    },
    {
      value: 'original',
      label: 'Original',
      icon: <BookOpen className="w-5 h-5" />,
      description: 'Full original content'
    }
  ];

  return (
    <div className="fixed top-4 right-4 bg-gray-800 rounded-lg shadow-lg p-2 z-50">
      <div className="space-y-2">
        {depths.map(({ value, label, icon, description }) => (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all',
              currentDepth === value
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            )}
          >
            {icon}
            <div className="text-left">
              <div className="font-medium">{label}</div>
              <div className="text-xs opacity-75">{description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}