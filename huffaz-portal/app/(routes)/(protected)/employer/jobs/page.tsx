'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';

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
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Check authentication and user role
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          console.error('Auth API error:', await res.text());
          router.push('/login');
          return;
        }

        const data = await res.json();
        if (!data.user || data.user.role !== 'EMPLOYER') {
          router.push('/dashboard');
          return;
        }
        
        setUser(data.user);
        
        // Fetch jobs once authenticated
        await fetchJobs();
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login');
      } finally {
        setAuthLoading(false);
      }
    }
    
    checkAuth();
  }, [router]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/employer/jobs');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      } else {
        console.error('Failed to fetch jobs:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/employer/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        // Refresh the jobs list
        fetchJobs();
      }
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <p>Loading job listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Job Postings</h1>
        <Link href="/employer/jobs/create">
          <Button>Create New Job</Button>
        </Link>
      </div>
      
      {jobs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg mb-4">You haven't created any job postings yet.</p>
          <Link href="/employer/jobs/create">
            <Button>Create Your First Job</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="text-left p-4">Title</th>
                <th className="text-left p-4">Company</th>
                <th className="text-left p-4">Location</th>
                <th className="text-left p-4">Deadline</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Applications</th>
                <th className="text-center p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <Link href={`/employer/jobs/${job.id}`} className="font-medium text-blue-600 hover:underline">
                      {job.title}
                    </Link>
                  </td>
                  <td className="p-4">{job.company}</td>
                  <td className="p-4">{job.location}</td>
                  <td className="p-4">{new Date(job.deadline).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      job.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link href={`/employer/jobs/${job.id}/applications`} className="text-blue-600 hover:underline">
                      {job.applications} {job.applications === 1 ? 'application' : 'applications'}
                    </Link>
                  </td>
                  <td className="p-4 flex justify-center space-x-2">
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