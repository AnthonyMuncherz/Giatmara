'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string | null;
  description: string;
  requirements: string;
  mbtiTypes: string | null;
  deadline: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mbtiFilter, setMbtiFilter] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs');
        if (response.ok) {
          const data = await response.json();
          setJobs(data.jobs);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchTerm === '' || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMbti = mbtiFilter === '' ||
      (job.mbtiTypes && job.mbtiTypes.includes(mbtiFilter.toUpperCase()));

    return matchesSearch && matchesMbti;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Available Jobs
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="search" className="sr-only">
            Search jobs
          </label>
          <input
            type="text"
            name="search"
            id="search"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="mbti" className="sr-only">
            Filter by MBTI
          </label>
          <input
            type="text"
            name="mbti"
            id="mbti"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Filter by MBTI (e.g., INTJ)"
            value={mbtiFilter}
            onChange={(e) => setMbtiFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <ul role="list" className="divide-y divide-gray-200">
          {filteredJobs.map((job) => (
            <li key={job.id}>
              <Link href={`/jobs/${job.id}`} className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="truncate">
                      <div className="flex text-sm">
                        <p className="font-medium text-indigo-600 truncate">{job.title}</p>
                        <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                          at {job.company}
                        </p>
                      </div>
                      <div className="mt-2 flex">
                        <div className="flex items-center text-sm text-gray-500">
                          <p>{job.location}</p>
                          {job.salary && (
                            <>
                              <span className="mx-1">•</span>
                              <p>{job.salary}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-2 flex flex-shrink-0">
                      {job.mbtiTypes && (
                        <p className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                          MBTI: {job.mbtiTypes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {job.requirements.split('\n')[0]}...
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        Deadline:{' '}
                        {new Date(job.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 