'use client';

import { useState, useEffect } from 'react';
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
  LoaderIcon,
} from 'lucide-react';
import Header from '@/components/Header';
import LocationSuggestion from '@/components/LocationSuggestion';
import Image from 'next/image';
import useCurrentUser from '@/hooks/useCurrentUser';

interface Profile {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  usertype?: string | null;
  phone?: string | null;
  address?: string | null;
  timezone?: string | null;
  created_at?: Date | null;
  bio?: string | null;
  display_name?: string | null;
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyReports: boolean;
    taskReminders: boolean;
  };
  skills: string[];
}

export default function AdminProfile() {
  const { user, loading: userLoading, isSignedIn } = useCurrentUser();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !isSignedIn) {
      router.push('/login');
    }
  }, [userLoading, isSignedIn, router]);

  // Load profile data from session
  useEffect(() => {
    if (userLoading) {
      return; // Still loading user data
    }

    if (!user) {
      setLoading(false);
      return;
    }

    // Use session data directly - no API calls needed
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const profileData: Profile = {
      id: user.id,
      name: user.name || 'Unknown User',
      email: user.email || '',
      avatar: user.avatar,
      usertype: user.usertype || 'User',
      phone: user.phone || '',
      address: user.address || '',
      timezone: user.timezone || userTimezone,
      created_at: user.created_at,
      bio: user.bio || '',
      display_name: user.display_name || '',
      preferences: {
        emailNotifications: user.email_notification ?? true,
        pushNotifications: user.push_notifications ?? false,
        weeklyReports: (user.preferences as Record<string, unknown>)?.weeklyReports as boolean ?? false,
        taskReminders: (user.preferences as Record<string, unknown>)?.taskReminders as boolean ?? true,
      },
      skills: (user.metadata as Record<string, unknown>)?.skills as string[] || []
    };

    setProfile(profileData);
    setEditForm(profileData);
    setLoading(false);
  }, [user, userLoading]);

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

      // Prepare update data for API
      const updateData = {
        phone: editForm.phone || '',
        bio: editForm.bio || '',
        address: editForm.address || '',
        display_name: editForm.display_name || '',
        timezone: editForm.timezone || profile.timezone,
        preferences: {
          ...profile.preferences,
          ...editForm.preferences
        },
        metadata: {
          skills: editForm.skills || []
        }
      };

      console.log('Saving profile data:', updateData);

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Update result:', result);

        if (result.success) {
          // Update profile with the saved data
          const updatedProfile: Profile = {
            ...profile,
            phone: updateData.phone,
            bio: updateData.bio,
            address: updateData.address,
            display_name: updateData.display_name,
            timezone: updateData.timezone,
            preferences: updateData.preferences,
            skills: updateData.metadata.skills
          };

          setProfile(updatedProfile);
          setEditForm(updatedProfile);
          setIsEditing(false);
          console.log('Profile updated successfully');
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

  const handleInputChange = (field: string, value: string | number | boolean | undefined) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = async (preference: string, value: boolean) => {
    if (!profile) return;

    // Update the UI immediately
    const updatedPreferences = {
      ...profile.preferences,
      [preference]: value
    };

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
        address: profile.address || '',
        display_name: profile.display_name || '',
        timezone: profile.timezone || '',
        preferences: updatedPreferences,
        metadata: {
          skills: profile.skills || []
        }
      };

      console.log('Saving preference change:', preference, value);

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
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updatedSkills = (editForm.skills || []).filter(skill => skill !== skillToRemove);
    setEditForm(prev => ({
      ...prev,
      skills: updatedSkills
    }));
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  if (loading || userLoading) {
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
        <div className="mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  {profile.avatar ? (
                    <div className="w-24 h-24 relative rounded-full overflow-hidden mr-6">
                      <Image src={profile.avatar} alt={profile.name} fill sizes="96px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mr-6">
                      {getInitials(profile.name)}
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {profile.display_name || profile.name}
                    </h1>
                    <p className="text-lg text-gray-600 mb-1">{profile.usertype}</p>
                                    <p className="text-sm text-gray-500">Member since {formatDate(profile.created_at ?? null)}</p>
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
                        value={editForm.address || ''}
                        onChange={(value) => handleInputChange('address', value)}
                        placeholder="Add your location"
                        className="flex-1"
                      />
                    ) : (
                      <span className="text-gray-900">{profile.address || 'No location specified'}</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">{profile.timezone}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">Joined {formatDate(profile.created_at ?? null)}</span>
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
                    {(isEditing ? editForm.skills : profile.skills)?.map((skill) => (
                      <span
                        key={skill}
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

            {/* Right Column - Preferences */}
            <div className="space-y-6">
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
        </div>
      </main>
    </>
  );
}
