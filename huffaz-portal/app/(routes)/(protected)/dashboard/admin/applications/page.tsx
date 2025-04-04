'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Application {
  id: string;
  status: 'PENDING' | 'REJECTED' | 'INTERVIEWING' | 'ACCEPTED';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    email: string;
    profile: {
      firstName: string;
      lastName: string;
      mbtiType: string | null;
      resumeUrl: string | null;
      certificateUrl: string | null;
    }
  };
  jobPosting: {
    title: string;
    company: string;
    location: string;
    mbtiTypes: string | null;
  };
}

export default function ApplicationsManagementPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [updateMessage, setUpdateMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const router = useRouter();

  // First effect: Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user?.role === 'ADMIN') {
            setIsAdmin(true);
          } else {
            router.push('/dashboard');
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/login');
      } finally {
        setAuthChecked(true);
      }
    };

    checkAdminStatus();
  }, [router]);

  // Second effect: Fetch applications once admin status is confirmed
  useEffect(() => {
    // Only proceed if admin status is confirmed and admin is true
    if (!authChecked || !isAdmin) return;
    
    const fetchApplications = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/applications');
        if (response.ok) {
          const data = await response.json();
          setApplications(data.applications);
        } else {
          console.error('Failed to fetch applications');
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
    // This effect should only run once when authChecked becomes true and isAdmin is true
  }, [authChecked, isAdmin]);

  // Fix for infinite re-renders: separating the refresh function
  const refreshApplications = async () => {
    // Don't set isLoading to true here to prevent triggering the useEffect again
    try {
      const refreshResponse = await fetch('/api/applications');
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setApplications(refreshData.applications);
      }
    } catch (error) {
      console.error('Error refreshing applications:', error);
    }
  };

  const handleUpdateStatus = async (applicationId: string, newStatus: string, notes?: string) => {
    setIsUpdating(true);
    setUpdateMessage('');
    try {
      const response = await fetch('/api/applications/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          applicationId, 
          status: newStatus,
          notes
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setUpdateMessage(`Application status updated to ${newStatus}`);
        // Refresh applications without changing isLoading
        await refreshApplications();
      } else {
        setUpdateMessage(`Error: ${data.error || 'Failed to update application'}`);
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      setUpdateMessage('Error: Failed to connect to the server');
    } finally {
      setIsUpdating(false);
    }
  };

  const filterApplications = () => {
    if (filter === 'ALL') return applications;
    return applications.filter(app => app.status === filter);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING': 
        return 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20';
      case 'REJECTED': 
        return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20';
      case 'INTERVIEWING': 
        return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20';
      case 'ACCEPTED': 
        return 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20';
      default: 
        return 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'REJECTED':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'INTERVIEWING':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
        );
      case 'ACCEPTED':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const checkMbtiCompatibility = (application: Application) => {
    console.log(`Checking compatibility for ${application.user.profile.firstName}:`, {
      userMbti: application.user.profile.mbtiType,
      jobMbtiTypes: application.jobPosting.mbtiTypes
    });
    
    if (!application.user.profile.mbtiType) {
      return { compatible: false, message: 'User has not completed MBTI assessment' };
    }
    
    if (!application.jobPosting.mbtiTypes) {
      return { compatible: false, message: 'Job posting does not specify required MBTI types' };
    }

    const userMbti = application.user.profile.mbtiType;
    const jobMbtiTypes = application.jobPosting.mbtiTypes.split(',').map(mbti => mbti.trim());
    
    const isCompatible = jobMbtiTypes.includes(userMbti);
    
    return {
      compatible: isCompatible,
      message: isCompatible 
        ? `${userMbti} is compatible with this position` 
        : `${userMbti} is not listed in the preferred types: ${jobMbtiTypes.join(', ')}`
    };
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Applications Management
          </h2>
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Filter Applications
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('ALL')}
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${filter === 'ALL' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50 ring-1 ring-inset ring-gray-300'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              All
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${filter === 'PENDING' 
                ? 'bg-yellow-500 text-white' 
                : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 ring-1 ring-inset ring-yellow-600/20'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pending
            </button>
            <button
              onClick={() => setFilter('INTERVIEWING')}
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${filter === 'INTERVIEWING' 
                ? 'bg-blue-500 text-white' 
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 ring-1 ring-inset ring-blue-600/20'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              Interviewing
            </button>
            <button
              onClick={() => setFilter('ACCEPTED')}
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${filter === 'ACCEPTED' 
                ? 'bg-green-500 text-white' 
                : 'bg-green-50 text-green-700 hover:bg-green-100 ring-1 ring-inset ring-green-600/20'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Accepted
            </button>
            <button
              onClick={() => setFilter('REJECTED')}
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${filter === 'REJECTED' 
                ? 'bg-red-500 text-white' 
                : 'bg-red-50 text-red-700 hover:bg-red-100 ring-1 ring-inset ring-red-600/20'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Rejected
            </button>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Manage Applications
          </h3>
          
          {isLoading ? (
            <div className="py-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : filterApplications().length > 0 ? (
            <div className="mt-4">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Applicant
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Job Position
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Company
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        MBTI
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Applied Date
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filterApplications().map((application) => (
                      <tr key={application.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <p>{application.user.profile.firstName} {application.user.profile.lastName}</p>
                          <p className="text-gray-500 text-xs">{application.user.email}</p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {application.jobPosting.title}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {application.jobPosting.company}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {application.user.profile.mbtiType ? (
                            <div className="flex items-center">
                              {application.user.profile.mbtiType}
                              {application.jobPosting.mbtiTypes && (
                                <span className={`ml-2 inline-flex h-2 w-2 rounded-full ${
                                  application.jobPosting.mbtiTypes.split(',').map(t => t.trim()).includes(application.user.profile.mbtiType) 
                                  ? 'bg-green-500' 
                                  : 'bg-yellow-500'
                                }`} 
                                title={application.jobPosting.mbtiTypes.split(',').map(t => t.trim()).includes(application.user.profile.mbtiType) 
                                  ? 'Compatible' 
                                  : 'Not compatible'}>
                                </span>
                              )}
                            </div>
                          ) : 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(application.status)}`}>
                            {getStatusIcon(application.status)}
                            {application.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(application.createdAt).toLocaleDateString()}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              href={`/dashboard/admin/applications/${application.id}`}
                              className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/20 hover:bg-indigo-100"
                            >
                              View Details
                            </Link>
                            
                            {application.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(application.id, 'INTERVIEWING')}
                                  className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/20 hover:bg-blue-100"
                                >
                                  Interview
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(application.id, 'REJECTED')}
                                  className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-700/20 hover:bg-red-100"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {application.status === 'INTERVIEWING' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(application.id, 'ACCEPTED')}
                                  className="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/20 hover:bg-green-100"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(application.id, 'REJECTED')}
                                  className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-700/20 hover:bg-red-100"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {(application.status === 'REJECTED' || application.status === 'ACCEPTED') && (
                              <button
                                onClick={() => handleUpdateStatus(application.id, 'PENDING')}
                                className="rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-700/20 hover:bg-yellow-100"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-4 text-sm text-gray-500">
              No applications found.
            </div>
          )}

          {updateMessage && (
            <div className={`mt-3 text-sm ${updateMessage.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {updateMessage}
            </div>
          )}
        </div>
      </div>

      {/* Applications Summary */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Applications Summary
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{applications.length}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-yellow-700">Pending</p>
              <p className="mt-1 text-3xl font-semibold text-yellow-700">
                {applications.filter(a => a.status === 'PENDING').length}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-blue-700">Interviewing</p>
              <p className="mt-1 text-3xl font-semibold text-blue-700">
                {applications.filter(a => a.status === 'INTERVIEWING').length}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-green-700">Accepted</p>
              <p className="mt-1 text-3xl font-semibold text-green-700">
                {applications.filter(a => a.status === 'ACCEPTED').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 