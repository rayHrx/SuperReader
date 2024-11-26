'use client';

import React from 'react';
import {
  Settings,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  BookOpenCheck,
  User,
  Mail,
  Calendar,
  Chrome
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
}

export default function Account() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/welcome');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems: MenuItem[] = [
    // {
    //   icon: <Settings className="w-5 h-5" />,
    //   label: 'Settings',
    //   description: 'App preferences and account settings',
    //   onClick: () => console.log('Settings clicked'),
    // },
    // {
    //   icon: <Bell className="w-5 h-5" />,
    //   label: 'Notifications',
    //   description: 'Manage your notification preferences',
    //   onClick: () => console.log('Notifications clicked'),
    // },
    // {
    //   icon: <Shield className="w-5 h-5" />,
    //   label: 'Privacy',
    //   description: 'Control your privacy settings',
    //   onClick: () => console.log('Privacy clicked'),
    // },
    {
      icon: <HelpCircle className="w-5 h-5" />,
      label: 'Help & Support',
      description: 'Get help or contact support',
      onClick: () => console.log('Help clicked'),
    },
  ];

  if (!user) {
    router.push('/welcome');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Profile Section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Profile'}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <User className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              {user.displayName || 'Anonymous User'}
            </h2>
            <div className="flex items-center gap-2 text-gray-400">
              <Mail className="w-4 h-4" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 mt-1">
              <Calendar className="w-4 h-4" />
              <span>Member since {new Date(user.metadata.creationTime!).toLocaleDateString()}</span>
            </div>
            {user.providerData[0].providerId === 'google.com' && (
              <div className="flex items-center gap-2 text-gray-400 mt-1">
                <Chrome className="w-4 h-4" />
                <span>Google Account</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className="w-full bg-gray-800 rounded-lg p-4 flex items-center gap-4 hover:bg-gray-700 transition-colors"
          >
            <div className="text-gray-400">{item.icon}</div>
            <div className="flex-1 text-left">
              <div className="text-white font-medium">{item.label}</div>
              {item.description && (
                <div className="text-sm text-gray-400">{item.description}</div>
              )}
            </div>
          </button>
        ))}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full mt-4 bg-red-600 text-white rounded-lg p-4 flex items-center gap-4 hover:bg-red-700 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
}