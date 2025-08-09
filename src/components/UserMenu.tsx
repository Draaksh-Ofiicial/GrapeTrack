'use client';

import { signOut, useSession } from 'next-auth/react';
import { LogOutIcon, UserIcon } from 'lucide-react';

export default function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  const handleLogout = () => {
    signOut({
      callbackUrl: '/admin/login'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
          {session.user.name ? getInitials(session.user.name) : <UserIcon className="h-4 w-4" />}
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-medium text-gray-700">{session.user.name}</p>
          <p className="text-xs text-gray-500">{session.user.email}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        title="Sign out"
      >
        <LogOutIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
