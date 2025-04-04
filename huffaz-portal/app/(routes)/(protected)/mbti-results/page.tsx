'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// MBTI types descriptions
const mbtiDescriptions: Record<string, {
  title: string;
  description: string;
  traits: Record<string, number>;
  characteristics: string[];
  careerPaths: string[];
  relationshipStyle: string;
  strengths?: string[];
  weaknesses?: string[];
  idealWorkEnvironment?: string;
}> = {
  'ISTJ': {
    title: 'The Inspector',
    description: 'Practical and fact-minded individuals, whose reliability cannot be doubted. They are detail-oriented and methodical in their approach, valuing tradition and loyalty.',
    traits: {
      'Introverted': 85,
      'Sensing': 80,
      'Thinking': 75,
      'Judging': 90
    },
    characteristics: [
      'Quiet and serious',
      'Thorough and dependable',
      'Practical and logical',
      'Value traditions and loyalty',
      'Can be counted on to fulfill obligations'
    ],
    careerPaths: [
      'Accountant',
      'Auditor',
      'Financial Analyst',
      'Database Administrator',
      'Supply Chain Manager',
      'Logistics Coordinator'
    ],
    relationshipStyle: 'ISTJs are committed and loyal partners who value stability and security in relationships. They approach relationships with seriousness and dedication, often seeing them as lifelong commitments once they have made the decision to commit.',
    strengths: [
      'Reliable and dependable',
      'Detail-oriented and thorough',
      'Excellent organizational skills',
      'Strong work ethic',
      'Practical and logical problem-solving',
      'Values responsibility and integrity'
    ],
    weaknesses: [
      'Can be rigid and resistant to change',
      'May miss the bigger picture while focusing on details',
      'Sometimes perceived as stubborn',
      'May struggle with unexpected changes',
      'Can be critical of unconventional methods',
      'May have difficulty adapting to new technologies or approaches'
    ],
    idealWorkEnvironment: 'ISTJs thrive in structured, stable environments with clear hierarchies and established procedures. They perform best in roles that value precision, responsibility, and consistency. They prefer workplaces that respect tradition, provide clear expectations, and allow for methodical, detail-oriented work.'
  },
  'ISFJ': {
    title: 'The Protector',
    description: 'Very dedicated and warm protectors, always ready to defend their loved ones. They are service-oriented and strive to meet the needs of others.',
    traits: {
      'Introverted': 80,
      'Sensing': 75,
      'Feeling': 80,
      'Judging': 85
    },
    characteristics: [
      'Quiet, kind, and conscientious',
      'Committed and steady in meeting obligations',
      'Thorough and accurate',
      'Concerned with how others feel',
      'Strong desire to be helpful'
    ],
    careerPaths: [
      'Nurse',
      'Elementary School Teacher',
      'Social Worker',
      'Human Resources Specialist',
      'Customer Service Representative',
      'Administrative Assistant'
    ],
    relationshipStyle: 'ISFJs are nurturing and supportive partners who prioritize harmony and emotional security. They demonstrate love through practical acts of service and are highly attentive to their partner\'s needs and preferences.',
    strengths: [
      'Warm and sympathetic',
      'Attentive to detail',
      'Excellent memory for personal information',
      'Responsible and conscientious',
      'Patient and devoted',
      'Committed to meeting others\' needs'
    ],
    weaknesses: [
      'May neglect their own needs',
      'Can be overly traditional',
      'Sometimes resistant to change',
      'May avoid necessary conflict',
      'Can become overcommitted',
      'May be overly sensitive to criticism'
    ],
    idealWorkEnvironment: 'ISFJs flourish in supportive, harmonious environments where they can help others in tangible ways. They excel in workplaces that value service, loyalty, and attention to detail. They prefer environments with clear expectations, established procedures, and opportunities to provide practical support to colleagues and clients.'
  },
  'INFJ': {
    title: 'The Counselor',
    description: 'Seek meaning and connection in ideas, relationships, and material possessions. They want to understand what motivates people and are insightful about others.',
    traits: {
      'Introverted': 85,
      'Intuitive': 80,
      'Feeling': 85,
      'Judging': 75
    },
    characteristics: [
      'Quietly inspiring and insightful',
      'Creative and visionary',
      'Sensitive and compassionate',
      'Desire to contribute to the welfare of others',
      'Deeply value authentic connections'
    ],
    careerPaths: [
      'Counselor',
      'Psychologist',
      'Writer',
      'HR Development Specialist',
      'Professor',
      'Non-profit Director'
    ],
    relationshipStyle: 'INFJs seek deep, meaningful connections in their relationships. They are intuitive about their partner\'s needs and feelings, often understanding them before they express themselves. They are committed to personal growth for both themselves and their partners.',
    strengths: [
      'Insightful about others',
      'Creative and imaginative',
      'Values deep, authentic connections',
      'Committed to personal growth',
      'Visionary and inspiring',
      'Patient with complex people and situations'
    ],
    weaknesses: [
      'Perfectionistic tendencies',
      'May burn out from giving too much',
      'Can be too idealistic',
      'May struggle with practical matters',
      'Sometimes overly private',
      'Can have difficulty accepting criticism'
    ],
    idealWorkEnvironment: 'INFJs thrive in environments that allow them to express their creativity and pursue meaningful work. They prefer workplaces that value harmony, authenticity, and making a positive difference. They excel in settings that offer independence, opportunities for deep connection, and space for quiet reflection and planning.'
  },
  'INTJ': {
    title: 'The Architect',
    description: 'Independent, innovative thinkers with a strategic mind. They have a natural thirst for knowledge and are highly analytical and critical of ideas and systems.',
    traits: {
      'Introverted': 90,
      'Intuitive': 85,
      'Thinking': 80,
      'Judging': 75
    },
    characteristics: [
      'Original and independent thinking',
      'High standards of competence',
      'Strong drive for implementation of ideas',
      'Naturally skeptical and critical',
      'Long-range strategic planning'
    ],
    careerPaths: [
      'Systems Analyst',
      'Software Engineer',
      'Strategic Planner',
      'Investment Banker',
      'Scientist',
      'University Professor'
    ],
    relationshipStyle: 'INTJs approach relationships with the same strategic thinking they apply to other areas of life. They are loyal and committed partners who value intellectual connections and independence. They seek partners who can engage with them on deep subjects and respect their need for space.',
    strengths: [
      'Strategic and long-term thinking',
      'Independent and self-confident',
      'Innovative problem-solving',
      'Insightful and analytical',
      'Continuous learner',
      'High standards of performance'
    ],
    weaknesses: [
      'Can appear overly critical or judgmental',
      'May overlook emotional considerations',
      'Sometimes perceived as arrogant',
      'Can be impatient with inefficiency',
      'May struggle with expressing feelings',
      'Perfectionism can lead to burnout'
    ],
    idealWorkEnvironment: 'INTJs excel in intellectually challenging environments that value innovation and strategic thinking. They prefer workplaces that provide autonomy, recognize competence, and offer opportunities to implement their ideas. They thrive in settings that encourage continuous learning, critical analysis, and development of complex systems.'
  },
  'ISTP': {
    title: 'The Craftsman',
    description: 'Tolerant and flexible, quiet observers until a problem appears, then act quickly to find workable solutions. They excel at troubleshooting and have a knack for mechanics.',
    traits: {
      'Introverted': 75,
      'Sensing': 70,
      'Thinking': 80,
      'Perceiving': 85
    },
    characteristics: [
      'Quiet and reserved',
      'Practical problem-solvers',
      'Logical and efficient',
      'Enjoy hands-on activities',
      'Value freedom to work at their own pace'
    ],
    careerPaths: [
      'Engineer',
      'Mechanic',
      'Pilot',
      'Forensic Scientist',
      'Electrician',
      'Software Developer'
    ],
    relationshipStyle: 'ISTPs are independent and adaptable partners who value personal freedom. They tend to live in the moment and may struggle with long-term planning in relationships. They show affection through practical actions rather than verbal expressions.',
    strengths: [
      'Excellent technical and mechanical skills',
      'Calm and rational in crises',
      'Practical problem-solver',
      'Adaptable and flexible',
      'Independent and self-reliant',
      'Observant of details and surroundings'
    ],
    weaknesses: [
      'May avoid emotional situations',
      'Can be perceived as detached',
      'Sometimes resistant to commitment',
      'May struggle with long-term planning',
      'Can be risk-prone or thrill-seeking',
      'May have difficulty expressing feelings'
    ],
    idealWorkEnvironment: 'ISTPs thrive in hands-on environments where they can troubleshoot problems and apply practical solutions. They prefer workplaces that offer variety, freedom from excessive rules, and opportunities for technical mastery. They excel in settings that value logical thinking, allow independent work, and provide tangible, immediate results.'
  },
  'ISFP': {
    title: 'The Composer',
    description: 'Quiet, friendly, sensitive, and kind. They enjoy the present moment and what\'s going on around them, often having a strong aesthetic appreciation for beauty.',
    traits: {
      'Introverted': 75,
      'Sensing': 65,
      'Feeling': 80,
      'Perceiving': 85
    },
    characteristics: [
      'Warm, friendly, and considerate',
      'Live in the present moment',
      'Strong aesthetic appreciation',
      'Loyal to values and people',
      'Dislike conflict and confrontation'
    ],
    careerPaths: [
      'Artist',
      'Designer',
      'Musician',
      'Healthcare Worker',
      'Veterinarian',
      'Chef'
    ],
    relationshipStyle: 'ISFPs bring warmth, caring, and creativity to their relationships. They are attentive and supportive partners who prefer harmony and avoiding conflict. They express love through thoughtful gestures and creating beautiful experiences for their partners.',
    strengths: [
      'Strong aesthetic awareness',
      'Sensitive to others\' needs',
      'Adaptable and flexible',
      'Creative and artistic',
      'Values-driven and authentic',
      'Attentive to sensory details'
    ],
    weaknesses: [
      'May avoid conflict too much',
      'Can struggle with planning ahead',
      'Sometimes overly private about feelings',
      'May resist criticism or feedback',
      'Can have difficulty with abstract theory',
      'May appear unpredictable to others'
    ],
    idealWorkEnvironment: 'ISFPs flourish in creative, harmonious environments with minimal restrictions. They prefer workplaces that value aesthetic beauty, personal expression, and hands-on work. They thrive in settings that provide freedom to follow inspiration, appreciation for their unique contributions, and opportunities to help others in practical ways.'
  },
  'INFP': {
    title: 'The Mediator',
    description: 'Idealistic, loyal to their values and people they care about. They seek to understand people and help them fulfill their potential, often focusing on making the world a better place.',
    traits: {
      'Introverted': 80,
      'Intuitive': 85,
      'Feeling': 90,
      'Perceiving': 75
    },
    characteristics: [
      'Idealistic and value-driven',
      'Seek harmony and positive experiences',
      'Curious and adaptable',
      'Creative and imaginative',
      'Deeply empathetic'
    ],
    careerPaths: [
      'Writer',
      'Counselor',
      'Teacher',
      'Social Worker',
      'Graphic Designer',
      'Non-profit Worker'
    ],
    relationshipStyle: 'INFPs are devoted partners who bring depth, authenticity, and idealism to relationships. They are constantly seeking greater understanding of their partners and striving to create deeper connections. They value emotional honesty and open communication.',
    strengths: [
      'Creative and imaginative',
      'Deeply empathetic',
      'Passionate about their values',
      'Dedicated to authentic connections',
      'Open-minded and adaptable',
      'Excellent written communication'
    ],
    weaknesses: [
      'May be too idealistic',
      'Can take criticism personally',
      'Sometimes impractical',
      'May struggle with organization and deadlines',
      'Can become too absorbed in personal projects',
      'Might avoid conflict to maintain harmony'
    ],
    idealWorkEnvironment: 'INFPs thrive in supportive, creative environments aligned with their values. They prefer workplaces that emphasize personal growth, authenticity, and making a positive difference. They excel in settings that provide autonomy, appreciation for their unique contributions, and opportunities to help others reach their potential.'
  },
  'INTP': {
    title: 'The Thinker',
    description: 'Seek to develop logical explanations for everything that interests them. They are theoretical and abstract, more interested in ideas than social interaction.',
    traits: {
      'Introverted': 85,
      'Intuitive': 80,
      'Thinking': 85,
      'Perceiving': 90
    },
    characteristics: [
      'Analytical and logical',
      'Objective and detached',
      'Original thinkers',
      'Value knowledge and competence',
      'Question assumptions and traditions'
    ],
    careerPaths: [
      'Computer Programmer',
      'Mathematician',
      'System Analyst',
      'Architect',
      'Researcher',
      'University Professor'
    ],
    relationshipStyle: 'INTPs approach relationships with curiosity and analysis. They seek partners who can engage them intellectually and respect their independence. They may struggle with emotional expression but are loyal and committed to partners they truly connect with.',
    strengths: [
      'Analytical and logical thinking',
      'Innovative problem-solving',
      'Independent and self-sufficient',
      'Objective assessment of situations',
      'Original and creative ideas',
      'Expertise in areas of interest'
    ],
    weaknesses: [
      'May neglect practical matters',
      'Can be perceived as aloof or detached',
      'Sometimes overly critical or skeptical',
      'May struggle with routine tasks',
      'Can have difficulty expressing emotions',
      'Might overlook social norms or expectations'
    ],
    idealWorkEnvironment: 'INTPs excel in environments that challenge them intellectually and provide autonomy. They prefer workplaces that value innovation, logical analysis, and the exploration of complex problems. They thrive in settings that offer flexibility, respect for expertise, minimal hierarchy, and opportunities to develop theoretical frameworks.'
  },
  'ESTP': {
    title: 'The Entrepreneur',
    description: 'Flexible and tolerant, pragmatic problem-solvers who focus on immediate results. They enjoy material comforts and living life to the fullest.',
    traits: {
      'Extraverted': 85,
      'Sensing': 75,
      'Thinking': 70,
      'Perceiving': 90
    },
    characteristics: [
      'Energetic and action-oriented',
      'Adaptable and resourceful',
      'Practical problem-solvers',
      'Enjoy living in the moment',
      'Risk-takers who love challenges'
    ],
    careerPaths: [
      'Sales Representative',
      'Marketing Specialist',
      'Entrepreneur',
      'Police Officer',
      'Firefighter',
      'Athletic Coach'
    ],
    relationshipStyle: 'ESTPs bring excitement and spontaneity to relationships. They live in the moment and prefer action over deep emotional discussions. They show affection through shared activities and practical support rather than verbal expressions of feeling.',
    strengths: [
      'Excellent crisis management',
      'Bold and direct communication',
      'Highly observant of surroundings',
      'Creative problem-solving skills',
      'Natural negotiators',
      'Adaptable to changing situations'
    ],
    weaknesses: [
      'May struggle with long-term planning',
      'Can be impatient with theoretical concepts',
      'Sometimes insensitive to others\' emotions',
      'May take unnecessary risks',
      'Can become bored with routine tasks',
      'May neglect commitments when seeking new experiences'
    ],
    idealWorkEnvironment: 'ESTPs thrive in dynamic workplaces that offer variety, tangible results, and opportunities for active engagement. They perform best in roles that allow freedom of movement, practical problem-solving, and immediate feedback. They prefer environments that value direct communication, quick decision-making, and reward risk-taking and initiative.'
  },
  'ESFP': {
    title: 'The Performer',
    description: 'Outgoing, friendly, accepting, and focused on immediate experiences. They love people and material comforts and have a special ability to bring joy to others.',
    traits: {
      'Extraverted': 90,
      'Sensing': 75,
      'Feeling': 80,
      'Perceiving': 85
    },
    characteristics: [
      'Enthusiastic and fun-loving',
      'Live in the present moment',
      'Enjoy bringing people together',
      'Practical and realistic',
      'Adaptable and spontaneous'
    ],
    careerPaths: [
      'Event Planner',
      'Real Estate Agent',
      'Travel Agent',
      'Child Care Provider',
      'Performer/Entertainer',
      'Public Relations Specialist'
    ],
    relationshipStyle: 'ESFPs are warm, enthusiastic partners who create fun and exciting experiences. They are attentive to their partner\'s emotional needs and practical concerns. They thrive in relationships that allow for spontaneity and freedom of expression.',
    strengths: [
      'Outgoing and sociable',
      'Observant of others\' needs',
      'Practical problem-solving',
      'Adaptable and resourceful',
      'Brings enthusiasm to projects',
      'Natural at networking and connecting people'
    ],
    weaknesses: [
      'May avoid complex theoretical discussions',
      'Can struggle with long-term planning',
      'Sometimes avoids conflict',
      'May make impulsive decisions',
      'Can be easily distracted',
      'May neglect preparations for future needs'
    ],
    idealWorkEnvironment: 'ESFPs thrive in social, dynamic environments that allow for practical engagement and variety. They prefer workplaces that are friendly, collaborative, and focused on tangible results. They excel in settings that value enthusiasm, people skills, and creative practical solutions while offering freedom from excessive routine.'
  },
  'ENFP': {
    title: 'The Champion',
    description: 'Warmly enthusiastic, imaginative, and see life as full of possibilities. They connect the dots between events and information very quickly.',
    traits: {
      'Extraverted': 80,
      'Intuitive': 85,
      'Feeling': 75,
      'Perceiving': 80
    },
    characteristics: [
      'Enthusiastic and imaginative',
      'See potential in everyone',
      'Value meaningful connections',
      'Curious about ideas and possibilities',
      'Spontaneous and flexible'
    ],
    careerPaths: [
      'Journalist',
      'Counselor',
      'Consultant',
      'Marketing Creative',
      'Public Relations Specialist',
      'Human Resources Developer'
    ],
    relationshipStyle: 'ENFPs bring enthusiasm, creativity, and depth to relationships. They are passionate partners who value authentic connections and personal growth. They need partners who appreciate their energy and idealism while providing some grounding balance.',
    strengths: [
      'Enthusiastic and creative',
      'Excellent people skills',
      'Adaptable and versatile',
      'Sees connections and possibilities',
      'Energetic and inspiring',
      'Values authenticity and growth'
    ],
    weaknesses: [
      'May struggle with follow-through',
      'Can become scattered or unfocused',
      'Sometimes neglects routine maintenance',
      'May take on too many projects',
      'Can be sensitive to criticism',
      'Might have difficulty with practical details'
    ],
    idealWorkEnvironment: 'ENFPs flourish in creative, collaborative environments with room for innovation and personal expression. They prefer workplaces that value enthusiasm, originality, and human connection. They excel in settings that provide variety, opportunities to inspire others, and the chance to pursue multiple interests while making a positive impact.'
  },
  'ENTP': {
    title: 'The Debater',
    description: 'Quick, ingenious, and stimulating. Alert and outspoken, they enjoy challenging others and being challenged intellectually.',
    traits: {
      'Extraverted': 75,
      'Intuitive': 85,
      'Thinking': 80,
      'Perceiving': 90
    },
    characteristics: [
      'Innovative and creative',
      'Intellectually quick and curious',
      'Good at generating conceptual possibilities',
      'Enjoy debates and challenges',
      'Question authority and conventions'
    ],
    careerPaths: [
      'Entrepreneur',
      'Lawyer',
      'Creative Director',
      'Management Consultant',
      'Engineer',
      'Software Developer'
    ],
    relationshipStyle: 'ENTPs approach relationships with enthusiasm and a desire for intellectual stimulation. They value partners who can engage them in spirited debates and appreciate their unconventional thinking. They need freedom to explore new ideas and possibilities.',
    strengths: [
      'Creative problem-solver',
      'Quick-thinking and adaptable',
      'Excellent debating skills',
      'Generates innovative ideas',
      'Charismatic and enthusiastic',
      'Enjoys intellectual challenges'
    ],
    weaknesses: [
      'May neglect important details',
      'Can be argumentative',
      'Sometimes insensitive to emotional needs',
      'May lose interest after initial enthusiasm',
      'Can procrastinate on routine tasks',
      'Might challenge authority unnecessarily'
    ],
    idealWorkEnvironment: 'ENTPs thrive in innovative, intellectually stimulating environments that welcome debate and new ideas. They prefer workplaces that value creative thinking, problem-solving, and strategic vision. They excel in settings that provide autonomy, variety, and opportunities to challenge existing systems while developing conceptual frameworks.'
  },
  'ESTJ': {
    title: 'The Supervisor',
    description: 'Practical, realistic, and matter-of-fact, with a natural head for business or mechanics. They are not interested in abstract theories; they want ideas to have practical applications.',
    traits: {
      'Extraverted': 80,
      'Sensing': 75,
      'Thinking': 85,
      'Judging': 90
    },
    characteristics: [
      'Organized and structured',
      'Practical and realistic',
      'Decisive and quick to implement',
      'Loyal to traditions and establishments',
      'Value security and stability'
    ],
    careerPaths: [
      'Business Manager',
      'Military Officer',
      'Judge',
      'Financial Officer',
      'School Administrator',
      'Project Manager'
    ],
    relationshipStyle: 'ESTJs are dependable and committed partners who value stability and clear expectations. They approach relationships with the same organization and structure they apply to other areas of life. They show love through practical support and maintaining household order.',
    strengths: [
      'Excellent organizational skills',
      'Reliable and dependable',
      'Decisive leadership',
      'Clear communication style',
      'Strong work ethic',
      'Practical problem-solver'
    ],
    weaknesses: [
      'May be inflexible or rigid',
      'Can rush to judgment',
      'Sometimes insensitive to emotional needs',
      'May be overly focused on rules',
      'Can appear controlling',
      'Might resist unconventional approaches'
    ],
    idealWorkEnvironment: 'ESTJs excel in structured environments with clear hierarchies and established procedures. They prefer workplaces that value tradition, efficiency, and practical results. They thrive in settings that offer leadership opportunities, reward hard work and organization, and implement logical systems to achieve concrete objectives.'
  },
  'ESFJ': {
    title: 'The Provider',
    description: 'Warm-hearted, conscientious, and cooperative. They want harmony in their environment and work with determination to establish it.',
    traits: {
      'Extraverted': 85,
      'Sensing': 70,
      'Feeling': 90,
      'Judging': 80
    },
    characteristics: [
      'Warm and supportive',
      'Conscientious and reliable',
      'Cooperative and seek harmony',
      'Practical and traditional',
      'Need appreciation and acceptance'
    ],
    careerPaths: [
      'Nurse',
      'Elementary School Teacher',
      'Social Worker',
      'Human Resources Manager',
      'Healthcare Administrator',
      'Customer Service Manager'
    ],
    relationshipStyle: 'ESFJs are caring and attentive partners who prioritize harmony and meeting their partner\'s needs. They are oriented toward creating a secure, comfortable home environment and maintaining strong family connections. They show love through practical care and emotional support.',
    strengths: [
      'Warm and people-oriented',
      'Responsible and reliable',
      'Strong practical skills',
      'Excellent cooperation abilities',
      'Attentive to others\' needs',
      'Organized and methodical'
    ],
    weaknesses: [
      'May seek approval too much',
      'Can be inflexible about traditions',
      'Sometimes avoids necessary conflict',
      'May neglect own needs',
      'Can be sensitive to criticism',
      'Might judge unconventional behavior'
    ],
    idealWorkEnvironment: 'ESFJs thrive in harmonious, structured environments where they can support others in practical ways. They prefer workplaces that value cooperation, service, and clear procedures. They excel in settings with a strong sense of community, opportunities for social interaction, and recognition for their contributions to team welfare.'
  },
  'ENFJ': {
    title: 'The Teacher',
    description: 'Warm, empathetic, responsive, and responsible. Highly attuned to the emotions, needs, and motivations of others. Find potential in everyone and help others fulfill their potential.',
    traits: {
      'Extraverted': 80,
      'Intuitive': 75,
      'Feeling': 90,
      'Judging': 75
    },
    characteristics: [
      'Charismatic and inspiring',
      'Empathetic and people-focused',
      'Idealistic and values-driven',
      'Organized and decisive',
      'Natural leaders and mentors'
    ],
    careerPaths: [
      'Teacher',
      'Counselor',
      'Human Resources Manager',
      'Corporate Trainer',
      'Non-profit Director',
      'Marketing Manager'
    ],
    relationshipStyle: 'ENFJs are devoted and supportive partners who invest deeply in their relationships. They are naturally attuned to their partner\'s needs and feelings, often prioritizing them above their own. They create harmonious relationships focused on mutual growth and fulfillment.',
    strengths: [
      'Natural leadership abilities',
      'Excellent communication skills',
      'Empathetic and supportive',
      'Values-driven and purposeful',
      'Organized and decisive',
      'Inspires and motivates others'
    ],
    weaknesses: [
      'Can be overly accommodating',
      'May neglect own needs',
      'Sometimes controlling or manipulative',
      'Can take criticism personally',
      'May struggle with tough decisions',
      'Might be unrealistic about people\'s potential'
    ],
    idealWorkEnvironment: 'ENFJs flourish in collaborative environments focused on developing human potential. They prefer workplaces that value mentorship, personal growth, and making a positive difference. They excel in settings that provide leadership opportunities, recognize their people skills, and align with their core values while allowing them to help others succeed.'
  },
  'ENTJ': {
    title: 'The Commander',
    description: 'Frank, decisive, and assume leadership readily. They quickly see illogical and inefficient procedures and policies and develop comprehensive systems to solve organizational problems.',
    traits: {
      'Extraverted': 85,
      'Intuitive': 80,
      'Thinking': 90,
      'Judging': 85
    },
    characteristics: [
      'Strategic and long-range planners',
      'Logical and analytical',
      'Decisive and efficient',
      'Natural leaders',
      'Value knowledge and competence'
    ],
    careerPaths: [
      'Executive',
      'Entrepreneur',
      'Management Consultant',
      'Lawyer',
      'University Professor',
      'Political Strategist'
    ],
    relationshipStyle: 'ENTJs approach relationships with the same strategic thinking they apply to other areas of life. They are direct communicators who value intellectual connections and shared goals. They show love through support for their partner\'s ambitions and creating efficient household systems.',
    strengths: [
      'Strong leadership abilities',
      'Strategic vision and planning',
      'Decisive and efficient',
      'Excellent organizational skills',
      'Values competence and knowledge',
      'Drives for continuous improvement'
    ],
    weaknesses: [
      'Can be domineering or controlling',
      'Sometimes insensitive to emotional needs',
      'May be impatient with inefficiency',
      'Can appear arrogant or dismissive',
      'Might overlook important details',
      'May struggle with work-life balance'
    ],
    idealWorkEnvironment: 'ENTJs thrive in challenging environments that value efficiency, competence, and strategic planning. They prefer workplaces that recognize leadership, offer intellectual challenges, and provide opportunities to implement systems and drive change. They excel in settings that reward results, allow for authority and autonomy, and appreciate their visionary thinking.'
  }
};

