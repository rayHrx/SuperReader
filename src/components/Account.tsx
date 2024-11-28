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
  Chrome,
  CreditCard,
  Clock,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

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
      router.push("/welcome");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!user) {
    router.push("/welcome");
    return null;
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-900 overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center border-4 border-gray-600">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "Profile"}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {user.displayName || "Anonymous User"}
              </h1>
              <div className="flex flex-wrap gap-4 text-gray-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Member since{" "}
                    {new Date(user.metadata.creationTime!).toLocaleDateString()}
                  </span>
                </div>
                {user.providerData[0].providerId === "google.com" && (
                  <div className="flex items-center gap-2">
                    <Chrome className="w-4 h-4" />
                    <span>Google Account</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Subscription Status Card */}
          <div className="md:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription Status
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-gray-300">Current Plan</p>
                    <p className="text-white font-medium">Pro Membership</p>
                  </div>
                  <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm">
                    Active
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-gray-300">Next Billing Date</p>
                    <p className="text-white font-medium">December 31, 2024</p>
                  </div>
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <button className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium">
                View Billing History →
              </button>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Recent Activity
              </h2>
              <div className="space-y-2">
                <div className="p-4 bg-gray-700 rounded-lg">
                  <p className="text-gray-300">
                    Last login: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <button className="w-full bg-gray-700 rounded-lg p-4 flex items-center gap-3 hover:bg-gray-600 transition-colors">
                  <Settings className="w-5 h-5 text-gray-400" />
                  <span className="text-white">Account Settings</span>
                </button>
                <button className="w-full bg-gray-700 rounded-lg p-4 flex items-center gap-3 hover:bg-gray-600 transition-colors">
                  <Bell className="w-5 h-5 text-gray-400" />
                  <span className="text-white">Notifications</span>
                </button>
                <button className="w-full bg-gray-700 rounded-lg p-4 flex items-center gap-3 hover:bg-gray-600 transition-colors">
                  <HelpCircle className="w-5 h-5 text-gray-400" />
                  <span className="text-white">Help & Support</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-500/10 text-red-400 rounded-lg p-4 flex items-center gap-3 hover:bg-red-500/20 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}