'use client';

import { useState, useEffect } from 'react';
import { 
  UserIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  CalendarIcon,
  EditIcon,
  SaveIcon,
  XIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  UsersIcon,
  FolderIcon,
  LoaderIcon,
  SettingsIcon,
  BellIcon
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import Header from '@/components/Header';

interface Profile {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar: string | null;
  phone: string;
  location: string;
  timezone: string;
  joinedDate: string;
  bio: string;
  skills: string[];
  stats: {
    projectsCompleted: number;
    totalTasks: number;
    teamMembers: number;
    successRate: number;
  };
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyReports: boolean;
    taskReminders: boolean;
    theme: string;
  };
  recentActivity: Array<{
    id: number;
    action: string;
    description: string;
    timestamp: string;
  }>;
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

export default function AdminProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch profile data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [profileResponse, projectsResponse] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/projects')
        ]);

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfile(profileData.data);
          setEditForm(profileData.data);
        }

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData.data || []);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm(profile || {});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(profile || {});
  };

  const handleSave = async () => {
    if (!profile) return;
    
    try {
      setSaving(true);
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(result.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  if (loading) {
    return (
      <AdminLayout activeMenuItem="Profile">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search profile..."
          onNotificationClick={() => console.log('Notifications clicked')}
        />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <LoaderIcon className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Loading profile...</p>
            </div>
          </div>
        </main>
      </AdminLayout>
    );
  }

  if (!profile) {
    return (
      <AdminLayout activeMenuItem="Profile">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search profile..."
          onNotificationClick={() => console.log('Notifications clicked')}
        />
        <main className="flex-1 p-6">
          <div className="text-center py-12">
            <UserIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Profile not found</h3>
            <p className="text-gray-500">Unable to load profile data.</p>
          </div>
        </main>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeMenuItem="Profile">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search profile..."
        primaryAction={
          isEditing
            ? {
                label: saving ? "Saving..." : "Save Changes",
                icon: saving ? LoaderIcon : SaveIcon,
                onClick: handleSave
              }
            : {
                label: "Edit Profile",
                icon: EditIcon,
                onClick: handleEdit
              }
        }
        onNotificationClick={() => console.log('Notifications clicked')}
      />

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mr-6">
                    {getInitials(profile.name)}
                  </div>
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="text-3xl font-bold text-gray-900 mb-2 border border-gray-300 rounded px-3 py-1"
                      />
                    ) : (
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>
                    )}
                    
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.role || ''}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className="text-lg text-gray-600 mb-1 border border-gray-300 rounded px-3 py-1 w-full"
                      />
                    ) : (
                      <p className="text-lg text-gray-600 mb-1">{profile.role}</p>
                    )}
                    
                    <p className="text-sm text-gray-500">{profile.department}</p>
                  </div>
                </div>
                
                {isEditing && (
                  <button
                    onClick={handleCancel}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XIcon className="h-5 w-5 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Contact Info & Bio */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div className="flex items-center">
                    <MailIcon className="h-5 w-5 text-gray-400 mr-3" />
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="flex-1 border border-gray-300 rounded px-3 py-1"
                      />
                    ) : (
                      <span className="text-gray-900">{profile.email}</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="flex-1 border border-gray-300 rounded px-3 py-1"
                      />
                    ) : (
                      <span className="text-gray-900">{profile.phone}</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.location || ''}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="flex-1 border border-gray-300 rounded px-3 py-1"
                      />
                    ) : (
                      <span className="text-gray-900">{profile.location}</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">{profile.timezone}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">Joined {formatDate(profile.joinedDate)}</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">About</h2>
                </div>
                <div className="px-6 py-4">
                  {isEditing ? (
                    <textarea
                      value={editForm.bio || ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded px-3 py-2 resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Skills</h2>
                </div>
                <div className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Stats & Activity */}
            <div className="space-y-6">
              {/* Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Statistics</h2>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FolderIcon className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-sm text-gray-600">Projects Completed</span>
                    </div>
                    <span className="font-semibold text-gray-900">{profile.stats.projectsCompleted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm text-gray-600">Total Tasks</span>
                    </div>
                    <span className="font-semibold text-gray-900">{profile.stats.totalTasks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <UsersIcon className="h-5 w-5 text-purple-500 mr-2" />
                      <span className="text-sm text-gray-600">Team Members</span>
                    </div>
                    <span className="font-semibold text-gray-900">{profile.stats.teamMembers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUpIcon className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="text-sm text-gray-600">Success Rate</span>
                    </div>
                    <span className="font-semibold text-gray-900">{profile.stats.successRate}%</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-3">
                    {profile.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">{activity.action}:</span> {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
                </div>
                <div className="px-6 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email Notifications</span>
                    <div className={`w-10 h-6 rounded-full ${profile.preferences.emailNotifications ? 'bg-blue-500' : 'bg-gray-300'} relative`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${profile.preferences.emailNotifications ? 'translate-x-5' : 'translate-x-1'}`}></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Push Notifications</span>
                    <div className={`w-10 h-6 rounded-full ${profile.preferences.pushNotifications ? 'bg-blue-500' : 'bg-gray-300'} relative`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${profile.preferences.pushNotifications ? 'translate-x-5' : 'translate-x-1'}`}></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Weekly Reports</span>
                    <div className={`w-10 h-6 rounded-full ${profile.preferences.weeklyReports ? 'bg-blue-500' : 'bg-gray-300'} relative`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${profile.preferences.weeklyReports ? 'translate-x-5' : 'translate-x-1'}`}></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Task Reminders</span>
                    <div className={`w-10 h-6 rounded-full ${profile.preferences.taskReminders ? 'bg-blue-500' : 'bg-gray-300'} relative`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${profile.preferences.taskReminders ? 'translate-x-5' : 'translate-x-1'}`}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AdminLayout>
  );
}
