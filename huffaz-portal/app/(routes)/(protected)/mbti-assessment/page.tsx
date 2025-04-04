'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MBTIAssessment from '@/app/components/MBTIAssessment';

export default function MBTIAssessmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mbtiCompleted, setMbtiCompleted] = useState(false);

  useEffect(() => {
    const checkMbtiStatus = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          if (data.profile?.mbtiCompleted) {
            setMbtiCompleted(true);
            router.push('/dashboard');
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error checking MBTI status:', error);
        setLoading(false);
      }
    };

    checkMbtiStatus();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (mbtiCompleted) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">MBTI Personality Assessment</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="mb-4">
          Welcome to the MBTI (Myers-Briggs Type Indicator) assessment. This assessment will help you
          discover your personality type, which can be useful in finding jobs that match your natural
          preferences and strengths.
        </p>
        <p className="mb-6 text-indigo-600 font-medium">
          You must complete this assessment before you can access the rest of the application.
        </p>
        <MBTIAssessment />
      </div>
    </div>
  );
} 