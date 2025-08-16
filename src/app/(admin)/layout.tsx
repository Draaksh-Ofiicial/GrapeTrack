'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import useCurrentUser from '@/hooks/useCurrentUser';

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

interface AdminLayoutProps {
  children: ReactNode;
  activeMenuItem?: string;
}

export default function AdminLayout({ 
  children, 
  activeMenuItem = 'Dashboard'
}: AdminLayoutProps) {
  const { user } = useCurrentUser();
  const [projects, setProjects] = useState<Project[]>([
    { 
      id: 1, 
      name: 'Event planning', 
      color: 'bg-pink-400',
      status: 'Active',
      createdAt: new Date().toISOString(),
      taskCount: 0,
      completedTasks: 0
    },
    { 
      id: 2, 
      name: 'Discussions', 
      color: 'bg-green-400',
      status: 'Active',
      createdAt: new Date().toISOString(),
      taskCount: 0,
      completedTasks: 0
    }
  ]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch projects data when component mounts
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/projects');
        
        if (response.ok) {
          const projectsData = await response.json();
          setProjects(projectsData.data || []);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

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
        loading={loading}
        onMenuItemClick={handleMenuItemClick}
        onProjectClick={handleProjectClick}
        onAddProject={handleAddProject}
        user={user ? (user as unknown as Partial<Record<string, unknown>>) : undefined}
      />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
