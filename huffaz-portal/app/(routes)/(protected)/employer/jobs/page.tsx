'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { useSession } from '@/app/lib/session'; // Import useSession
import { PlusIcon } from '@heroicons/react/24/outline'; // Import PlusIcon

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  deadline: string;
  status: string;
  applications: number;
}

export default function EmployerJobs() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession(); // Use session hook
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Keep local loading state for job fetching
  // const [authLoading, setAuthLoading] = useState(true); // Remove this, use sessionLoading

  const fetchJobs = async () => {
    setIsLoading(true); // Set loading true when starting fetch
    try {
      const response = await fetch('/api/employer/jobs', {
        credentials: 'include' // Ensure cookie is sent
      });
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      } else {
        console.error('Failed to fetch jobs:', await response.text());
        if (response.status === 401 || response.status === 403) {
          router.push('/login'); // Redirect if unauthorized
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false); // Set loading false when fetch completes or fails
    }
  };


  useEffect(() => {
    // Redirect if session is loaded but no user or user is not an employer
    if (!sessionLoading) {
      if (!user) {
        console.log('EmployerJobs: No user, redirecting to login.');
        router.push('/login');
      } else if (user.role !== 'EMPLOYER') {
        console.log('EmployerJobs: User is not employer, redirecting to dashboard.');
        router.push('/dashboard');
      } else {
        // User is authenticated and is an employer, fetch jobs
        console.log('EmployerJobs: User authenticated, fetching jobs.');
        fetchJobs();
      }
    }
  }, [user, sessionLoading, router]);


  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/employer/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include' // Ensure cookie is sent
      });

      if (response.ok) {
        // Refresh the jobs list
        fetchJobs();
      } else {
        console.error('Failed to update job status:', await response.text());
        // Handle error display if needed
      }
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  // Combined loading state check
  if (sessionLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <p>Loading job listings...</p>
        </div>
      </div>
    );
  }

  // If the user is loaded but not an employer, this component shouldn't render anything
  // as the useEffect will handle the redirect.
  if (!user || user.role !== 'EMPLOYER') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8"> {/* Added flex-wrap and gap */}
        <h1 className="text-3xl font-bold">My Job Postings</h1>
        <Link href="/employer/jobs/create">
          {/* Updated Button with Icon */}
          <Button variant="default" className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            Create New Job
          </Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-lg mb-4">You haven't created any job postings yet.</p>
          <Link href="/employer/jobs/create">
            <Button>Create Your First Job</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Title</th>
                <th scope="col" className="px-6 py-3">Company</th>
                <th scope="col" className="px-6 py-3">Location</th>
                <th scope="col" className="px-6 py-3">Deadline</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Applications</th>
                <th scope="col" className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    <Link href={`/employer/jobs/${job.id}/applications`} className="text-blue-600 hover:underline">
                      {job.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">{job.company}</td>
                  <td className="px-6 py-4">{job.location}</td>
                  <td className="px-6 py-4">{new Date(job.deadline).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold leading-tight ${job.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'
                      }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/employer/jobs/${job.id}/applications`} className="text-blue-600 hover:underline">
                      {job.applications} {job.applications === 1 ? 'application' : 'applications'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-center space-x-2">
                    <Link href={`/employer/jobs/${job.id}/edit`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    {job.status === 'ACTIVE' ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleStatusChange(job.id, 'INACTIVE')}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleStatusChange(job.id, 'ACTIVE')}
                      >
                        Activate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
