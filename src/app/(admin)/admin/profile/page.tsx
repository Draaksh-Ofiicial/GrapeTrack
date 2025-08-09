'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
import Header from '@/components/Header';
import UserLoginStats from '@/components/UserLoginStats';
import UserMenu from '@/components/UserMenu';
import LocationSuggestion from '@/components/LocationSuggestion';

interface Profile {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
  department?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  createdAt: string;
  lastLoginAt?: string;
  loginCount: number;
  bio?: string;
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
  recentLogins?: Array<{
    id: string;
    loginAt: string;
    ipAddress?: string;
    userAgent?: string;
    provider?: string;
    success: boolean;
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  // Fetch profile data from session and database
  const fetchData = useCallback(async () => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      setLoading(false);
      return;
    }

    // Don't fetch again if profile is already loaded for the same user
    if (profile && profile.id === session.user.id) {
      return;
    }

    try {
      setLoading(true);
      
      // Get user's timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Try to fetch from database first
      let profileData: Profile | null = null;
      
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Use database data
            profileData = {
              id: result.data.id,
              name: result.data.name || 'Unknown User',
              email: result.data.email || '',
              image: result.data.image || undefined,
              role: result.data.role || 'Admin',
              department: result.data.department || 'Administration', 
              phone: result.data.phone || '',
              location: result.data.location || '',
              timezone: result.data.timezone || userTimezone,
              createdAt: result.data.createdAt || new Date().toISOString(),
              lastLoginAt: result.data.lastLoginAt,
              loginCount: result.data.loginCount || 0,
              bio: result.data.bio || '',
              skills: result.data.skills || [],
              stats: {
                projectsCompleted: 5,
                totalTasks: 23,
                teamMembers: 8,
                successRate: 92
              },
              preferences: {
                emailNotifications: result.data.emailNotifications ?? true,
                pushNotifications: result.data.pushNotifications ?? true,
                weeklyReports: result.data.weeklyReports ?? false,
                taskReminders: result.data.taskReminders ?? true,
                theme: result.data.theme || 'light'
              },
              recentActivity: [
                {
                  id: 1,
                  action: 'Signed in',
                  description: 'Logged in via Google OAuth',
                  timestamp: result.data.lastLoginAt || new Date().toISOString()
                }
              ],
              recentLogins: result.data.recentLogins || []
            };
          }
        }
      } catch (apiError) {
        console.error('Error fetching from API:', apiError);
      }
      
      // Fallback to session data if API fails
      if (!profileData) {
        profileData = {
          id: session.user.id || '',
          name: session.user.name || 'Unknown User',
          email: session.user.email || '',
          image: session.user.image || undefined,
          role: 'Admin',
          department: 'Administration',
          phone: '',
          location: '',
          timezone: userTimezone,
          createdAt: session.user.createdAt?.toString() || new Date().toISOString(),
          lastLoginAt: session.user.lastLoginAt?.toString(),
          loginCount: session.user.loginCount || 0,
          bio: '',
          skills: [],
          stats: {
            projectsCompleted: 5,
            totalTasks: 23,
            teamMembers: 8,
            successRate: 92
          },
          preferences: {
            emailNotifications: true,
            pushNotifications: true,
            weeklyReports: false,
            taskReminders: true,
            theme: 'light'
          },
          recentActivity: [
            {
              id: 1,
              action: 'Signed in',
              description: 'Logged in via Google OAuth',
              timestamp: session.user.lastLoginAt?.toString() || new Date().toISOString()
            }
          ]
        };
      }
      
      setProfile(profileData);
      setEditForm(profileData);

      // Fetch projects data
      try {
        const projectsResponse = await fetch('/api/projects');
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData.data || []);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    } catch (error) {
      console.error('Error setting up profile data:', error);
    } finally {
      setLoading(false);
    }
  }, [status, session?.user?.id, session?.user?.name, session?.user?.email]);

  // Only fetch data once when component mounts or user changes
  useEffect(() => {
    if (!profile || profile.id !== session?.user?.id) {
      fetchData();
    }
  }, [fetchData, session?.user?.id, profile?.id]);

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
      
      // Only send editable fields
      const updateData = {
        phone: editForm.phone || '',
        bio: editForm.bio || '',
        skills: editForm.skills || [],
        location: editForm.location || '',
        preferences: editForm.preferences
      };
      
      console.log('Saving profile data:', updateData);
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Update result:', result);
        
        if (result.success) {
          // Update profile with response data, preserving all existing data
          const updatedProfile: Profile = {
            ...profile,
            phone: result.data.phone || updateData.phone,
            bio: result.data.bio || updateData.bio,
            skills: result.data.skills || updateData.skills,
            location: result.data.location || updateData.location,
            preferences: {
              ...profile.preferences,
              ...updateData.preferences
            }
          };
          
          console.log('Updated profile:', updatedProfile);
          setProfile(updatedProfile);
          setEditForm(updatedProfile);
          setIsEditing(false);
          
          // Store in localStorage as backup
          localStorage.setItem('profileData', JSON.stringify(updatedProfile));
          console.log('Profile updated and saved successfully');
        } else {
          console.error('Update failed:', result.error);
          alert('Failed to update profile: ' + (result.error || 'Unknown error'));
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to update profile:', response.status, errorData);
        alert('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('An error occurred while updating your profile. Please try again.');
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

  const handlePreferenceChange = async (preference: string, value: boolean) => {
    if (!profile) return;
    
    // Update the UI immediately
    const currentPreferences = {
      emailNotifications: profile.preferences?.emailNotifications ?? true,
      pushNotifications: profile.preferences?.pushNotifications ?? true,
      weeklyReports: profile.preferences?.weeklyReports ?? false,
      taskReminders: profile.preferences?.taskReminders ?? true,
      theme: profile.preferences?.theme ?? 'light'
    };
    
    const updatedPreferences = {
      ...currentPreferences,
      [preference]: value
    };
    
    // Update both profile and editForm
    const updatedProfile = {
      ...profile,
      preferences: updatedPreferences
    };
    
    setProfile(updatedProfile);
    setEditForm(updatedProfile);
    
    try {
      // Save to database immediately
      const updateData = {
        phone: profile.phone || '',
        bio: profile.bio || '',
        skills: profile.skills || [],
        location: profile.location || '',
        preferences: updatedPreferences
      };
      
      console.log('Saving preference change:', preference, value, updatedPreferences);
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        console.error('Failed to save preference:', response.status);
        // Revert the change if save failed
        setProfile(profile);
        setEditForm(profile);
        alert('Failed to save preference. Please try again.');
      } else {
        console.log('Preference saved successfully');
        // Store in localStorage as backup
        localStorage.setItem('profileData', JSON.stringify(updatedProfile));
      }
    } catch (error) {
      console.error('Error saving preference:', error);
      // Revert the change if save failed
      setProfile(profile);
      setEditForm(profile);
      alert('An error occurred while saving preference. Please try again.');
    }
  };

  const handleAddSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && editForm.skills && !editForm.skills.includes(trimmedSkill)) {
      const updatedSkills = [...(editForm.skills || []), trimmedSkill];
      setEditForm(prev => ({
        ...prev,
        skills: updatedSkills
      }));
      console.log('Added skill:', trimmedSkill, 'Total skills:', updatedSkills);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updatedSkills = (editForm.skills || []).filter(skill => skill !== skillToRemove);
    setEditForm(prev => ({
      ...prev,
      skills: updatedSkills
    }));
    console.log('Removed skill:', skillToRemove, 'Remaining skills:', updatedSkills);
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
      <>
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
      </>
    );
  }

  if (!profile) {
    return (
      <>
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
      </>
    );
  }

  return (
    <>
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
                  {profile.image ? (
                    <img
                      src={profile.image}
                      alt={profile.name}
                      className="w-24 h-24 rounded-full object-cover mr-6"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mr-6">
                      {getInitials(profile.name)}
                    </div>
                  )}
                  <div>
                    {/* Name is not editable */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>
                    
                    {/* Role is not editable */}
                    <p className="text-lg text-gray-600 mb-1">{profile.role}</p>
                    
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
                    {/* Email is not editable */}
                    <span className="text-gray-900">{profile.email}</span>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Add your phone number"
                        className="flex-1 border border-gray-300 rounded px-3 py-1"
                      />
                    ) : (
                      <span className="text-gray-900">{profile.phone || 'No phone number added'}</span>
                    )}
                  </div>
                  <div className="flex items-start">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-1 flex-shrink-0" />
                    {isEditing ? (
                      <LocationSuggestion
                        value={editForm.location || ''}
                        onChange={(value) => handleInputChange('location', value)}
                        placeholder="Add your location"
                        className="flex-1"
                      />
                    ) : (
                      <span className="text-gray-900">{profile.location || 'No location specified'}</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">{profile.timezone}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">Joined {formatDate(profile.createdAt)}</span>
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
                    <p className="text-gray-700 leading-relaxed">
                      {profile.bio || 'No bio added yet. Click Edit Profile to add one.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Skills</h2>
                </div>
                <div className="px-6 py-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(isEditing ? editForm.skills : profile.skills)?.map((skill, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full flex items-center gap-2 ${isEditing ? 'pr-2' : ''}`}
                      >
                        {skill}
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveSkill(skill)}
                            className="text-blue-600 hover:text-blue-800 ml-1"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                    {(!profile.skills || profile.skills.length === 0) && !isEditing && (
                      <p className="text-gray-500 text-sm">No skills added yet. Click Edit Profile to add some.</p>
                    )}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a skill..."
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkill(newSkill);
                            setNewSkill('');
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          handleAddSkill(newSkill);
                          setNewSkill('');
                        }}
                        className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  )}
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

              {/* Recent Login Activity */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Login Activity</h2>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-3">
                    {profile.recentLogins && profile.recentLogins.length > 0 ? (
                      profile.recentLogins.map((login, index) => (
                        <div key={login.id} className="flex items-start">
                          <div className={`w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${
                            login.success ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">
                                {login.success ? 'Successful login' : 'Failed login attempt'}
                              </span>
                              {login.provider && (
                                <span className="text-gray-600"> via {login.provider}</span>
                              )}
                            </p>
                            <div className="text-xs text-gray-500 mt-1 space-y-1">
                              <p>{formatDate(login.loginAt)}</p>
                              {login.ipAddress && (
                                <p>IP: {login.ipAddress}</p>
                              )}
                              {login.userAgent && (
                                <p className="truncate" title={login.userAgent}>
                                  {login.userAgent.split(' ')[0]} {/* Show browser name */}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No recent login activity available</p>
                      </div>
                    )}
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
                    <button
                      onClick={() => handlePreferenceChange('emailNotifications', !profile?.preferences?.emailNotifications)}
                      className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${
                        profile?.preferences?.emailNotifications ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                        profile?.preferences?.emailNotifications ? 'translate-x-5' : 'translate-x-1'
                      }`}></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Push Notifications</span>
                    <button
                      onClick={() => handlePreferenceChange('pushNotifications', !profile?.preferences?.pushNotifications)}
                      className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${
                        profile?.preferences?.pushNotifications ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                        profile?.preferences?.pushNotifications ? 'translate-x-5' : 'translate-x-1'
                      }`}></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Weekly Reports</span>
                    <button
                      onClick={() => handlePreferenceChange('weeklyReports', !profile?.preferences?.weeklyReports)}
                      className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${
                        profile?.preferences?.weeklyReports ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                        profile?.preferences?.weeklyReports ? 'translate-x-5' : 'translate-x-1'
                      }`}></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Task Reminders</span>
                    <button
                      onClick={() => handlePreferenceChange('taskReminders', !profile?.preferences?.taskReminders)}
                      className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${
                        profile?.preferences?.taskReminders ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                        profile?.preferences?.taskReminders ? 'translate-x-5' : 'translate-x-1'
                      }`}></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Login Activity */}
          {profile.recentLogins && profile.recentLogins.length > 0 && (
            <div className="mt-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Login Activity</h2>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-3">
                    {profile.recentLogins.map((login) => (
                      <div key={login.id} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 font-medium">
                            {login.success ? 'Successful Login' : 'Failed Login'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(login.loginAt)} via {login.provider || 'Unknown'}
                          </p>
                          {login.ipAddress && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              IP: {login.ipAddress}
                            </p>
                          )}
                        </div>
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          login.success ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Login Statistics */}
          <div className="mt-6">
            <UserLoginStats />
          </div>
        </div>
      </main>
    </>
  );
}
