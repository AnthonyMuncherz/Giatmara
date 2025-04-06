'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/app/lib/session';
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
    if (sessionLoading || !user || !applicationId) {
      // Don't fetch if session is loading, user not logged in, or no ID yet
      if (!sessionLoading && !user) {
        setError('Please log in to view application details.');
        setIsLoading(false);
      }
      return;
    }

    async function fetchApplication() {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/employer/applications/${applicationId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setError('Unauthorized or Forbidden. You may not have permission to view this application.');
          } else if (response.status === 404) {
            setError('Application not found.');
          } else {
            setError(`Failed to load application details (${response.status})`);
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.application) {
          setApplication(data.application);
        } else {
          setError('Application data not found in response.');
        }
      } catch (err) {
        console.error('Error fetching application details:', err);
        if (!error) { // Avoid overwriting specific errors
          setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchApplication();
  }, [applicationId, user, sessionLoading, error]); // Added error to dependency array to prevent refetch loop on error

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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href={`/employer/jobs/${application?.job?.id}/applications`} className="text-blue-600 hover:underline">
            ← Back to Applications List
          </Link>
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
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </Button>
          ))}
          {isUpdating && <span className="text-sm text-muted-foreground ml-2">Updating...</span>}
        </div>
      </div>

      {/* Error display for status update */}
      {error && !isLoading && (
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
                <Button variant="link" className="p-0 h-auto">View Original Job Posting</Button>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
