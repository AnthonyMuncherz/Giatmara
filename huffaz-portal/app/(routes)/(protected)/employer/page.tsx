'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { useSession } from '@/app/lib/session'; // Import useSession

export default function EmployerDashboard() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession(); // Use session hook
  // const [user, setUser] = useState(null); // Remove this
  // const [loading, setLoading] = useState(true); // Use sessionLoading
  const [jobCount, setJobCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true); // Separate loading for stats
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect logic based on session
    if (!sessionLoading) {
      if (!user) {
        console.log('EmployerDashboard: No user, redirecting to login.');
        router.push('/login');
      } else if (user.role !== 'EMPLOYER') {
        console.log('EmployerDashboard: User is not employer, redirecting to dashboard.');
        router.push('/dashboard');
      } else {
        // User is authenticated employer, fetch stats
        console.log('EmployerDashboard: User authenticated, fetching stats.');
        fetchStats();
      }
    }
  }, [user, sessionLoading, router]);

  // Fetch stats function
  const fetchStats = async () => {
    setStatsLoading(true);
    setError('');
    try {
      const [jobsRes, applicationsRes] = await Promise.all([
        fetch('/api/employer/jobs/count', { credentials: 'include' }),
        fetch('/api/employer/applications/count', { credentials: 'include' })
      ]);

      let jobFetchError = false;
      let appFetchError = false;

      if (jobsRes.ok) {
        const jobData = await jobsRes.json();
        setJobCount(jobData.count);
      } else {
        jobFetchError = true;
        console.error('Failed to fetch job count:', jobsRes.status);
      }

      if (applicationsRes.ok) {
        const appData = await applicationsRes.json();
        setApplicationCount(appData.count);
      } else {
        appFetchError = true;
        console.error('Failed to fetch application count:', applicationsRes.status);
      }

      if (jobFetchError || appFetchError) {
        if (jobsRes.status === 401 || applicationsRes.status === 401 || jobsRes.status === 403 || applicationsRes.status === 403) {
          router.push('/login'); // Redirect if unauthorized
        } else {
          setError('Failed to load dashboard data. Please refresh.');
        }
      }

    } catch (err) {
      console.error('Error fetching counts:', err);
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setStatsLoading(false);
    }
  };


  // Combined loading state
  if (sessionLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <p>Loading dashboard...</p>
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
      <h1 className="text-3xl font-bold mb-8">Employer Dashboard</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Postings</CardTitle>
            <CardDescription>Manage your active job listings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{jobCount}</p>
            <p className="text-sm text-muted-foreground">Active job postings</p>
          </CardContent>
          <CardFooter>
            <Link href="/employer/jobs" className="w-full">
              <Button className="w-full">View Job Listings</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>Review pending applications</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{applicationCount}</p>
            <p className="text-sm text-muted-foreground">Pending applications</p>
          </CardContent>
          <CardFooter>
            {/* Link to the main applications list page */}
            <Link href="/employer/jobs" className="w-full">
              <Button className="w-full">Review Applications</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Job</CardTitle>
            <CardDescription>Post a new job opportunity</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create a new job posting for students to apply to.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/employer/jobs/create" className="w-full">
              <Button className="w-full">Create New Job</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
