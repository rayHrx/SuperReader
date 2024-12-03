'use client';

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Book } from "@/types";
import {
  Clock,
  BookOpenCheck,
  BookOpen,
  Flame,
  Trophy,
  CheckCircle2,
} from "lucide-react";
import clsx from "clsx";
import { useAPIs } from "@/app/cache/useAPIs";
import { CheckIn } from "@/app/cache/Interfaces";
import { APIs } from "@/app/cache/APIs";

interface HomeProps {
  initialBook: Book;
}

export default function Home({ initialBook }: HomeProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const { apis, isInitialized } = useAPIs();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooksLoading, setIsBooksLoading] = useState(true);

  // Fetch books
  useEffect(() => {
    const fetchBooks = async () => {
      if (!apis) return;

      try {
        setIsBooksLoading(true);
        await apis.initialize();

        const response = await apis.getBooks();
        const uploadedBooks = response.books
          .filter((book) => book.is_uploaded)
          .map((book) => ({
            id: book.id,
            title: book.title || "Empty Book Name",
            coverUrl:
              "https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&auto=format&fit=crop&q=60",
            compression_ratio: book.compression_ratio ?? 0,
            progress: book.progress,
            total_page: book.total_page,
            chapters: [],
          }));
        setBooks(uploadedBooks);
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setIsBooksLoading(false);
      }
    };

    if (isInitialized) {
      fetchBooks();
    }
  }, [apis, isInitialized]);

  // Get dates for current week (Monday to Sunday)
  const getCurrentWeekDates = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday
    const monday = new Date(now);
    // If today is Sunday (0), we need to go back 6 days to get to Monday
    // Otherwise, we go back (currentDay - 1) days
    monday.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });
  };

  // Initialize check-ins and save today's check-in
  useEffect(() => {
    const initializeCheckIns = async () => {
      try {
        setIsLoading(true);
        await apis.initialize(); // Initialize API first

        // First save today's check-in
        await apis.saveCheckIn();

        // Then get the last 7 days of check-ins
        const response = await apis.getLastNCheckIns(7);
        setCheckIns(response.check_ins);
      } catch (error) {
        console.error("Error initializing check-ins:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeCheckIns();
  }, [apis]);

  // Process check-ins data
  const weekDays = getCurrentWeekDates();
  const processedCheckIns = weekDays.map((date) => {
    const dateStr = date.toISOString().split("T")[0];
    const checkIn = checkIns.find(
      (ci) => ci.created_datetime.split("T")[0] === dateStr
    );

    return {
      date,
      dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
      isCheckedIn: !!checkIn,
    };
  });

  // Calculate current streak
  const calculateStreak = (checkIns: CheckIn[]) => {
    let streak = 0;
    const today = new Date().toISOString().split("T")[0];

    // Sort check-ins by date in descending order
    const sortedCheckIns = [...checkIns].sort(
      (a, b) =>
        new Date(b.created_datetime).getTime() -
        new Date(a.created_datetime).getTime()
    );

    for (const checkIn of sortedCheckIns) {
      const checkInDate = checkIn.created_datetime.split("T")[0];
      if (checkInDate === today || streak > 0) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const currentStreak = calculateStreak(checkIns);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Reading Streak with Check-ins */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Reading Streak
              </h3>
              <p className="text-gray-400">
                Keep reading daily to maintain your streak!
              </p>
            </div>
          </div>
          <div className="text-3xl font-bold text-white">
            {currentStreak} days
          </div>
        </div>

        {/* Daily Check-in Calendar */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {isLoading
            ? // Loading skeleton
              Array(7)
                .fill(0)
                .map((_, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center p-1 sm:p-3 rounded-lg bg-gray-700/50 animate-pulse"
                  >
                    <div className="h-4 w-8 bg-gray-600 rounded mb-2"></div>
                    <div className="h-6 w-6 bg-gray-600 rounded-full"></div>
                  </div>
                ))
            : processedCheckIns.map((day, index) => (
                <div
                  key={index}
                  className={clsx(
                    "flex flex-col items-center p-1 sm:p-3 rounded-lg",
                    day.isCheckedIn ? "bg-orange-500/20" : "bg-gray-700/50"
                  )}
                >
                  <span className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">
                    {day.dayName}
                  </span>
                  <CheckCircle2
                    className={clsx(
                      "w-4 h-4 sm:w-6 sm:h-6",
                      day.isCheckedIn ? "text-orange-500" : "text-gray-600"
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
              {processedCheckIns[new Date().getDay() - 1]?.isCheckedIn
                ? "Completed"
                : "In Progress"}
            </span>
          </div>
        </div>
      </div>

      {/* Current Book */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">
          Continue Reading
        </h2>
        {isBooksLoading ? (
          // Loading skeleton grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-lg overflow-hidden"
              >
                <div className="relative h-48 bg-gray-700 animate-pulse" />
                <div className="p-4">
                  <div className="h-6 bg-gray-700 rounded animate-pulse mb-3" />
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 bg-gray-700 rounded animate-pulse" />
                    <div className="h-8 w-24 bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : books.length > 0 ? (
          // Existing books grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
              >
                <div className="relative h-48">
                  <Image
                    src={book.coverUrl}
                    alt={book.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />

                  {/* Reading Progress */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${
                            book.progress && book.total_page
                              ? Math.round(
                                  (book.progress / book.total_page) * 100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-300">
                      <span>Progress</span>
                      <span>
                        {book.progress && book.total_page
                          ? `${Math.round(
                              (book.progress / book.total_page) * 100
                            )}% Complete`
                          : "0% Complete"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {book.title}
                  </h3>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>Last read 2 days ago</span>
                    </div>
                    {book.compression_ratio === 0 ? (
                      <button
                        disabled
                        className="flex items-center gap-2 px-3 py-1 bg-gray-600 text-gray-300 rounded-lg cursor-not-allowed"
                      >
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Processing
                      </button>
                    ) : (
                      <Link
                        href={`/read/${book.id}?progress=${book.progress || 1}`}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Resume</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Existing empty state
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No Books Yet
            </h3>
            <p className="text-gray-400">
              Upload your first book to start reading
            </p>
          </div>
        )}
      </div>
    </div>
  );
}