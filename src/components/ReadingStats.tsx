'use client';

import React from 'react';
import { X, Flame, BookOpen, BookmarkPlus, MessageSquare, Trophy } from 'lucide-react';

interface ReadingStatsProps {
  readingStreak: number;
  pagesRead: number;
  totalPages: number;
  bookmarks: number;
  notes: number;
  onClose: () => void;
}

export default function ReadingStats({
  readingStreak,
  pagesRead,
  totalPages,
  bookmarks,
  notes,
  onClose
}: ReadingStatsProps) {
  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Reading Stats</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Reading Streak */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-white font-medium">Reading Streak</span>
          </div>
          <div className="text-2xl font-bold text-white">{readingStreak} days</div>
        </div>

        {/* Progress */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <span className="text-white font-medium">Progress</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {Math.round((pagesRead / totalPages) * 100)}%
          </div>
          <div className="text-sm text-gray-400">
            {pagesRead} of {totalPages} pages
          </div>
        </div>

        {/* Engagement */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="text-white font-medium">Engagement</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 text-gray-400">
                <BookmarkPlus className="w-4 h-4" />
                <span>Bookmarks</span>
              </div>
              <div className="text-xl font-bold text-white">{bookmarks}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-400">
                <MessageSquare className="w-4 h-4" />
                <span>Notes</span>
              </div>
              <div className="text-xl font-bold text-white">{notes}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}