'use client';

import { useState, useEffect } from 'react';
import { 
  FolderIcon,
  PlusIcon,
  CalendarIcon
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

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

export default function AdminProjects() {
  const [sidebarProjects, setSidebarProjects] = useState([
    { id: 1, name: 'Event planning', color: 'bg-pink-400' },
    { id: 2, name: 'Discussions', color: 'bg-green-400' }
  ]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        const data = await response.json();
        
        if (data.success) {
          setProjects(data.data);
          // Update sidebar projects with the fetched data
          const activeProjects = data.data
            .filter((p: Project) => p.status === 'Active')
            .slice(0, 2) // Limit to first 2 active projects for sidebar
            .map((p: Project) => ({ 
              id: p.id, 
              name: p.name, 
              color: p.color 
            }));
          setSidebarProjects(activeProjects);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <AdminLayout activeMenuItem="Projects" projects={sidebarProjects}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center">
            <PlusIcon className="h-4 w-4 mr-2" />
            New Project
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading projects...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className={`w-4 h-4 rounded-full ${project.color} mr-3`}></div>
                  <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                </div>
                
                {project.description && (
                  <p className="text-sm text-gray-600 mb-4">{project.description}</p>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      project.status === 'Active' ? 'bg-green-400' : 
                      project.status === 'Completed' ? 'bg-blue-400' : 
                      'bg-yellow-400'
                    }`}></div>
                    <span>{project.status}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <FolderIcon className="h-4 w-4 mr-2" />
                    <span>{project.taskCount} tasks ({project.completedTasks} completed)</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-500">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AdminLayout>
  );
}
