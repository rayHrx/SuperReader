'use client';

import React from 'react';
import Link from 'next/link';
import { Book } from '@/types';
import { Clock, BookOpenCheck, BookOpen, Flame, Trophy, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

interface HomeProps {
  initialBook: Book;
}

export default function Home({ initialBook }: HomeProps) {
  const book = initialBook;
  const stats = {
    booksRead: 12,
    readingStreak: 7,
    totalReadingTime: '32h 15m',
    comprehensionScore: 92,
    lastCheckIn: new Date(),
  };

  // Get last 7 days for check-in display
  const getDayName = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short' });
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date,
      dayName: getDayName(date),
      isCheckedIn: i < stats.readingStreak
    };
  }).reverse();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
          <BookOpenCheck className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
      </div>

      {/* Reading Streak with Check-ins */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Reading Streak</h3>
              <p className="text-gray-400">Keep reading daily to maintain your streak!</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{stats.readingStreak} days</div>
        </div>

        {/* Daily Check-in Calendar */}
        <div className="grid grid-cols-7 gap-2">
          {last7Days.map((day, index) => (
            <div
              key={index}
              className={clsx(
                'flex flex-col items-center p-3 rounded-lg',
                day.isCheckedIn ? 'bg-orange-500/20' : 'bg-gray-700/50'
              )}
            >
              <span className="text-sm text-gray-400 mb-2">{day.dayName}</span>
              <CheckCircle2 
                className={clsx(
                  'w-6 h-6',
                  day.isCheckedIn ? 'text-orange-500' : 'text-gray-600'
                )}
              />
            </div>
          ))}
        </div>

        {/* Today's Status */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Today's Progress</span>
            <span className="text-orange-500">
              {last7Days[last7Days.length - 1].isCheckedIn ? 'Completed' : 'In Progress'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Books Read */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Books Read</h3>
              <p className="text-gray-400">This year</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{stats.booksRead} books</div>
        </div>

        {/* Reading Time */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Total Reading Time</h3>
              <p className="text-gray-400">This month</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalReadingTime}</div>
        </div>

        {/* Comprehension Score */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Comprehension</h3>
              <p className="text-gray-400">Based on insights</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{stats.comprehensionScore}%</div>
        </div>
      </div>

      {/* Current Book */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Continue Reading</h2>
        <div className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all">
          <div className="relative h-48">
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
            
            {/* Reading Progress */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: '35%' }}
                />
              </div>
              <div className="flex justify-between items-center text-sm text-gray-300">
                <span>Chapter {book.chapters[0]?.id || 1}</span>
                <span>35% Complete</span>
              </div>
            </div>
          </div>

          <div className="p-4">
            <h3 className="text-lg font-semibold text-white mb-1">
              {book.title}
            </h3>
            <p className="text-gray-400 text-sm mb-3">{book.author}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Last read 2 days ago</span>
              </div>
              <Link
                href={`/read/${book.id}`}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>Resume</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}