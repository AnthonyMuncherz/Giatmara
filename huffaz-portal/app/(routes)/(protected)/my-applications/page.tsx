'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/app/lib/session';
import { Button } from '@/app/components/ui/button';

interface Application {
  id: string;
  status: 'PENDING' | 'REJECTED' | 'INTERVIEWING' | 'ACCEPTED';
  notes: string | null;
  jobPosting: {
    id: string; // Add jobPostingId for linking
    title: string;
    company: string;
  };
  createdAt: string;
}

export default function MyApplicationsPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading) return; // Wait for session

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'STUDENT') {
      router.push('/dashboard'); // Redirect non-students
      return;
    }

    const fetchApplications = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch('/api/applications/my', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          // Ensure jobPosting has an id
          const validApplications = data.applications.map((app: any) => ({
            ...app,
            jobPosting: {
              ...app.jobPosting,
              id: app.jobPostingId || app.jobPosting.id, // Ensure ID is present
            }
          }));
          setApplications(validApplications);
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Failed to load applications' }));
          setError(errorData.error || 'Failed to load applications');
        }
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('An error occurred while fetching applications.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [user, sessionLoading, router]);

  const handleCancel = async (applicationId: string) => {
    if (confirm('Are you sure you want to cancel this application?')) {
      setCancelling(applicationId);
      setError('');
      try {
        const response = await fetch('/api/applications/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ applicationId }),
          credentials: 'include',
        });

        if (response.ok) {
          setApplications(prevApps => prevApps.filter(app => app.id !== applicationId));
        } else {
          const data = await response.json();
          setError(data.error || 'Failed to cancel application');
        }
      } catch (err) {
        console.error('Error cancelling application:', err);
        setError('Failed to cancel application');
      } finally {
        setCancelling(null);
      }
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'INTERVIEWING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (sessionLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-muted-foreground">Loading your applications...</p>
      </div>
    );
  }

  // Ensure rendering stops if user is not a student (redirect should handle it)
  if (!user || user.role !== 'STUDENT') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Applications</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      {applications.length === 0 && !error ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-lg mb-4">You haven't applied to any jobs yet.</p>
          <Link href="/jobs">
            <Button>Browse Available Jobs</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <Link href={`/jobs/${app.jobPosting.id}`} className="text-lg font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 truncate">
                      {app.jobPosting.title}
                    </Link>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{app.jobPosting.company}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-2 sm:mt-0 flex-shrink-0">
                    <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium ${getStatusBadgeClass(app.status)}`}>
                      {app.status.charAt(0) + app.status.slice(1).toLowerCase()}
                    </span>
                    {app.status === 'PENDING' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancel(app.id)}
                        disabled={cancelling === app.id}
                      >
                        {cancelling === app.id ? 'Cancelling...' : 'Cancel'}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Applied on: {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                  {app.notes && (
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Note from Admin/Employer:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{app.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}