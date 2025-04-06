'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/app/lib/session'; // Keep this import path
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';

type ApplicationDetail = {
  id: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  applicant: {
    name: string;
    email: string;
    phone?: string | null;
    mbtiType?: string | null;
    resumeUrl?: string | null;
    certificateUrl?: string | null;
  };
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
  };
};

export default function ApplicationDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params?.id as string;
  const { user, loading: sessionLoading } = useSession();

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch application details
  useEffect(() => {
    if (sessionLoading || !applicationId) {
      // Wait for session and ID
      return;
    }

    if (!user) {
      // If session loaded but no user, redirect
      router.push('/login');
      return;
    }

    if (user.role !== 'EMPLOYER') {
      // If user is not employer, redirect
      router.push('/dashboard');
      return;
    }


    async function fetchApplication() {
      // Only set loading true when actually fetching
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/employer/applications/${applicationId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
          setError(errorData.error || `Failed to load application details (${response.status})`);
          if (response.status === 401 || response.status === 403) {
            // Optionally redirect or just show error
            // router.push('/login');
          }
          console.error('API Error:', errorData);
        } else {
          const data = await response.json();
          if (data.application) {
            setApplication(data.application);
          } else {
            setError('Application data not found in response.');
          }
        }
      } catch (err) {
        console.error('Error fetching application details:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchApplication();
  }, [applicationId, user, sessionLoading, router]); // router added as dependency


  // Function to update status (similar to the list page, but updates local state here)
  const handleStatusUpdate = async (newStatus: string) => {
    if (!application) return;
    setIsUpdating(true);
    setError(''); // Clear previous errors
    console.log(`Updating status for ${applicationId} to ${newStatus}`);
    try {
      const response = await fetch(`/api/employer/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Data:', errorData);
        throw new Error(errorData.error || `Failed to update status (${response.status})`);
      }

      const updatedData = await response.json();
      // Update local state for this specific application
      setApplication(prev => prev ? { ...prev, status: updatedData.application.status, updatedAt: updatedData.application.updatedAt } : null);
      console.log(`Successfully updated status for ${applicationId}`);
    } catch (error) {
      console.error('Error updating status:', error);
      setError(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsUpdating(false);
    }
  };


  // --- Render Logic ---

  if (sessionLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center mb-4">Loading application details...</div>
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If useEffect handled redirection, this might not be strictly needed, but good for clarity
  if (!user || user.role !== 'EMPLOYER') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Access Denied or Redirecting...</p>
      </div>
    );
  }


  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          {/* Make back link dynamic or more generic */}
          <Button variant="link" onClick={() => router.back()} className="p-0 h-auto">
            ← Back
          </Button>
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  if (!application) {
    // This case might be hit if fetch succeeded but returned no application
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Application not found.</p>
        <Link href="/employer/jobs">
          <Button variant="link">Go to Jobs</Button>
        </Link>
      </div>
    );
  }

  // Status options for the dropdown/buttons
  const statusOptions = ['PENDING', 'INTERVIEWING', 'ACCEPTED', 'REJECTED'];

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Back Link */}
      <div className="mb-4">
        <Link href={`/employer/jobs/${application.job.id}/applications`} className="text-blue-600 hover:underline">
          ← Back to Applications for "{application.job.title}"
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Application Details</h1>
          <p className="text-muted-foreground">
            Applied on: {new Date(application.createdAt).toLocaleDateString()}
          </p>
        </div>
        {/* Status Change Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium mr-2">Change Status:</span>
          {statusOptions.map(status => (
            <Button
              key={status}
              variant={application.status === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusUpdate(status)}
              disabled={isUpdating || application.status === status}
              className={`
                ${application.status === status ? 'ring-2 ring-offset-1' : ''}
                ${status === 'PENDING' ? 'border-yellow-300 text-yellow-800 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-900/50' : ''}
                ${status === 'INTERVIEWING' ? 'border-blue-300 text-blue-800 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/50' : ''}
                ${status === 'ACCEPTED' ? 'border-green-300 text-green-800 hover:bg-green-50 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/50' : ''}
                ${status === 'REJECTED' ? 'border-red-300 text-red-800 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/50' : ''}
                ${application.status === status && status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-800/50 ring-yellow-400' : ''}
                ${application.status === status && status === 'INTERVIEWING' ? 'bg-blue-100 dark:bg-blue-800/50 ring-blue-400' : ''}
                ${application.status === status && status === 'ACCEPTED' ? 'bg-green-100 dark:bg-green-800/50 ring-green-400' : ''}
                ${application.status === status && status === 'REJECTED' ? 'bg-red-100 dark:bg-red-800/50 ring-red-400' : ''}
              `}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </Button>
          ))}
          {isUpdating && <span className="text-sm text-muted-foreground ml-2">Updating...</span>}
        </div>
      </div>

      {/* Error display for status update */}
      {error && !isLoading && ( // Only show update errors after initial load
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Applicant & Job Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Applicant Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Name:</strong> {application.applicant.name}</p>
              <p><strong>Email:</strong> <a href={`mailto:${application.applicant.email}`} className="text-blue-600 hover:underline">{application.applicant.email}</a></p>
              <p><strong>Phone:</strong> {application.applicant.phone || 'Not Provided'}</p>
              <p><strong>MBTI Type:</strong> {application.applicant.mbtiType || 'Not Completed'}</p>
              <p><strong>Current Status:</strong>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${application.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  application.status === 'INTERVIEWING' ? 'bg-blue-100 text-blue-800' :
                    application.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                  }`}>
                  {application.status}
                </span>
              </p>
              <p className="text-sm text-muted-foreground pt-2">Last Updated: {new Date(application.updatedAt).toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Position:</strong> {application.job.title}</p>
              <p><strong>Company:</strong> {application.job.company}</p>
              <p><strong>Location:</strong> {application.job.location}</p>
              <Link href={`/jobs/${application.job.id}`} target="_blank" rel="noopener noreferrer">
                <Button variant="link" className="p-0 h-auto mt-4">View Original Job Posting</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Documents & Notes */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {application.applicant.resumeUrl ? (
                <a href={application.applicant.resumeUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full">View Resume</Button>
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">No Resume Uploaded</p>
              )}
              {application.applicant.certificateUrl ? (
                <a href={application.applicant.certificateUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full">View Certificate</Button>
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">No Certificate Uploaded</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
              <CardDescription>Visible only to employers.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add a textarea here if you want employers to add notes */}
              {application.notes ? (
                <p className="text-sm bg-gray-50 p-3 rounded border">{application.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No notes added yet.</p>
              )}
              {/* Example Textarea (uncomment to enable adding notes)
              <textarea
                className="mt-4 w-full p-2 border rounded text-sm"
                rows={3}
                placeholder="Add internal notes here..."
                // Add state and onChange handler if needed
              ></textarea>
              <Button size="sm" className="mt-2">Save Note</Button>
              */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
