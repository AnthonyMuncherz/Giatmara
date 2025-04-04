'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ResumeUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    if (!allowedTypes.includes(fileExtension)) {
      setError('Invalid file type. Please upload a PDF, DOC, or DOCX file.');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum size is 5MB.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'resume');

    try {
      const response = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload resume');
      }

      setSuccess('Resume uploaded successfully!');
      
      // Wait a moment before redirecting
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 sm:px-6 py-5">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
          >
            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="px-4 sm:px-6 py-5 border-t border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Please upload your resume</h2>
          
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-6">
              A resume should include the following elements:
            </p>
            
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 mb-6">
              <li>
                <strong>Contact information:</strong> Your name, phone number, email address, and location.
                You can also include your LinkedIn profile or social media handles.
              </li>
              <li>
                <strong>Objective:</strong> A brief summary of your job search goals.
              </li>
              <li>
                <strong>Work experience:</strong> Include the company name, dates of employment, job title, and
                a description of your responsibilities. Highlight your achievements and
                contributions.
              </li>
              <li>
                <strong>Education:</strong> Include your college degree, certifications, or licenses.
              </li>
              <li>
                <strong>Skills:</strong> List your hard, soft, and technical skills, and tailor them to the job
                description.
              </li>
            </ul>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="mt-1 flex justify-center">
                <label 
                  htmlFor="file-upload" 
                  className={`relative cursor-pointer rounded-md font-medium ${
                    uploading ? 'text-gray-500' : 'text-indigo-600 hover:text-indigo-500'
                  }`}
                >
                  <span>
                    {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                  </span>
                  <input 
                    id="file-upload" 
                    name="file-upload" 
                    type="file" 
                    className="sr-only" 
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx"
                    disabled={uploading}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                PDF, DOC, or DOCX up to 5MB
              </p>
              {error && (
                <div className="mt-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              {success && (
                <div className="mt-3 text-sm text-green-600">
                  {success}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 