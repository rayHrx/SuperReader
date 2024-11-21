'use client';

import React from 'react';
import { Info } from 'lucide-react';
import clsx from 'clsx';
import { RevertPageMapping } from '@/types';

interface MappingLegendProps {
  mappings: RevertPageMapping[];
  colors: string[];
  hoveredMapping: number | null;
  onHover: (index: number | null) => void;
}

export default function MappingLegend({
  mappings,
  colors,
  hoveredMapping,
  onHover
}: MappingLegendProps) {
  return (
    <div className="mt-6 border-t border-gray-700 pt-4">
      <div className="flex items-center gap-2 mb-4">
        <Info className="w-4 h-4 text-gray-400" />
        <h4 className="text-sm font-medium text-gray-400">Page Mapping Legend</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {mappings.map((mapping, idx) => (
          <div
            key={idx}
            className={clsx(
              'bg-gray-700/50 rounded-lg p-3 transition-colors duration-200',
              hoveredMapping === idx && 'bg-gray-700'
            )}
            onMouseEnter={() => onHover(idx)}
            onMouseLeave={() => onHover(null)}
          >
            <div className="flex items-center gap-2">
              <div className={clsx(
                'w-3 h-3 rounded-sm transition-transform duration-200',
                colors[idx].replace('border', 'bg'),
                hoveredMapping === idx && 'scale-110'
              )} />
              <span className="text-sm text-gray-300">
                Original pages: {mapping.pages.join(', ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}