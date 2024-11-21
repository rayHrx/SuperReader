import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Book } from '../types';
import { Clock, BookOpenCheck, BookOpen } from 'lucide-react';

interface HomeProps {
  books: Book[];
}

export default function Home({ books }: HomeProps) {
  const navigate = useNavigate();
  const recentBooks = books.slice(0, 3); // Show only the 3 most recent books

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
          <BookOpenCheck className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Continue Reading</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recentBooks.map((book) => (
          <div
            key={book.id}
            className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer"
            onClick={() => navigate(`/read/${book.id}`)}
          >
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
                <button
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/read/${book.id}`);
                  }}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Resume</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}