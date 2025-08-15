"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  FolderIcon,
  CheckSquareIcon,
  FileTextIcon,
  ReceiptIcon,
  SettingsIcon,
  HelpCircleIcon,
  LogOutIcon,
  PlusIcon,
  LoaderIcon,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { usersInterface } from '@/drizzle/schema';

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
  user?: Partial<usersInterface>;
}

export default function Sidebar({
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
  onProjectClick,
  onAddProject,
  user
}: SidebarProps) {

  const pathname = usePathname() ?? '';

  // normalize path (remove trailing slash)
  const normalizedPath = pathname.split('?')[0].replace(/\/$/, '');

  const menuItems: MenuItem[] = [
    { icon: HomeIcon, label: 'Dashboard', href: '/p/dashboard' },
    { icon: FolderIcon, label: 'Projects', href: '/p/projects' },
    { icon: CheckSquareIcon, label: 'My tasks', href: '/p/mytasks' },
    { icon: FileTextIcon, label: 'Documents', href: '/p/documents' },
    { icon: ReceiptIcon, label: 'Receipts', href: '/p/receipts' },
  ];

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
              {
                // determine active state based on current pathname
              }
              <Link
                href={item.href ?? '#'}
                aria-current={(() => {
                  const itemHref = (item.href ?? '').replace(/\/$/, '');
                  return itemHref && (normalizedPath === itemHref || normalizedPath.startsWith(itemHref + '/')) ? 'page' : undefined;
                })()}
                className={(() => {
                  const itemHref = (item.href ?? '').replace(/\/$/, '');
                  const isActive = itemHref && (normalizedPath === itemHref || normalizedPath.startsWith(itemHref + '/'));
                  return `w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`;
                })()}
              >
                <span className="mr-3 inline-flex items-center justify-center h-6 w-6 rounded-md bg-gray-100 text-gray-600">
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Projects Section */}
        <div className="mt-8 px-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Projects</h3>
            <button
              onClick={handleAddProject}
              aria-label="Add project"
              className="p-1 hover:bg-gray-100 rounded cursor-pointer text-gray-500"
            >
              <PlusIcon className="h-4 w-4" />
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
              projects.map((project) => {
                const projectPath = `/p/projects/${project.id}`;
                const isActive = normalizedPath === projectPath || normalizedPath.startsWith(projectPath + '/');
                const projectClass = `w-full flex items-center text-sm rounded p-2 transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`;
                return (
                  <li key={project.id}>
                    <Link
                      href={projectPath}
                      onClick={() => handleProjectClick(project)}
                      className={projectClass}
                    >
                      <div className={`w-3 h-3 rounded-full mr-3 ${project.color}`} />
                      <span className="text-gray-700 truncate">{project.name}</span>
                      <span className="ml-auto text-xs text-gray-400">{project.taskCount}</span>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </nav>

      {/* Bottom Menu */}
      <div className="p-3 border-t border-black bg-white">
        <ul className="space-y-2">
          <li>
            <Link
              href="/p/settings"
              aria-current={normalizedPath === '/p/settings' ? 'page' : undefined}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${normalizedPath === '/p/settings' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <SettingsIcon className="mr-3 h-5 w-5 text-gray-600" />
              Settings
            </Link>
          </li>
          <li>
            <Link
              href="/p/help"
              aria-current={normalizedPath === '/p/help' ? 'page' : undefined}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${normalizedPath === '/p/help' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <HelpCircleIcon className="mr-3 h-5 w-5 text-gray-600" />
              Help & Support
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <LogOutIcon className="mr-3 h-5 w-5 text-gray-600" />
              Log out
            </button>
          </li>
        </ul>

        {/* User panel */}
        <div className="mt-3 pt-3 border-t">
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/p/profile" className="flex items-center gap-3 w-full">
                <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                  {user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={String(user.avatar)} alt={String(user.name ?? 'User avatar')} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-500">{String((user.name ?? 'U')).charAt(0)}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{user.name ?? 'Unknown'}</div>
                  <div className="text-xs text-gray-500 truncate">{user.email ?? ''}</div>
                  <div className="text-xs text-gray-400 truncate">{user.usertype ? String(user.usertype) : ''}{user.created_at ? ` • Joined ${new Date(String(user.created_at)).toLocaleDateString()}` : ''}</div>
                </div>
              </Link>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Not signed in</div>
          )}
        </div>
      </div>
    </div>
  );
}
