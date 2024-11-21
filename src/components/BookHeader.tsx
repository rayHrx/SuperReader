import React from 'react';
import { Book } from '../types';
import { User } from 'lucide-react';

interface BookHeaderProps {
  book: Book;
}

export default function BookHeader({ book }: BookHeaderProps) {
  return (
    <div className="relative h-64 mb-8">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 to-gray-900/90">
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-full h-full object-cover mix-blend-overlay"
        />
      </div>
      <div className="relative h-full flex items-end p-8">
        <div className="text-white">
          <h1 className="text-4xl font-bold mb-2">{book.title}</h1>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <span className="text-lg">{book.author}</span>
          </div>
        </div>
      </div>
    </div>
  );
}