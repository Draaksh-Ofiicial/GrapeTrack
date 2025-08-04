'use client';

import { useState, useEffect } from 'react';
import { 
  FolderIcon, 
  CheckSquareIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  LoaderIcon
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import CreateTaskModal from '@/components/CreateTaskModal';
import Header from '@/components/Header';

interface Task {
  id: number;
  name: string;
  assignedPeople: string[];
  status: 'To Do' | 'In Progress' | 'Done';
  projectId: number;
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

interface DashboardStats {
  hoursThisWeek: number;
  eventsThisMonth: number;
  projectsInProgress: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

export default function AdminMyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const getCurrentDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    };
    return now.toLocaleDateString('en-US', options);
  };

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [tasksResponse, projectsResponse, statsResponse] = await Promise.all([
          fetch('/api/tasks'),
          fetch('/api/projects'),
          fetch('/api/stats')
        ]);

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setTasks(tasksData.data || []);
        }

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData.data || []);
        }

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter tasks based on search query
  const filteredTasks = tasks.filter(task =>
    task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.assignedPeople.some(person => 
      person.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleTaskCreated = (newTask: Task) => {
    setTasks(prevTasks => [newTask, ...prevTasks]);
  };

  return (
    <AdminLayout activeMenuItem="My tasks" projects={projects}>
        {/* Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search or type a command"
          primaryAction={{
            label: "New Task",
            icon: PlusIcon,
            onClick: () => setShowCreateModal(true)
          }}
          onNotificationClick={() => console.log('Notifications clicked')}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-2">{getCurrentDate()}</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Good Morning! Alex,</h1>
            
            {/* Stats Cards */}
            <div className="flex space-x-6 mb-8">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <LoaderIcon className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.hoursThisWeek || 0
                  )}
                </span>
                <span className="text-sm text-gray-500 ml-1">hrs</span>
                <span className="text-xs text-gray-400 ml-1">this week</span>
              </div>
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <LoaderIcon className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.eventsThisMonth || 0
                  )}
                </span>
                <span className="text-sm text-gray-500 ml-1">events</span>
                <span className="text-xs text-gray-400 ml-1">this month</span>
              </div>
              <div className="flex items-center">
                <CheckSquareIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <LoaderIcon className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.projectsInProgress || 0
                  )}
                </span>
                <span className="text-sm text-gray-500 ml-1">projects</span>
                <span className="text-xs text-gray-400 ml-1">in progress</span>
              </div>
            </div>
          </div>

          {/* My Projects Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FolderIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">My Tasks</h2>
                  <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {loading ? '...' : filteredTasks.length}
                  </span>
                </div>
                <button className="text-sm text-gray-500 hover:text-gray-700">
                  See all
                </button>
              </div>
            </div>

            {/* Task Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <CheckSquareIcon className="h-4 w-4 mr-2" />
                        Task Name
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <UsersIcon className="h-4 w-4 mr-2" />
                        Assigned people
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                        Status
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center">
                          <LoaderIcon className="h-8 w-8 animate-spin text-gray-400 mr-2" />
                          <span className="text-gray-500">Loading tasks...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <CheckSquareIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-sm font-medium text-gray-900 mb-1">
                            {searchQuery ? 'No tasks found' : 'No tasks yet'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {searchQuery 
                              ? 'Try adjusting your search query.' 
                              : 'Get started by creating your first task.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{task.name}</div>
                          {task.dueDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex -space-x-2">
                            {task.assignedPeople.slice(0, 3).map((person, index) => (
                              <div
                                key={index}
                                className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold text-white"
                                title={person}
                              >
                                {person.split(' ').map(n => n.charAt(0)).join('').toUpperCase()}
                              </div>
                            ))}
                            {task.assignedPeople.length > 3 && (
                              <div className="w-8 h-8 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                                +{task.assignedPeople.length - 3}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              task.status === 'Done'
                                ? 'bg-green-100 text-green-800'
                                : task.status === 'In Progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {task.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Create Task Modal */}
        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={handleTaskCreated}
          projects={projects}
        />
    </AdminLayout>
  );
}
