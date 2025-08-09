'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  ClockIcon,
  CalendarIcon,
  UserIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
} from 'lucide-react';

interface LoginHistoryItem {
  id: string;
  loginAt: string;
  provider: string;
  ipAddress?: string;
  success: boolean;
}

interface UserLoginInfo {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    createdAt: string;
    lastLoginAt?: string;
    loginCount: number;
  };
  recentLogins: LoginHistoryItem[];
  loginStats: Array<{
    provider: string;
    _count: { provider: number };
  }>;
  monthlyLogins: Array<{
    loginAt: string;
    provider: string;
  }>;
}

export default function UserLoginStats() {
  const { data: session } = useSession();
  const [loginInfo, setLoginInfo] = useState<UserLoginInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchLoginInfo();
    }
  }, [session]);

  const fetchLoginInfo = async () => {
    try {
      const response = await fetch('/api/user/login-info');
      if (response.ok) {
        const data = await response.json();
        setLoginInfo(data);
      }
    } catch (error) {
      console.error('Error fetching login info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!loginInfo) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-500">Unable to load login information.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return `${Math.floor(diffInHours / 24)} days ago`;
    }
  };

  return (
    <div className="space-y-6">
      {/* User Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <UserIcon className="h-5 w-5 mr-2" />
          Account Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <TrendingUpIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{loginInfo.user.loginCount}</p>
            <p className="text-sm text-gray-600">Total Logins</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CalendarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-600">
              {formatRelativeTime(loginInfo.user.createdAt)}
            </p>
            <p className="text-sm text-gray-600">Member Since</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <ClockIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-purple-600">
              {loginInfo.user.lastLoginAt ? formatRelativeTime(loginInfo.user.lastLoginAt) : 'Never'}
            </p>
            <p className="text-sm text-gray-600">Last Login</p>
          </div>
        </div>
      </div>

      {/* Recent Login Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ShieldCheckIcon className="h-5 w-5 mr-2" />
          Recent Login Activity
        </h3>
        <div className="space-y-3">
          {loginInfo.recentLogins.length > 0 ? (
            loginInfo.recentLogins.map((login) => (
              <div key={login.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${login.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Login via {login.provider.charAt(0).toUpperCase() + login.provider.slice(1)}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(login.loginAt)}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  login.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {login.success ? 'Success' : 'Failed'}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No recent login activity.</p>
          )}
        </div>
      </div>

      {/* Login Methods */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Login Methods</h3>
        <div className="space-y-2">
          {loginInfo.loginStats.map((stat) => (
            <div key={stat.provider} className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {stat.provider}
                </span>
              </div>
              <span className="text-sm text-gray-500">{stat._count.provider} times</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
