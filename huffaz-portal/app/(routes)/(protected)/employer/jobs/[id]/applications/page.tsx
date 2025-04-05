'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/app/lib/session';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';

interface Application {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  studentName: string;
  studentEmail: string;
  resumeUrl?: string;
}

interface JobInfo {
  id: string;
  title: string;
  company: string;
}

export default function JobApplications() {
  const { session, loading } = useSession();
  const params = useParams();
  const router = useRouter();
  const jobId = params.id;
  
  const [jobInfo, setJobInfo] = useState<JobInfo | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if not logged in or not an employer
    if (!loading && (!session || session.role !== 'EMPLOYER')) {
      router.push('/dashboard');
    }
    
    // Fetch job info and applications
    if (session && jobId) {
      fetchJobInfo();
      fetchApplications();
    }
  }, [session, loading, router, jobId]);

  const fetchJobInfo = async () => {
    try {
      const response = await fetch(`/api/employer/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setJobInfo(data.job);
      } else {
        setError('Failed to load job information');
      }
    } catch (error) {
      console.error('Error fetching job info:', error);
      setError('Error loading job information');
    }
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/employer/jobs/${jobId}/applications`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      } else {
        setError('Failed to load applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Error loading applications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/employer/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        // Refresh the applications list
        fetchApplications();
      } else {
        setError('Failed to update application status');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      setError('Error updating application status');
    }
  };

  if (loading || isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/employer/jobs" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Jobs
        </Link>
        
        {jobInfo ? (
          <h1 className="text-3xl font-bold">
            Applications for {jobInfo.title} at {jobInfo.company}
          </h1>
        ) : (
          <h1 className="text-3xl font-bold">Job Applications</h1>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {applications.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-lg">No applications yet for this job posting.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="text-left p-4">Applicant</th>
                <th className="text-left p-4">Applied On</th>
                <th className="text-left p-4">Resume</th>
                <th className="text-left p-4">Status</th>
                <th className="text-center p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium">{app.studentName}</div>
                    <div className="text-sm text-gray-600">{app.studentEmail}</div>
                  </td>
                  <td className="p-4">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    {app.resumeUrl ? (
                      <a 
                        href={app.resumeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Resume
                      </a>
                    ) : (
                      <span className="text-gray-400">No Resume</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                      app.status === 'INTERVIEWING' ? 'bg-blue-100 text-blue-800' : 
                      app.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center space-x-2">
                      <div className="relative group">
                        <Button variant="outline" size="sm">
                          Change Status
                        </Button>
                        <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded hidden group-hover:block z-10">
                          <ul className="py-1">
                            <li>
                              <button
                                onClick={() => handleStatusUpdate(app.id, 'PENDING')}
                                className="block px-4 py-2 text-sm text-left w-full hover:bg-gray-100"
                              >
                                Pending
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => handleStatusUpdate(app.id, 'INTERVIEWING')}
                                className="block px-4 py-2 text-sm text-left w-full hover:bg-gray-100"
                              >
                                Interviewing
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => handleStatusUpdate(app.id, 'ACCEPTED')}
                                className="block px-4 py-2 text-sm text-left w-full hover:bg-gray-100"
                              >
                                Accepted
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => handleStatusUpdate(app.id, 'REJECTED')}
                                className="block px-4 py-2 text-sm text-left w-full hover:bg-gray-100"
                              >
                                Rejected
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <Link href={`/employer/applications/${app.id}`}>
                        <Button variant="default" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
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