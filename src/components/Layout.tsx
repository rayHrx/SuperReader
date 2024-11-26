'use client';

import React, { useState } from 'react';
import { Menu, X, Home, Library, User, BookOpenCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import clsx from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  // If user is not authenticated, don't render the layout
  if (!user) {
    return null;
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/library', label: 'Library', icon: Library },
    { path: '/account', label: 'Account', icon: User },
  ];

  // Get current page title
  const currentPage = navItems.find(item => item.path === pathname)?.label || '';

  return (
    <div className="max-h-screen bg-gray-900 flex flex-col">
      {/* Fixed Header */}
      <div className="h-16 z-40 flex items-center bg-gray-800 shadow-lg px-4 flex-shrink-0">
        {/* Left section */}
        <div className="flex-1 flex items-center">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-gray-700 rounded-lg shadow-lg hover:bg-gray-600 text-gray-300 z-50"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="ml-4 text-xl font-semibold text-white">{currentPage}</h1>
        </div>

        {/* Center logo */}
        <div className="flex-1 flex justify-center">
          <Link
            href="/"
            className="hover:opacity-80 transition-opacity"
          >
            <div className="w-auto px-3 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center gap-2">
              <BookOpenCheck className="w-6 h-6 text-white" />
              <span className="text-white">SuperReader</span>
            </div>
          </Link>
        </div>

        {/* Right section */}
        <div className="flex-1 flex justify-end items-center pr-2" style={{justifyContent: "end"}}>
          <Link
            href="/account"
            className="p-2 bg-gray-700 rounded-lg shadow-lg hover:bg-gray-600 text-gray-300 transition-colors"
          >
            <User className="w-6 h-6" />
          </Link>
        </div>
      </div>

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
      <main className="flex-grow overflow-auto">{children}</main>
    </div>
  );
}