'use client';

import React, { useState } from 'react';
import { Type, ChevronDown, Minus, Plus } from 'lucide-react';
import clsx from 'clsx';

interface TextSettingsProps {
  fontSize: string;
  fontFamily: string;
  onFontSizeChange: (size: string) => void;
  onFontFamilyChange: (font: string) => void;
}

export default function TextSettings({
  fontSize,
  fontFamily,
  onFontSizeChange,
  onFontFamilyChange
}: TextSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const fonts = [
    { value: 'inter', label: 'Inter' },
    { value: 'serif', label: 'Serif' },
    { value: 'mono', label: 'Mono' }
  ];

  const fontSizes = ['text-sm', 'text-base', 'text-lg', 'text-xl'];
  const currentSizeIndex = fontSizes.indexOf(fontSize);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-gray-300 hover:bg-gray-700/50 transition-colors"
      >
        <Type className="w-4 h-4" />
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 rounded-lg shadow-lg p-4 z-50">
            {/* Font Size Control */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Text Size
              </label>
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => currentSizeIndex > 0 && onFontSizeChange(fontSizes[currentSizeIndex - 1])}
                  disabled={currentSizeIndex === 0}
                  className="p-1 text-gray-400 hover:text-white disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 h-1 bg-gray-700 rounded-full">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${((currentSizeIndex + 1) / fontSizes.length) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => currentSizeIndex < fontSizes.length - 1 && onFontSizeChange(fontSizes[currentSizeIndex + 1])}
                  disabled={currentSizeIndex === fontSizes.length - 1}
                  className="p-1 text-gray-400 hover:text-white disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Font Family Control */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Font Family
              </label>
              <div className="space-y-1">
                {fonts.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => {
                      onFontFamilyChange(font.value);
                      setIsOpen(false);
                    }}
                    className={clsx(
                      'w-full px-3 py-2 rounded-md text-sm text-left transition-colors',
                      fontFamily === font.value
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    )}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}