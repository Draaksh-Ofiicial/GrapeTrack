import { useState } from 'react';
import { XIcon, PlusIcon, LoaderIcon } from 'lucide-react';

interface Task {
  id: number;
  name: string;
  assignedPeople: string[];
  status: 'To Do' | 'In Progress' | 'Done';
  projectId: number | undefined;
  createdAt: string;
  dueDate?: string;
}

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

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: (task: Task) => void;
  projects: Project[];
}

export default function CreateTaskModal({ 
  isOpen, 
  onClose, 
  onTaskCreated, 
  projects 
}: CreateTaskModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    assignedPeople: '',
    status: 'To Do' as 'To Do' | 'In Progress' | 'Done',
    projectId: projects.length > 0 ? projects[0].id : undefined,
    dueDate: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (projects.length === 0 || formData.projectId === undefined) {
      console.error('No project selected or available');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          assignedPeople: formData.assignedPeople
            .split(',')
            .map(person => person.trim())
            .filter(person => person.length > 0),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onTaskCreated(result.data);
        setFormData({
          name: '',
          assignedPeople: '',
          status: 'To Do',
          projectId: projects.length > 0 ? projects[0].id : undefined,
          dueDate: ''
        });
        onClose();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Create New Task</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <XIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              placeholder="Enter task name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned People
            </label>
            <input
              type="text"
              value={formData.assignedPeople}
              onChange={(e) => setFormData({ ...formData, assignedPeople: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              placeholder="Enter names separated by commas"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple names with commas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project
            </label>
            <select
              value={formData.projectId || ''}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              required
            >
              {projects.length === 0 ? (
                <option value="">No projects available</option>
              ) : (
                <>
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'To Do' | 'In Progress' | 'Done' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim() || !formData.projectId}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
