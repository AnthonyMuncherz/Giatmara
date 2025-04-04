'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// MBTI questions from the assessment
const questions = [
  // Extraversion (E) vs. Introversion (I)
  { id: 1, text: 'I feel energized after spending time with a large group of people.', category: 'EI' },
  { id: 2, text: 'I prefer to think out loud and discuss ideas with others.', category: 'EI' },
  { id: 3, text: 'I tend to take initiative in social situations.', category: 'EI' },
  { id: 4, text: 'I often act first and think later.', category: 'EI' },
  { id: 5, text: 'I have a wide circle of friends and acquaintances.', category: 'EI' },
  { id: 6, text: 'I feel drained after extended periods of solitude.', category: 'EI' },
  { id: 7, text: 'I enjoy being the center of attention.', category: 'EI' },
  { id: 8, text: 'I prefer working in team environments rather than independently.', category: 'EI' },
  { id: 9, text: 'I find it easy to approach and talk to strangers.', category: 'EI' },
  { id: 10, text: 'I tend to express my thoughts and feelings openly.', category: 'EI' },

  // Sensing (S) vs. Intuition (N)
  { id: 11, text: 'I focus more on present realities than future possibilities.', category: 'SN' },
  { id: 12, text: 'I trust information that comes directly from my five senses.', category: 'SN' },
  { id: 13, text: 'I prefer detailed, step-by-step instructions.', category: 'SN' },
  { id: 14, text: 'I value practical applications over theoretical concepts.', category: 'SN' },
  { id: 15, text: 'I notice specific details in my environment rather than overall patterns.', category: 'SN' },
  { id: 16, text: 'I prefer working with concrete facts and figures rather than exploring ideas and theories.', category: 'SN' },
  { id: 17, text: 'I tend to describe things in literal, straightforward terms.', category: 'SN' },
  { id: 18, text: 'I focus on what is actual and real rather than what could be or might happen.', category: 'SN' },
  { id: 19, text: 'I prefer routine and consistency over variety and change.', category: 'SN' },
  { id: 20, text: 'I am more interested in learning practical skills than conceptual theories.', category: 'SN' },

  // Thinking (T) vs. Feeling (F)
  { id: 21, text: 'I make decisions based primarily on logic and objective analysis.', category: 'TF' },
  { id: 22, text: 'I value truth over tact when giving feedback.', category: 'TF' },
  { id: 23, text: 'I remain detached and analytical when making important decisions.', category: 'TF' },
  { id: 24, text: 'I believe it\'s more important to be right than to be liked.', category: 'TF' },
  { id: 25, text: 'I prefer to focus on tasks and results rather than people\'s feelings.', category: 'TF' },
  { id: 26, text: 'I find it easy to critique others\' work without worrying about their reactions.', category: 'TF' },
  { id: 27, text: 'I seek logical consistency in arguments and am quick to point out flaws.', category: 'TF' },
  { id: 28, text: 'I consider myself reasonable and level-headed more than compassionate and warm.', category: 'TF' },
  { id: 29, text: 'I believe efficiency is more important than harmonious relationships.', category: 'TF' },
  { id: 30, text: 'I tend to analyze situations before considering how others might feel.', category: 'TF' },

  // Judging (J) vs. Perceiving (P)
  { id: 31, text: 'I prefer having a detailed plan before starting a project.', category: 'JP' },
  { id: 32, text: 'I feel stressed when things are disorganized or unstructured.', category: 'JP' },
  { id: 33, text: 'I like to finish one project completely before starting another.', category: 'JP' },
  { id: 34, text: 'I prefer clear deadlines and tend to complete work ahead of schedule.', category: 'JP' },
  { id: 35, text: 'I find it satisfying to check items off my to-do list.', category: 'JP' },
  { id: 36, text: 'I prefer to have things settled and decided rather than open-ended.', category: 'JP' },
  { id: 37, text: 'I keep my living and working spaces neat and organized.', category: 'JP' },
  { id: 38, text: 'I like to have a structured schedule and routine.', category: 'JP' },
  { id: 39, text: 'I prefer to plan social activities in advance rather than be spontaneous.', category: 'JP' },
  { id: 40, text: 'I find it important to follow established rules and procedures.', category: 'JP' },
];

