'use client';

import React, { useState } from 'react';
import { Menu, X, Home, Library, User, BookOpenCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/library', label: 'Library', icon: Library },
    { path: '/account', label: 'Account', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg shadow-lg hover:bg-gray-700 text-gray-300"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* App Logo - Only show when sidebar is closed */}
      {!isSidebarOpen && (
        <div className="fixed top-4 left-16 z-40 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
            <BookOpenCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">SpeedReader</span>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed top-0 left-0 h-full w-64 bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out z-50',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-4 border-b border-gray-700">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <BookOpenCheck className="w-5 h-5 text-white" />
          </div>
          <span className="ml-3 text-lg font-bold text-white">SpeedReader</span>
        </div>

        {/* Navigation Items */}
        <div className="pt-4 px-4">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              href={path}
              onClick={() => setIsSidebarOpen(false)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors',
                pathname === path
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="pt-16">{children}</main>
    </div>
  );
}