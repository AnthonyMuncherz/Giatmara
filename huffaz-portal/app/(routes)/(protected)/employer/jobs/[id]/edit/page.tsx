'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { useSession } from '@/app/lib/session'; // Keep this import path

export default function EditJob() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;
  const { user, loading: sessionLoading } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    employmentType: '',
    mbtiTypes: '', // Store as string
    deadline: ''
  });

  // Fetch job data when component mounts
  useEffect(() => {
    if (sessionLoading || !jobId) return; // Wait for session and jobId

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'EMPLOYER') {
      router.push('/dashboard');
      return;
    }

    async function fetchJobDetails() {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/employer/jobs/${jobId}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `Failed to fetch job details (${response.status})` }));
          setError(errorData.error || `Failed to fetch job details (${response.status})`);
          if (response.status === 401 || response.status === 403) {
            router.push('/login'); // Or show error
          }
          console.error('API Error:', errorData);
          return; // Stop execution on error
        }

        const data = await response.json();

        if (!data.job) {
          setError('Job not found');
          return; // Stop execution if job not found
        }

        // Format deadline date (ISO string to YYYY-MM-DD)
        let formattedDeadline = '';
        if (data.job.deadline) {
          try {
            formattedDeadline = new Date(data.job.deadline).toISOString().split('T')[0];
          } catch (dateError) {
            console.error("Error formatting deadline:", dateError);
            // Keep it empty or use original string if formatting fails
            formattedDeadline = data.job.deadline;
          }
        }

        // Ensure mbtiTypes is stored as a string
        let mbtiTypesString = data.job.mbtiTypes || '';
        if (Array.isArray(mbtiTypesString)) { // Handle case where API might mistakenly return array
          mbtiTypesString = mbtiTypesString.join(', ');
        }


        setFormData({
          title: data.job.title || '',
          company: data.job.company || '',
          location: data.job.location || '',
          salary: data.job.salary || '',
          description: data.job.description || '',
          requirements: data.job.requirements || '',
          responsibilities: data.job.responsibilities || '',
          benefits: data.job.benefits || '',
          employmentType: data.job.employmentType || '',
          mbtiTypes: mbtiTypesString, // Store as string
          deadline: formattedDeadline
        });
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load job details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchJobDetails();
  }, [jobId, user, router, sessionLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // --- REMOVED THE ARRAY CONVERSION ---
      // const dataToSend: Record<string, any> = { ...formData };
      // if (dataToSend.mbtiTypes && typeof dataToSend.mbtiTypes === 'string') {
      //   dataToSend.mbtiTypes = dataToSend.mbtiTypes.split(',').map(type => type.trim());
      // }
      // --- END REMOVAL ---

      const response = await fetch(`/api/employer/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send formData directly, which contains mbtiTypes as a string
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to update job (${response.status})`);
      }

      // Redirect to jobs page on success
      router.push('/employer/jobs');
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to update job:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  // If the user is loaded but not an employer, or if there was an error loading
  if (!user || user.role !== 'EMPLOYER') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Access Denied or Redirecting...</p>
      </div>
    );
  }

  // Show error if loading finished but there was an error (and not submitting)
  if (error && !isLoading && !submitting) {
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
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/employer/jobs" className="text-blue-600 hover:underline">
          ← Back to Jobs
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Edit Job</h1>

      {error && ( // Show submission errors here
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium mb-1">
              Company <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label htmlFor="salary" className="block text-sm font-medium mb-1">
              Salary Range
            </label>
            <input
              type="text"
              id="salary"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              placeholder="e.g. $50,000 - $70,000"
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Job Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="w-full p-2 border rounded"
          ></textarea>
        </div>

        <div>
          <label htmlFor="requirements" className="block text-sm font-medium mb-1">
            Requirements <span className="text-red-500">*</span>
          </label>
          <textarea
            id="requirements"
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            required
            rows={4}
            placeholder="List job requirements, one per line"
            className="w-full p-2 border rounded"
          ></textarea>
        </div>

        <div>
          <label htmlFor="responsibilities" className="block text-sm font-medium mb-1">
            Responsibilities
          </label>
          <textarea
            id="responsibilities"
            name="responsibilities"
            value={formData.responsibilities}
            onChange={handleChange}
            rows={4}
            placeholder="List job responsibilities, one per line"
            className="w-full p-2 border rounded"
          ></textarea>
        </div>

        <div>
          <label htmlFor="benefits" className="block text-sm font-medium mb-1">
            Benefits
          </label>
          <textarea
            id="benefits"
            name="benefits"
            value={formData.benefits}
            onChange={handleChange}
            rows={3}
            placeholder="List job benefits, one per line"
            className="w-full p-2 border rounded"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="employmentType" className="block text-sm font-medium mb-1">
              Employment Type
            </label>
            <select
              id="employmentType"
              name="employmentType"
              value={formData.employmentType}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Select type</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
              <option value="Temporary">Temporary</option>
            </select>
          </div>

          <div>
            <label htmlFor="mbtiTypes" className="block text-sm font-medium mb-1">
              Preferred MBTI Types
            </label>
            <input
              type="text"
              id="mbtiTypes"
              name="mbtiTypes"
              value={formData.mbtiTypes}
              onChange={handleChange}
              placeholder="e.g. INTJ, ENFP, ISFJ (comma separated)"
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div>
          <label htmlFor="deadline" className="block text-sm font-medium mb-1">
            Application Deadline <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="deadline"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            required
            min={new Date().toISOString().split('T')[0]} // Prevent selecting past dates
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/employer/jobs')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Updating...' : 'Update Job'}
          </Button>
        </div>
      </form>
    </div>
  );
}
