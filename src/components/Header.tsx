'use client';

import { useRouter } from 'next/navigation';
import { 
  SearchIcon,
  BellIcon,
  UserIcon,
  PlusIcon
} from 'lucide-react';

interface HeaderProps {
  // Search functionality
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  showSearchShortcut?: boolean;
  
  // Action buttons
  primaryAction?: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
  };
  
  // Header actions
  onNotificationClick?: () => void;
  onUserClick?: () => void;
  showNotifications?: boolean;
  showUserMenu?: boolean;
  
  // Additional props
  className?: string;
}

export default function Header({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search or type a command',
  showSearchShortcut = true,
  primaryAction,
  onNotificationClick,
  onUserClick,
  showNotifications = true,
  showUserMenu = true,
  className = ''
}: HeaderProps) {
  
  const router = useRouter();
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  const handleNotificationClick = () => {
    if (onNotificationClick) {
      onNotificationClick();
    }
  };

  const handleUserClick = () => {
    if (onUserClick) {
      onUserClick();
    } else {
      // Default behavior: navigate to profile page
      router.push('/admin/profile');
    }
  };

  const handlePrimaryAction = () => {
    if (primaryAction?.onClick) {
      primaryAction.onClick();
    }
  };

  return (
    <header className={`bg-white border-b border-black px-5 py-3 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            />
            {showSearchShortcut && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 font-medium">
                ⌘S
              </span>
            )}
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-4">
          {/* Primary Action Button */}
          {primaryAction && (
            <button 
              onClick={handlePrimaryAction}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
            >
              {primaryAction.icon && (
                <primaryAction.icon className="h-4 w-4 mr-2" />
              )}
              {primaryAction.label}
            </button>
          )}
          
          {/* Notifications */}
          {showNotifications && (
            <button 
              onClick={handleNotificationClick}
              className="p-2 hover:bg-gray-100 rounded-lg relative transition-colors"
            >
              <BellIcon className="h-5 w-5 text-gray-600" />
            </button>
          )}
          
          {/* User Menu */}
          {showUserMenu && (
            <button 
              onClick={handleUserClick}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <UserIcon className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
