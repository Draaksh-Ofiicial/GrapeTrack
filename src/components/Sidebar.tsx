'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  HomeIcon, 
  FolderIcon, 
  CheckSquareIcon,
  FileTextIcon, 
  ReceiptIcon,
  SettingsIcon,
  HelpCircleIcon,
  PlusIcon,
  LoaderIcon,
} from 'lucide-react';

interface Project {
  id: number;
  name: string;
  color: string;
  description?: string;
  status: 'Active' | 'Completed' | 'On Hold';
  createdAt: string;
  taskCount: number;
  completedTasks: number;
}

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  href?: string;
}

interface SidebarProps {
  activeItem?: string;
  projects?: Project[];
  loading?: boolean;
  timezone?: string;
  onMenuItemClick?: (item: string) => void;
  onProjectClick?: (project: Project) => void;
  onAddProject?: () => void;
}

export default function Sidebar({ 
  activeItem = 'My tasks',
  projects = [
    { 
      id: 1, 
      name: 'Event planning', 
      color: 'bg-pink-400',
      status: 'Active' as const,
      createdAt: new Date().toISOString(),
      taskCount: 0,
      completedTasks: 0
    },
    { 
      id: 2, 
      name: 'Discussions', 
      color: 'bg-green-400',
      status: 'Active' as const,
      createdAt: new Date().toISOString(),
      taskCount: 0,
      completedTasks: 0
    }
  ],
  loading = false,
  timezone = 'Asia/Kolkata',
  onMenuItemClick,
  onProjectClick,
  onAddProject
}: SidebarProps) {
  const router = useRouter();

  const menuItems: MenuItem[] = [
    { icon: HomeIcon, label: 'Dashboard', active: activeItem === 'Dashboard', href: '/admin/dashboard' },
    { icon: FolderIcon, label: 'Projects', active: activeItem === 'Projects', href: '/admin/projects' },
    { icon: CheckSquareIcon, label: 'My tasks', active: activeItem === 'My tasks', href: '/admin/mytasks' },
    { icon: FileTextIcon, label: 'Documents', active: activeItem === 'Documents', href: '/admin/documents' },
    { icon: ReceiptIcon, label: 'Receipts', active: activeItem === 'Receipts', href: '/admin/receipts' },
  ];

  const getCurrentDayName = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long',
      timeZone: timezone
    };
    return now.toLocaleDateString('en-US', options);
  };

  const handleMenuItemClick = (item: MenuItem) => {
    // First call the parent callback if provided
    if (onMenuItemClick) {
      onMenuItemClick(item.label);
    }
    
    // Then handle navigation
    if (item.href) {
      router.push(item.href);
    }
  };

  const handleProjectClick = (project: Project) => {
    if (onProjectClick) {
      onProjectClick(project);
    }
  };

  const handleAddProject = () => {
    if (onAddProject) {
      onAddProject();
    }
  };

  return (
    <div className="w-64 bg-white shadow-sm border-r border-black h-screen flex flex-col">
      {/* Logo/Brand */}
      <div className="px-5 py-5 border-b border-black">
        <h1 className="text-xl font-bold text-gray-900">GrapeTrack</h1>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6 flex-1">
        <ul className="space-y-1 px-3">
          {menuItems.map((item, index) => (
            <li key={index}>
              <button
                onClick={() => handleMenuItemClick(item)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left cursor-pointer ${
                  item.active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Projects Section */}
        <div className="mt-8 px-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Projects</h3>
            <button 
              onClick={handleAddProject}
              className="p-1 hover:bg-gray-100 rounded cursor-pointer"
            >
              <PlusIcon className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          <ul className="space-y-2">
            {loading ? (
              <li className="flex items-center justify-center py-4">
                <LoaderIcon className="h-4 w-4 animate-spin text-gray-400 mr-2" />
                <span className="text-xs text-gray-500">Loading projects...</span>
              </li>
            ) : projects.length === 0 ? (
              <li className="py-4 text-center">
                <p className="text-xs text-gray-500">No projects yet</p>
              </li>
            ) : (
              projects.map((project) => (
                <li key={project.id}>
                  <button
                    onClick={() => handleProjectClick(project)}
                    className="w-full flex items-center text-sm hover:bg-gray-50 rounded p-2 transition-colors cursor-pointer"
                  >
                    <div className={`w-3 h-3 rounded-full mr-3 ${project.color}`}></div>
                    <span className="text-gray-700">{project.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </nav>

      {/* Bottom Menu */}
      <div className="p-3 border-t border-black bg-white">
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => {
                if (onMenuItemClick) onMenuItemClick('Settings');
                router.push('/admin/settings');
              }}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <SettingsIcon className="mr-3 h-5 w-5" />
              Settings
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                if (onMenuItemClick) onMenuItemClick('Help & Support');
                router.push('/admin/help');
              }}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <HelpCircleIcon className="mr-3 h-5 w-5" />
              Help & Support
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
