'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string | null;
  description: string;
  requirements: string;
  responsibilities: string | null;
  benefits: string | null;
  employmentType: string | null;
  mbtiTypes: string | null;
  deadline: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function JobDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setJob(data.job);
        } else {
          throw new Error('Job not found');
        }
      } catch (error) {
        console.error('Error fetching job:', error);
        router.push('/jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [params.id, router]);

  const handleApply = async () => {
    try {
      setApplying(true);
      setError('');

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobPostingId: params.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if this is a missing documents error
        if (data.code === 'MISSING_DOCUMENTS') {
          // Redirect to the first missing document upload page
          if (data.missingDocuments.includes('resume')) {
            router.push('/documents/resume-upload');
            return;
          } else if (data.missingDocuments.includes('GiatMARA Skills Certificate')) {
            router.push('/documents/certificate-upload');
            return;
          }
        }
        throw new Error(data.error || 'Failed to apply');
      }

      router.push('/dashboard?applied=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-2xl font-bold leading-6 text-gray-900">
            {job.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-sm text-gray-500">
              {job.company} • {job.location}
            </p>
            {job.employmentType && (
              <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                {job.employmentType}
              </span>
            )}
          </div>
          {job.salary && (
            <p className="mt-1 text-sm text-gray-500">
              Salary: {job.salary}
            </p>
          )}
          {job.mbtiTypes && (
            <div className="mt-2">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                Preferred MBTI: {job.mbtiTypes}
              </span>
            </div>
          )}
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                {job.description}
              </dd>
            </div>
            
            {job.responsibilities && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Responsibilities</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <ul className="list-disc pl-5 space-y-1">
                    {job.responsibilities.split('\n').map((item, index) => (
                      item.trim() && (
                        <li key={index} className="text-sm text-gray-900">
                          {item.trim()}
                        </li>
                      )
                    ))}
                  </ul>
                </dd>
              </div>
            )}
            
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Requirements</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                {job.requirements}
              </dd>
            </div>
            
            {job.benefits && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Benefits</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <ul className="list-disc pl-5 space-y-1">
                    {job.benefits.split('\n').map((item, index) => (
                      item.trim() && (
                        <li key={index} className="text-sm text-gray-900">
                          {item.trim()}
                        </li>
                      )
                    ))}
                  </ul>
                </dd>
              </div>
            )}
            
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Application Deadline</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(job.deadline).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          {error && (
            <div className="mb-4 text-sm text-red-600">
              {error}
            </div>
          )}
          <button
            onClick={handleApply}
            disabled={applying}
            className="w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {applying ? 'Applying...' : 'Apply for this position'}
          </button>
        </div>
      </div>
    </div>
  );
} 