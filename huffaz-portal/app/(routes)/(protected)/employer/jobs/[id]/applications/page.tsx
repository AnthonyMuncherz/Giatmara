'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/app/lib/session';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';

// Simple types for our data
type Application = {
  id: string;
  status: string;
  createdAt: string;
  studentName: string;
  studentEmail: string;
  resumeUrl?: string;
};

type JobInfo = {
  id: string;
  title: string;
  company: string;
};

export default function JobApplications() {
  // Basic state - keep it minimal
  const [job, setJob] = useState<JobInfo | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRefreshButton, setShowRefreshButton] = useState(false);

  // Hooks
  const { user, loading: sessionLoading } = useSession();
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  // Setup timer for showing refresh button
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowRefreshButton(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Load data on mount
  useEffect(() => {
    // Skip if session is still loading
    if (sessionLoading) {
      return;
    }

    // Function to load all data
    async function loadData() {
      try {
        setIsLoading(true);
        setError('');

        // Verify auth first - but don't redirect immediately
        if (!user) {
          setError('Please log in to view this page');
          setIsLoading(false);
          return;
        }

        if (user.role !== 'EMPLOYER') {
          setError('Only employers can access this page');
          setIsLoading(false);
          return;
        }

        // Now load job info with credentials
        const jobResponse = await fetch(`/api/employer/jobs/${jobId}`, {
          credentials: 'include' // Added credentials here
        });

        if (!jobResponse.ok) {
          if (jobResponse.status === 401 || jobResponse.status === 403) {
            setError('Your session has expired or you lack permission. Please log in again.'); // Updated error message
            setIsLoading(false);
            return;
          }
          throw new Error('Failed to load job information');
        }

        const jobData = await jobResponse.json();

        if (!jobData.job) {
          throw new Error('Job not found');
        }

        setJob({
          id: jobData.job.id,
          title: jobData.job.title || 'Untitled Job',
          company: jobData.job.company || 'Unknown Company'
        });

        // Then load applications with credentials
        const applicationsResponse = await fetch(`/api/employer/jobs/${jobId}/applications`, {
          credentials: 'include' // Added credentials here
        });

        if (!applicationsResponse.ok) {
          if (applicationsResponse.status === 401 || applicationsResponse.status === 403) {
            setError('Your session has expired or you lack permission. Please log in again.'); // Updated error message
            setIsLoading(false);
            return;
          }
          throw new Error('Failed to load applications');
        }

        const applicationsData = await applicationsResponse.json();

        if (Array.isArray(applicationsData.applications)) {
          setApplications(applicationsData.applications.map((app: any) => ({
            id: app.id || '',
            status: app.status || 'PENDING',
            createdAt: app.createdAt || new Date().toISOString(),
            studentName: app.studentName || 'Unknown Student',
            studentEmail: app.studentEmail || 'No Email',
            resumeUrl: app.resumeUrl
          })));
        } else {
          setApplications([]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [jobId, user, router, sessionLoading]); // Removed router from dependencies as it wasn't used directly in loadData

  // Show loading state while session is loading
  if (sessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center mb-4">Loading user session...</div>
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Function to update application status
  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    console.log(`Updating status for ${applicationId} to ${newStatus}`); // Add log
    try {
      const response = await fetch(`/api/employer/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include' // <<<--- ADD THIS LINE
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Data:', errorData); // Add log
        throw new Error(errorData.error || `Failed to update status (${response.status})`);
      }

      // Update local state
      setApplications(prevApps =>
        prevApps.map(app =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      console.log(`Successfully updated status for ${applicationId}`); // Add log
    } catch (error) {
      console.error('Error updating status:', error); // Keep this log
      alert(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center mb-4">Loading applications...</div> {/* Updated text */}
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>

        {showRefreshButton && (
          <Button
            variant="default"
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Refresh Page
          </Button>
        )}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href="/employer/jobs" className="text-blue-600 hover:underline">
            ← Back to Jobs
          </Link>
        </div>

        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>

        <div className="flex space-x-3">
          <Button
            variant="default"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push('/employer/jobs')}
          >
            Return to Jobs
          </Button>
        </div>
      </div>
    );
  }

  // Render applications list
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/employer/jobs" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Jobs
        </Link>

        <h1 className="text-3xl font-bold mt-2">
          {job ? `Applications for ${job.title}` : 'Job Applications'}
        </h1>
        {job && <p className="text-muted-foreground">{job.company}</p>}
      </div>

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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ // Added font-medium
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
                      {/* --- View Details Button --- */}
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
