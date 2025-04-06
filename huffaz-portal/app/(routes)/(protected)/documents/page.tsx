'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/app/lib/session';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { CheckCircleIcon, XCircleIcon, ArrowUpTrayIcon, EyeIcon } from '@heroicons/react/24/outline'; // Import icons

interface Profile {
  resumeUrl: string | null;
  certificateUrl: string | null;
}

export default function DocumentsPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

    const fetchProfile = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch('/api/profile', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Failed to load profile data' }));
          setError(errorData.error || 'Failed to load profile data');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('An error occurred while fetching profile data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, sessionLoading, router]);

  if (sessionLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-muted-foreground">Loading document status...</p>
      </div>
    );
  }

  // Ensure rendering stops if user is not a student (redirect should handle it)
  if (!user || user.role !== 'STUDENT') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Documents</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resume Card */}
        <Card>
          <CardHeader>
            <CardTitle>Resume / CV</CardTitle>
            <CardDescription>Your professional resume detailing your experience and skills.</CardDescription>
          </CardHeader>
          <CardContent>
            {profile?.resumeUrl ? (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span>Resume Uploaded</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600 dark:text-red-400">
                <XCircleIcon className="h-5 w-5 mr-2" />
                <span>Resume Not Uploaded</span>
              </div>
            )}
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Link href="/documents/resume-upload" legacyBehavior>
                <Button variant="default" className="w-full sm:w-auto">
                  <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                  {profile?.resumeUrl ? 'Update Resume' : 'Upload Resume'}
                </Button>
              </Link>
              {profile?.resumeUrl && (
                <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <EyeIcon className="h-4 w-4 mr-2" />
                    View Current
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Certificate Card */}
        <Card>
          <CardHeader>
            <CardTitle>GiatMARA Skills Certificate</CardTitle>
            <CardDescription>Your official certificate verifying your GiatMARA training.</CardDescription>
          </CardHeader>
          <CardContent>
            {profile?.certificateUrl ? (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span>Certificate Uploaded</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600 dark:text-red-400">
                <XCircleIcon className="h-5 w-5 mr-2" />
                <span>Certificate Not Uploaded</span>
              </div>
            )}
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Link href="/documents/certificate-upload" legacyBehavior>
                <Button variant="default" className="w-full sm:w-auto">
                  <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                  {profile?.certificateUrl ? 'Update Certificate' : 'Upload Certificate'}
                </Button>
              </Link>
              {profile?.certificateUrl && (
                <a href={profile.certificateUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <EyeIcon className="h-4 w-4 mr-2" />
                    View Current
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Note:</strong> Both your Resume and GiatMARA Skills Certificate must be uploaded before you can apply for any job postings.
        </p>
      </div>
    </div>
  );
}