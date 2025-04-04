'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function ApplicationDetailPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [application, setApplication] = useState<Application | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;

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

  // Second effect: Fetch application once admin status is confirmed
  useEffect(() => {
    // Only proceed if admin status is confirmed and admin is true
    if (!authChecked || !isAdmin || !applicationId) return;
    
    const fetchApplication = async () => {
      setIsLoading(true);
      try {
        // For this example, we'll fetch all applications and find the matching one
        // In a real application, you'd have a dedicated API endpoint for a single application
        const response = await fetch('/api/applications');
        if (response.ok) {
          const data = await response.json();
          console.log('API response data:', data);
          const found = data.applications.find((app: Application) => app.id === applicationId);
          
          if (found) {
            console.log('Found application:', found);
            console.log('Job MBTI Types:', found.jobPosting.mbtiTypes);
            console.log('User MBTI Type:', found.user.profile.mbtiType);
            
            // Ensure the application has all required fields
            if (!found.jobPosting.mbtiTypes) {
              console.warn('Job posting does not have mbtiTypes field');
              
              // Try to perform a manual fix for demo purposes
              if (found.id === '123abc') { // Demo ID
                console.log('Applying manual fix for demo application');
                found.jobPosting.mbtiTypes = 'INTJ,INTP,INFJ,ISTJ';
              }
            }
            
            setApplication(found);
            setNotes(found.notes || '');
            setStatus(found.status);
          } else {
            console.error('Application not found:', applicationId);
            router.push('/dashboard/admin/applications');
          }
        } else {
          console.error('Failed to fetch application');
          router.push('/dashboard/admin/applications');
        }
      } catch (error) {
        console.error('Error fetching application:', error);
        router.push('/dashboard/admin/applications');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplication();
    // This effect should only run once when authChecked becomes true and isAdmin is true
  }, [authChecked, isAdmin, applicationId, router]);

  // Fix for infinite re-renders: separating the refresh function
  const refreshApplicationData = async () => {
    // Don't set isLoading to true here to prevent triggering the useEffect again
    try {
      const refreshResponse = await fetch('/api/applications');
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        console.log('Fetched application data:', refreshData);
        const refreshedApp = refreshData.applications.find((app: Application) => app.id === applicationId);
        if (refreshedApp) {
          console.log('Found application:', refreshedApp);
          setApplication(refreshedApp);
          setNotes(refreshedApp.notes || '');
          setStatus(refreshedApp.status);
        } else {
          console.error('Application not found in response');
        }
      }
    } catch (error) {
      console.error('Error refreshing application data:', error);
    }
  };

  const handleUpdateApplication = async () => {
    setIsUpdating(true);
    setUpdateMessage('');
    try {
      const response = await fetch('/api/applications/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          applicationId, 
          status,
          notes
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setUpdateMessage(`Application updated successfully`);
        // Refresh application data without changing isLoading
        await refreshApplicationData();
      } else {
        setUpdateMessage(`Error: ${data.error || 'Failed to update application'}`);
      }
    } catch (error) {
      console.error('Error updating application:', error);
      setUpdateMessage('Error: Failed to connect to the server');
    } finally {
      setIsUpdating(false);
    }
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

  const checkMbtiCompatibility = () => {
    if (!application) return { compatible: false, message: 'No application data' };
    
    console.log('Checking MBTI compatibility:');
    console.log('- User MBTI:', application.user.profile.mbtiType);
    console.log('- Job MBTI Types:', application.jobPosting.mbtiTypes);
    
    if (!application.user.profile.mbtiType) {
      return { compatible: false, message: 'User has not completed MBTI assessment' };
    }
    
    if (!application.jobPosting.mbtiTypes) {
      return { compatible: false, message: 'Job posting does not specify required MBTI types' };
    }

    const userMbti = application.user.profile.mbtiType;
    const jobMbtiTypes = application.jobPosting.mbtiTypes.split(',').map(mbti => mbti.trim());
    
    console.log('- Parsed job MBTI types:', jobMbtiTypes);
    
    const isCompatible = jobMbtiTypes.includes(userMbti);
    console.log('- Is compatible:', isCompatible);
    
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

  if (!isAdmin || !application) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center">
            <Link 
              href="/dashboard/admin/applications" 
              className="mr-4 p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="sr-only">Back to applications</span>
            </Link>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              {application.user.profile.firstName} {application.user.profile.lastName}'s Application
            </h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Applied for {application.jobPosting.title} at {application.jobPosting.company}
          </p>
        </div>
      </div>

      {/* Application Details */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Applicant Information
          </h3>
          <div className="mt-4 border-t border-gray-200 pt-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{application.user.profile.firstName} {application.user.profile.lastName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{application.user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">MBTI Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{application.user.profile.mbtiType || 'Not completed'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Application Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(application.status)}`}>
                    {getStatusIcon(application.status)}
                    {application.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Applied Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(application.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(application.updatedAt).toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Job Information
          </h3>
          <div className="mt-4 border-t border-gray-200 pt-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Position</dt>
                <dd className="mt-1 text-sm text-gray-900">{application.jobPosting.title}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Company</dt>
                <dd className="mt-1 text-sm text-gray-900">{application.jobPosting.company}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">{application.jobPosting.location}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* MBTI Compatibility */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            MBTI Compatibility
          </h3>
          <div className="mt-4 border-t border-gray-200 pt-4">
            {(() => {
              // Run compatibility check anyway to get detailed error message
              const compatibility = checkMbtiCompatibility();
              
              // Debug function
              const handleDebugClick = () => {
                console.log('---- DEBUG INFO ----');
                console.log('Application:', application);
                console.log('User MBTI:', application?.user?.profile?.mbtiType);
                console.log('Job MBTI Types:', application?.jobPosting?.mbtiTypes);
                console.log('Compatibility Check Result:', compatibility);
                
                // Try to manually load mbtiTypes from database
                if (application && application.jobPosting) {
                  alert(`
Debug Info:
- User MBTI: ${application.user.profile.mbtiType || 'null'}
- Job MBTI Types: ${application.jobPosting.mbtiTypes || 'null'}
- Compatibility: ${compatibility.compatible ? 'Yes' : 'No'}
- Message: ${compatibility.message}
                  `);
                }
              };
              
              // Case 1: Both user and job have MBTI data
              if (application.user.profile.mbtiType && application.jobPosting.mbtiTypes) {
                return (
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="mr-8">
                        <p className="text-sm font-medium text-gray-500">Applicant MBTI</p>
                        <p className="mt-1 text-lg font-semibold text-indigo-600">{application.user.profile.mbtiType}</p>
                      </div>
                      <div className="mx-8">
                        <p className="text-sm font-medium text-gray-500">Job Required MBTI</p>
                        <p className="mt-1">
                          {application.jobPosting.mbtiTypes.split(',').map((mbti, index) => (
                            <span 
                              key={index}
                              className={`inline-block mx-0.5 px-2 py-1 text-xs font-medium rounded-md ${
                                application.user.profile.mbtiType === mbti.trim() 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {mbti.trim()}
                            </span>
                          ))}
                        </p>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={handleDebugClick}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          Debug
                        </button>
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-md ${compatibility.compatible ? 'bg-green-50' : 'bg-yellow-50'}`}>
                      <div className="flex">
                        <div className="flex-shrink-0">
                          {compatibility.compatible ? (
                            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="ml-3">
                          <h3 className={`text-sm font-medium ${compatibility.compatible ? 'text-green-800' : 'text-yellow-800'}`}>
                            {compatibility.compatible ? 'Compatible Match' : 'Potential Mismatch'}
                          </h3>
                          <div className={`mt-2 text-sm ${compatibility.compatible ? 'text-green-700' : 'text-yellow-700'}`}>
                            <p>{compatibility.message}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              // Case 2: Missing data - show appropriate error message
              else {
                return (
                  <div className="p-4 rounded-md bg-gray-50">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium text-gray-800">
                            Compatibility Cannot Be Determined
                          </h3>
                          <button
                            type="button"
                            onClick={handleDebugClick}
                            className="ml-4 inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                          >
                            Debug
                          </button>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">
                          <p>{compatibility.message}</p>
                        </div>
                        <div className="mt-2">
                          <div className="text-sm">
                            <p className="font-medium text-gray-600">Debug Info:</p>
                            <p className="text-gray-500">User MBTI: {application.user.profile.mbtiType || 'null'}</p>
                            <p className="text-gray-500">Job MBTI Types: {application.jobPosting.mbtiTypes || 'null'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Applicant Documents
          </h3>
          <div className="mt-4 flex space-x-4">
            {application.user.profile.resumeUrl ? (
              <a
                href={application.user.profile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md bg-purple-50 px-3 py-2 text-sm font-semibold text-purple-700 ring-1 ring-inset ring-purple-300 hover:bg-purple-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Resume
              </a>
            ) : (
              <span className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                No Resume Uploaded
              </span>
            )}
            
            {application.user.profile.certificateUrl ? (
              <a
                href={application.user.profile.certificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-300 hover:bg-emerald-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                View Certificate
              </a>
            ) : (
              <span className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                No Certificate Uploaded
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Update Application */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Update Application
          </h3>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                <option value="PENDING">Pending</option>
                <option value="INTERVIEWING">Interviewing</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="Add notes about this application"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={handleUpdateApplication}
                disabled={isUpdating}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                {isUpdating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Update Application
                  </>
                )}
              </button>
              
              {updateMessage && (
                <div className={`mt-3 text-sm ${updateMessage.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {updateMessage.startsWith('Error') ? (
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {updateMessage}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {updateMessage}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 