export default function MBTIResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mbtiType, setMbtiType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMbtiType = async () => {
      try {
        // First check if it's in the URL params
        const typeFromParams = searchParams?.get('type');
        
        if (typeFromParams && mbtiDescriptions[typeFromParams]) {
          setMbtiType(typeFromParams);
          setLoading(false);
          return;
        }

        // If not in params, try to get from user profile
        const response = await fetch('/api/profile');
        if (response.ok) {
          const profile = await response.json();
          if (profile.mbtiType && mbtiDescriptions[profile.mbtiType]) {
            setMbtiType(profile.mbtiType);
          } else {
            // If no MBTI type found, redirect to assessment
            router.push('/mbti-assessment');
          }
        } else {
          // If profile fetch fails, redirect to assessment
          router.push('/mbti-assessment');
        }
      } catch (error) {
        console.error('Error fetching MBTI type:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMbtiType();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!mbtiType || !mbtiDescriptions[mbtiType]) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold mb-4">MBTI Result Not Found</h1>
        <p className="mb-6">We couldn't find your MBTI type. Please complete the assessment.</p>
        <Link href="/mbti-assessment" className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700">
          Take MBTI Assessment
        </Link>
      </div>
    );
  }

  const mbtiInfo = mbtiDescriptions[mbtiType];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700 mb-2">Your MBTI Type: {mbtiType}</h1>
          <h2 className="text-2xl font-semibold text-gray-700">{mbtiInfo.title}</h2>
          <p className="mt-4 text-gray-600">{mbtiInfo.description}</p>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-indigo-600">Personality Traits</h3>
          {Object.entries(mbtiInfo.traits).map(([trait, value]) => (
            <div key={trait} className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{trait}</span>
                <span>{value}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full" 
                  style={{ width: `${value}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-indigo-600">Key Characteristics</h3>
          <ul className="list-disc pl-6 space-y-2">
            {mbtiInfo.characteristics.map((characteristic, index) => (
              <li key={index} className="text-gray-700">{characteristic}</li>
            ))}
          </ul>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-indigo-600">Career Paths</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {mbtiInfo.careerPaths.map((career, index) => (
              <div key={index} className="bg-indigo-50 rounded px-3 py-2 text-indigo-700">{career}</div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-indigo-600">Relationship Style</h3>
          <p className="text-gray-700">{mbtiInfo.relationshipStyle}</p>
        </div>

        {mbtiInfo.strengths && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-indigo-600">Strengths</h3>
            <ul className="list-disc pl-6 space-y-2">
              {mbtiInfo.strengths.map((strength, index) => (
                <li key={index} className="text-gray-700">{strength}</li>
              ))}
            </ul>
          </div>
        )}

        {mbtiInfo.weaknesses && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-indigo-600">Weaknesses</h3>
            <ul className="list-disc pl-6 space-y-2">
              {mbtiInfo.weaknesses.map((weakness, index) => (
                <li key={index} className="text-gray-700">{weakness}</li>
              ))}
            </ul>
          </div>
        )}

        {mbtiInfo.idealWorkEnvironment && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-indigo-600">Ideal Work Environment</h3>
            <p className="text-gray-700">{mbtiInfo.idealWorkEnvironment}</p>
          </div>
        )}

        <div className="text-center mt-8">
          <p className="mb-4 text-gray-600">Your MBTI type will help us match you with job opportunities that align with your personality traits!</p>
          <Link href="/dashboard" className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 inline-block">
            Continue to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 