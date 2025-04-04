'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function CertificateUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    if (!allowedTypes.includes(fileExtension)) {
      setError('Invalid file type. Please upload a PDF, JPG, JPEG, or PNG file.');
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
    formData.append('type', 'certificate');

    try {
      const response = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload certificate');
      }

      setSuccess('GiatMARA Skills Certificate uploaded successfully!');
      
      // Wait a moment before redirecting
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload certificate');
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
          <h2 className="text-xl font-semibold text-gray-900">
            Please upload your GiatMARA Skills Certificate
          </h2>
          
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-4">
              Upload a clear, legible copy of your official GiatMARA Skills Certificate. 
              This document is required to verify your training and qualifications.
            </p>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Example:</h3>
              <div className="mx-auto w-full max-w-md rounded-lg border border-gray-200 overflow-hidden">
                <Image 
                  src="/certificate-example.jpg" 
                  alt="Certificate Example"
                  width={500}
                  height={350}
                  className="w-full h-auto"
                />
              </div>
            </div>
            
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
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={uploading}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                PDF, JPG, JPEG, or PNG up to 5MB
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