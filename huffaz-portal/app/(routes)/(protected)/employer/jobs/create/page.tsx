'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { useSession } from '@/app/lib/session'; // Import useSession

export default function CreateJob() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession(); // Use the session hook
  // const [user, setUser] = useState(null); // Remove this state
  // const [loading, setLoading] = useState(true); // Use sessionLoading instead
  const [submitting, setSubmitting] = useState(false);
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
    mbtiTypes: '',
    deadline: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if session is loaded but no user or user is not an employer
    if (!sessionLoading) {
      if (!user) {
        console.log('CreateJob: No user, redirecting to login.');
        router.push('/login');
      } else if (user.role !== 'EMPLOYER') {
        console.log('CreateJob: User is not employer, redirecting to dashboard.');
        router.push('/dashboard');
      }
    }
  }, [user, sessionLoading, router]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/employer/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include' // Ensure credentials (cookie) are sent
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create job');
      }

      // Redirect to jobs page on success
      router.push('/employer/jobs');
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to create job:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionLoading) { // Use sessionLoading for the loading state
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If the user is loaded but not an employer, this component shouldn't render anything
  // as the useEffect will handle the redirect. You could optionally show a message.
  if (!user || user.role !== 'EMPLOYER') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Redirecting...</p>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Job</h1>

      {error && (
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
            {submitting ? 'Creating...' : 'Create Job'}
          </Button>
        </div>
      </form>
    </div>
  );
}
