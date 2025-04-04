'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

interface Application {
  id: string;
  status: string;
  notes: string | null;
  jobPosting: {
    title: string;
    company: string;
  };
  createdAt: string;
}

interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  mbtiTypes: string | null;
}

interface Profile {
  resumeUrl: string | null;
  certificateUrl: string | null;
}

interface User {
  role: string;
}

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [recentJobs, setRecentJobs] = useState<JobPosting[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const justApplied = searchParams?.get('applied') === 'true';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [applicationsRes, jobsRes, profileRes] = await Promise.all([
          fetch('/api/applications/my'),
          fetch('/api/jobs/recent'),
          fetch('/api/profile')
        ]);

        if (applicationsRes.ok && jobsRes.ok && profileRes.ok) {
          const [applicationsData, jobsData, profileData] = await Promise.all([
            applicationsRes.json(),
            jobsRes.json(),
            profileRes.json()
          ]);

          setApplications(applicationsData.applications);
          setRecentJobs(jobsData.jobs);
          setProfile(profileData.profile);
          setUser(profileData.user);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleCancel = async (applicationId: string) => {
    if (confirm('Are you sure you want to cancel this application?')) {
      try {
        setCancelling(applicationId);
        const response = await fetch('/api/applications/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ applicationId }),
        });

        if (response.ok) {
          // Remove the application from the list
          setApplications(applications.filter(app => app.id !== applicationId));
        } else {
          const data = await response.json();
          alert(data.error || 'Failed to cancel application');
        }
      } catch (error) {
        console.error('Error cancelling application:', error);
        alert('Failed to cancel application');
      } finally {
        setCancelling(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  const hasDocuments = profile?.resumeUrl && profile?.certificateUrl;

  return (
    <div className="space-y-6">
      {justApplied && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Your application has been submitted successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Dashboard
          </h2>
        </div>
        {user?.role === 'ADMIN' && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              href="/dashboard/admin"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Admin Dashboard
            </Link>
          </div>
        )}
      </div>

      {!hasDocuments && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Required Documents Missing</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Before applying for jobs, you must upload the following documents:
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {!profile?.resumeUrl && (
                    <li>
                      <Link href="/documents/resume-upload" className="font-medium text-yellow-800 underline">
                        Resume
                      </Link>
                    </li>
                  )}
                  {!profile?.certificateUrl && (
                    <li>
                      <Link href="/documents/certificate-upload" className="font-medium text-yellow-800 underline">
                        GiatMARA Skills Certificate
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Recent Applications */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Recent Applications
            </h3>
            <div className="mt-4 divide-y divide-gray-200">
              {applications.length > 0 ? (
                applications.map((application) => (
                  <div key={application.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {application.jobPosting.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {application.jobPosting.company}
                        </p>
                        {application.notes && (
                          <div className="mt-1 bg-gray-50 p-2 rounded-md">
                            <p className="text-xs text-gray-600">
                              <span className="font-semibold">Note from admin:</span> {application.notes}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          application.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : application.status === 'ACCEPTED'
                            ? 'bg-green-100 text-green-800'
                            : application.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {application.status.charAt(0) + application.status.slice(1).toLowerCase()}
                        </span>
                        {application.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancel(application.id)}
                            disabled={cancelling === application.id}
                            className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                          >
                            {cancelling === application.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-4 text-sm text-gray-500">
                  No applications yet.{' '}
                  {hasDocuments ? (
                    <Link href="/jobs" className="text-indigo-600 hover:text-indigo-500">
                      Browse jobs
                    </Link>
                  ) : (
                    <span>Complete your document uploads to apply for jobs.</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Job Postings */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Recent Job Postings
            </h3>
            <div className="mt-4 divide-y divide-gray-200">
              {recentJobs.map((job) => (
                <div key={job.id} className="py-4">
                  <Link href={`/jobs/${job.id}`} className="block hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{job.title}</p>
                      <p className="text-sm text-gray-500">{job.company}</p>
                      <p className="mt-1 text-sm text-gray-500">{job.location}</p>
                      {job.mbtiTypes && (
                        <div className="mt-1">
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            MBTI: {job.mbtiTypes}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Documents Status */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Required Documents
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="border border-gray-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Resume</h4>
                  <p className="text-sm text-gray-500 mt-1">Your professional resume</p>
                </div>
                {profile?.resumeUrl ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Uploaded
                  </span>
                ) : (
                  <Link href="/documents/resume-upload" className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                    Upload Now
                  </Link>
                )}
              </div>
              {profile?.resumeUrl && (
                <div className="mt-3 flex items-center">
                  <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:text-indigo-500">
                    View Resume
                  </a>
                  <Link href="/documents/resume-upload" className="ml-4 text-sm text-gray-500 hover:text-gray-700">
                    Update
                  </Link>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">GiatMARA Skills Certificate</h4>
                  <p className="text-sm text-gray-500 mt-1">Your training certificate</p>
                </div>
                {profile?.certificateUrl ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Uploaded
                  </span>
                ) : (
                  <Link href="/documents/certificate-upload" className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                    Upload Now
                  </Link>
                )}
              </div>
              {profile?.certificateUrl && (
                <div className="mt-3 flex items-center">
                  <a href={profile.certificateUrl} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:text-indigo-500">
                    View Certificate
                  </a>
                  <Link href="/documents/certificate-upload" className="ml-4 text-sm text-gray-500 hover:text-gray-700">
                    Update
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 