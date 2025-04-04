'use client';

import { useState, useEffect } from 'react';

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  mbtiType: string | null;
  resumeUrl: string | null;
  certificateUrl: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      phone: formData.get('phone'),
      mbtiType: formData.get('mbtiType'),
    };

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      setProfile(result.profile);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'resume' | 'certificate') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const response = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to upload ${type}`);
      }

      setProfile(prev => prev ? { ...prev, [`${type}Url`]: result.url } : null);
      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to upload ${type}`);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Profile Information</h3>
          <form onSubmit={handleSubmit} className="mt-5 space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    defaultValue={profile?.firstName}
                    required
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    defaultValue={profile?.lastName}
                    required
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    defaultValue={profile?.phone || ''}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="mbtiType" className="block text-sm font-medium text-gray-700">
                  MBTI Type
                </label>
                <div className="mt-1">
                  <select
                    id="mbtiType"
                    name="mbtiType"
                    defaultValue={profile?.mbtiType || ''}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select MBTI Type</option>
                    {[
                      'INTJ', 'INTP', 'ENTJ', 'ENTP',
                      'INFJ', 'INFP', 'ENFJ', 'ENFP',
                      'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
                      'ISTP', 'ISFP', 'ESTP', 'ESFP',
                    ].map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Resume</label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(e, 'resume')}
                    accept=".pdf,.doc,.docx"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {profile?.resumeUrl && (
                    <a
                      href={profile.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      View current
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Certificate</label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(e, 'certificate')}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {profile?.certificateUrl && (
                    <a
                      href={profile.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      View current
                    </a>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-600">
                {success}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={saving}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 