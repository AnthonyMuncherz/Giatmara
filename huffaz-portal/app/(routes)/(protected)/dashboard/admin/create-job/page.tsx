'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateJobPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    employmentType: 'Full-time',
    mbtiTypes: '',
    deadline: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Job created successfully, redirect to admin dashboard
        router.push('/dashboard/admin?success=job-created');
      } else {
        setError(data.error || 'Failed to create job');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error creating job:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Create New Job Posting
          </h2>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            type="button"
            onClick={() => router.push('/dashboard/admin')}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-lg">
        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">
                Job Title *
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium leading-6 text-gray-900">
                Company Name *
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="company"
                  id="company"
                  required
                  value={formData.company}
                  onChange={handleChange}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium leading-6 text-gray-900">
                Location *
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="location"
                  id="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="salary" className="block text-sm font-medium leading-6 text-gray-900">
                Salary Range
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="salary"
                  id="salary"
                  placeholder="e.g. RM 3,000 - RM 5,000"
                  value={formData.salary}
                  onChange={handleChange}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="employmentType" className="block text-sm font-medium leading-6 text-gray-900">
                Employment Type
              </label>
              <div className="mt-2">
                <select
                  id="employmentType"
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Temporary">Temporary</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="mbtiTypes" className="block text-sm font-medium leading-6 text-gray-900">
                Preferred MBTI Types
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="mbtiTypes"
                  id="mbtiTypes"
                  placeholder="e.g. INTJ,ENTJ,INFJ"
                  value={formData.mbtiTypes}
                  onChange={handleChange}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium leading-6 text-gray-900">
                Application Deadline *
              </label>
              <div className="mt-2">
                <input
                  type="date"
                  name="deadline"
                  id="deadline"
                  required
                  value={formData.deadline}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
                Job Description *
              </label>
              <div className="mt-2">
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  required
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="requirements" className="block text-sm font-medium leading-6 text-gray-900">
                Requirements *
              </label>
              <div className="mt-2">
                <textarea
                  id="requirements"
                  name="requirements"
                  rows={4}
                  required
                  value={formData.requirements}
                  onChange={handleChange}
                  placeholder="List required qualifications, skills, education, etc."
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="responsibilities" className="block text-sm font-medium leading-6 text-gray-900">
                Responsibilities
              </label>
              <div className="mt-2">
                <textarea
                  id="responsibilities"
                  name="responsibilities"
                  rows={4}
                  value={formData.responsibilities}
                  onChange={handleChange}
                  placeholder="List key job responsibilities (one per line)"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="benefits" className="block text-sm font-medium leading-6 text-gray-900">
                Benefits
              </label>
              <div className="mt-2">
                <textarea
                  id="benefits"
                  name="benefits"
                  rows={4}
                  value={formData.benefits}
                  onChange={handleChange}
                  placeholder="List benefits and perks (one per line)"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="ml-3 inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 