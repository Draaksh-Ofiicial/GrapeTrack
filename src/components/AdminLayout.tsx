'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Project {
  id: number;
  name: string;
  color: string;
}

interface AdminLayoutProps {
  children: ReactNode;
  activeMenuItem?: string;
  projects?: Project[];
}

export default function AdminLayout({ 
  children, 
  activeMenuItem = 'Dashboard',
  projects = [
    { id: 1, name: 'Event planning', color: 'bg-pink-400' },
    { id: 2, name: 'Discussions', color: 'bg-green-400' }
  ]
}: AdminLayoutProps) {
  const router = useRouter();

  // Define the navigation routes
  const navigationRoutes: Record<string, string> = {
    'Dashboard': '/admin/dashboard',
    'Projects': '/admin/projects',
    'My tasks': '/admin/mytasks',
    'Documents': '/admin/documents',
    'Receipts': '/admin/receipts',
    'Settings': '/admin/settings',
    'Help & Support': '/admin/help'
  };

  const handleMenuItemClick = (item: string) => {
    console.log('Menu item clicked:', item);
    
    // Navigate to the appropriate page
    const route = navigationRoutes[item];
    if (route) {
      router.push(route);
    } else {
      console.warn(`No route defined for menu item: ${item}`);
    }
  };

  const handleProjectClick = (project: Project) => {
    console.log('Project clicked:', project);
    // Handle project selection here
  };

  const handleAddProject = () => {
    console.log('Add project clicked');
    // Handle add project here
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        activeItem={activeMenuItem}
        projects={projects}
        onMenuItemClick={handleMenuItemClick}
        onProjectClick={handleProjectClick}
        onAddProject={handleAddProject}
      />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