export default function MBTIAssessment() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const sections = [
    { title: 'Extraversion (E) vs. Introversion (I)', questions: questions.slice(0, 10) },
    { title: 'Sensing (S) vs. Intuition (N)', questions: questions.slice(10, 20) },
    { title: 'Thinking (T) vs. Feeling (F)', questions: questions.slice(20, 30) },
    { title: 'Judging (J) vs. Perceiving (P)', questions: questions.slice(30, 40) },
  ];

  const handleAnswerChange = (questionId: number, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const currentSectionAnswered = () => {
    const sectionQuestions = sections[currentSection].questions;
    return sectionQuestions.every((q) => answers[q.id] !== undefined);
  };

  const allQuestionsAnswered = () => {
    return questions.every((q) => answers[q.id] !== undefined);
  };

  const handleNextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo(0, 0);
    }
  };

  const calculateMBTIType = () => {
    // Calculate scores for each dichotomy
    const eiQuestions = questions.filter((q) => q.category === 'EI');
    const snQuestions = questions.filter((q) => q.category === 'SN');
    const tfQuestions = questions.filter((q) => q.category === 'TF');
    const jpQuestions = questions.filter((q) => q.category === 'JP');

    const eiScore = eiQuestions.reduce((sum, q) => sum + answers[q.id], 0);
    const snScore = snQuestions.reduce((sum, q) => sum + answers[q.id], 0);
    const tfScore = tfQuestions.reduce((sum, q) => sum + answers[q.id], 0);
    const jpScore = jpQuestions.reduce((sum, q) => sum + answers[q.id], 0);

    // Determine preference for each dichotomy
    const e_i = eiScore >= 30 ? 'E' : 'I';
    const s_n = snScore >= 30 ? 'S' : 'N';
    const t_f = tfScore >= 30 ? 'T' : 'F';
    const j_p = jpScore >= 30 ? 'J' : 'P';

    return `${e_i}${s_n}${t_f}${j_p}`;
  };

  const handleSubmit = async () => {
    if (!allQuestionsAnswered()) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setLoading(true);
    const mbtiType = calculateMBTIType();

    try {
      const response = await fetch('/api/profile/mbti', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mbtiType,
          mbtiCompleted: true,
        }),
      });

      if (response.ok) {
        router.push(`/mbti-results?type=${mbtiType}`);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save MBTI result');
      }
    } catch (error) {
      console.error('Error saving MBTI result:', error);
      alert('Failed to save your MBTI result. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">{sections[currentSection].title}</h2>
        <div className="flex justify-between mb-4">
          <div className="text-sm text-gray-500">Section {currentSection + 1} of {sections.length}</div>
          <div className="flex space-x-3">
            <div className="w-2 h-2 rounded-full bg-indigo-600 opacity-100"></div>
            <div className={`w-2 h-2 rounded-full ${currentSection >= 1 ? 'bg-indigo-600 opacity-100' : 'bg-gray-300'}`}></div>
            <div className={`w-2 h-2 rounded-full ${currentSection >= 2 ? 'bg-indigo-600 opacity-100' : 'bg-gray-300'}`}></div>
            <div className={`w-2 h-2 rounded-full ${currentSection >= 3 ? 'bg-indigo-600 opacity-100' : 'bg-gray-300'}`}></div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Rate each statement according to how well it describes you on a scale of 1-5:<br />
          1 = Strongly Disagree, 2 = Somewhat Disagree, 3 = Neutral, 4 = Somewhat Agree, 5 = Strongly Agree
        </p>
      </div>

      <div className="space-y-6">
        {sections[currentSection].questions.map((question) => (
          <div key={question.id} className="p-4 bg-gray-50 rounded-md">
            <p className="mb-3 font-medium">{question.id}. {question.text}</p>
            <div className="flex justify-between">
              <div className="flex items-center space-x-1">
                <label htmlFor={`q${question.id}-1`} className="text-sm">
                  Strongly Disagree
                </label>
                <input
                  type="radio"
                  id={`q${question.id}-1`}
                  name={`question-${question.id}`}
                  checked={answers[question.id] === 1}
                  onChange={() => handleAnswerChange(question.id, 1)}
                  className="form-radio text-indigo-600"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id={`q${question.id}-2`}
                  name={`question-${question.id}`}
                  checked={answers[question.id] === 2}
                  onChange={() => handleAnswerChange(question.id, 2)}
                  className="form-radio text-indigo-600"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id={`q${question.id}-3`}
                  name={`question-${question.id}`}
                  checked={answers[question.id] === 3}
                  onChange={() => handleAnswerChange(question.id, 3)}
                  className="form-radio text-indigo-600"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id={`q${question.id}-4`}
                  name={`question-${question.id}`}
                  checked={answers[question.id] === 4}
                  onChange={() => handleAnswerChange(question.id, 4)}
                  className="form-radio text-indigo-600"
                />
              </div>
              <div className="flex items-center space-x-1">
                <input
                  type="radio"
                  id={`q${question.id}-5`}
                  name={`question-${question.id}`}
                  checked={answers[question.id] === 5}
                  onChange={() => handleAnswerChange(question.id, 5)}
                  className="form-radio text-indigo-600"
                />
                <label htmlFor={`q${question.id}-5`} className="text-sm">
                  Strongly Agree
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={handlePreviousSection}
          disabled={currentSection === 0}
          className={`px-4 py-2 rounded ${
            currentSection === 0
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Previous
        </button>
        
        {currentSection < sections.length - 1 ? (
          <button
            onClick={handleNextSection}
            disabled={!currentSectionAnswered()}
            className={`px-4 py-2 rounded ${
              !currentSectionAnswered()
                ? 'bg-indigo-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || !allQuestionsAnswered()}
            className={`px-4 py-2 rounded ${
              loading || !allQuestionsAnswered()
                ? 'bg-indigo-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        )}
      </div>
    </div>
  );
} 