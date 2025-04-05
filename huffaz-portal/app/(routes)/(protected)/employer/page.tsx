'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';

export default function EmployerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobCount, setJobCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [error, setError] = useState('');

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
        
        // Get job count and application count in parallel
        try {
          const [jobsRes, applicationsRes] = await Promise.all([
            fetch('/api/employer/jobs/count'),
            fetch('/api/employer/applications/count')
          ]);
          
          if (jobsRes.ok) {
            const jobData = await jobsRes.json();
            setJobCount(jobData.count);
          }
          
          if (applicationsRes.ok) {
            const appData = await applicationsRes.json();
            setApplicationCount(appData.count);
          }
        } catch (err) {
          console.error('Error fetching counts:', err);
          setError('Failed to load some data. Please refresh.');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <p>Loading dashboard...</p>
        </div>
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
            <CardDescription>Manage your job listings</CardDescription>
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
            <CardDescription>Review applications from students</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{applicationCount}</p>
            <p className="text-sm text-muted-foreground">Pending applications</p>
          </CardContent>
          <CardFooter>
            <Link href="/employer/applications" className="w-full">
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