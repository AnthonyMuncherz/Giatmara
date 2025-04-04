'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  status: string;
  description: string;
  requirements: string;
  responsibilities?: string;
  benefits?: string;
  employmentType?: string;
  mbtiTypes?: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Try using the /api/auth/me endpoint which should include role information
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          console.log('Admin check data:', data); // Debug log
          if (data.user?.role === 'ADMIN') {
            setIsAdmin(true);
          } else {
            console.log('Not an admin, redirecting to dashboard');
            // Not an admin, redirect to dashboard
            router.push('/dashboard');
          }
        } else {
          console.log('Not authenticated, redirecting to login');
          // Error or not authenticated
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [router]);

  // Add a function to fetch jobs
  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const response = await fetch('/api/jobs');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs);
      } else {
        console.error('Failed to fetch jobs');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setJobsLoading(false);
    }
  };

  // Fetch jobs when the component mounts and admin status is confirmed
  useEffect(() => {
    if (isAdmin && !isLoading) {
      fetchJobs();
    }
  }, [isAdmin, isLoading]);

  const handleCreateJob = () => {
    // Redirect to a new job creation form
    router.push('/dashboard/admin/create-job');
  };

  const handleEditJob = (jobId: string) => {
    // Redirect to job edit page
    router.push(`/dashboard/admin/edit-job/${jobId}`);
  };

  const handleUpdateJobFields = async () => {
    if (confirm('Are you sure you want to update all job postings with new fields?')) {
      setIsUpdating(true);
      setUpdateMessage('');
      
      try {
        const response = await fetch('/api/jobs/update-fields', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setUpdateMessage(`Success: ${data.message}. Updated ${data.jobsUpdated} jobs.`);
        } else {
          setUpdateMessage(`Error: ${data.error || 'Failed to update jobs'}`);
        }
      } catch (error) {
        console.error('Error updating job fields:', error);
        setUpdateMessage('Error: Failed to connect to the server');
      } finally {
        setIsUpdating(false);
      }
    }
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
            Admin Dashboard
          </h2>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            type="button"
            onClick={handleCreateJob}
            className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            Create New Job
          </button>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Job Management Tools
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              Use these tools to manage job postings in the system.
            </p>
          </div>
          <div className="mt-5">
            <button
              type="button"
              onClick={handleUpdateJobFields}
              disabled={isUpdating}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {isUpdating ? 'Updating...' : 'Update Job Fields'}
            </button>
            
            {updateMessage && (
              <div className={`mt-3 text-sm ${updateMessage.startsWith('Success') ? 'text-green-600' : 'text-red-600'}`}>
                {updateMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Job Listings Section */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Manage Job Postings
          </h3>
          
          {jobsLoading ? (
            <div className="py-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : jobs.length > 0 ? (
            <div className="mt-4">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Title
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Company
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Location
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {jobs.map((job) => (
                      <tr key={job.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {job.title}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {job.company}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {job.location}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            job.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleEditJob(job.id)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </button>
                          <a 
                            href={`/jobs/${job.id}`}
                            target="_blank"
                            rel="noopener noreferrer" 
                            className="text-gray-600 hover:text-gray-900"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-4 text-sm text-gray-500">
              No job postings found.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Admin Navigation
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard/admin/applications')}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Manage Applications
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 