'use client';

import React from 'react';
import { X, Lightbulb } from 'lucide-react';
import { Paragraph } from '@/types';

interface KeyInsightsProps {
  paragraphs: Paragraph[];
  onClose: () => void;
}

export default function KeyInsights({ paragraphs, onClose }: KeyInsightsProps) {
  // Extract key insights from paragraphs
  const insights = paragraphs.map(p => ({
    title: p.title,
    summary: p.content.split('.')[0] // Take first sentence as summary
  }));

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Key Insights</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-medium mb-1">{insight.title}</h4>
                <p className="text-sm text-gray-300">{insight.summary}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}