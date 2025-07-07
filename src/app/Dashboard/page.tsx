"use client";
import React, { useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface DifficultyCounts {
  mcq: {
    easy: number;
    medium: number;
    hard: number;
  };
  subjective: {
    easy: number;
    medium: number;
    hard: number;
  };
}

interface Question {
  number: number;
  text: string;
  options?: {
    text: string;
    isCorrect: boolean;
  }[];
  marks: number;
}

interface QuestionSection {
  type: 'mcq' | 'subjective';
  difficulty: 'easy' | 'medium' | 'hard';
  questions: Question[];
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [difficultyCounts, setDifficultyCounts] = useState<DifficultyCounts>({
    mcq: { easy: 2, medium: 1, hard: 1 },
    subjective: { easy: 2, medium: 1, hard: 1 }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [sections, setSections] = useState<QuestionSection[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      setFile(selectedFile);
    }
  };

const handleDifficultyChange = (
  type: keyof DifficultyCounts,
  level: keyof DifficultyCounts['mcq'],
  value: number
) => {
  setDifficultyCounts(prev => ({
    ...prev,
    [type]: {
      ...prev[type],
      [level]: Math.max(0, parseInt(value.toString()) || 0) // Added missing parenthesis here
    }
  }));
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) return;
    if (!user) {
      router.push('/sign-in');
      return;
    }

    if (!prompt.trim()) {
      alert('Please enter a topic');
      return;
    }

    setIsLoading(true);
    setSections([]);

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('difficulty', JSON.stringify(difficultyCounts));
      if (file) formData.append('file', file);

      const response = await fetch('/api/generate_questions', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      if (!data.text) {
        throw new Error('No questions were generated');
      }

      // Parse the generated text into sections
      const parsedSections = parseGeneratedQuestions(data.text);
      setSections(parsedSections);

    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const parseGeneratedQuestions = (text: string): QuestionSection[] => {
    const sections: QuestionSection[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    let currentSection: QuestionSection | null = null;
    let questionNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect section headers
      if (line.includes('MCQs:')) {
        currentSection = {
          type: 'mcq',
          difficulty: 'easy',
          questions: []
        };
        sections.push(currentSection);
        continue;
      }

      if (line.includes('Subjective:')) {
        currentSection = {
          type: 'subjective',
          difficulty: 'easy',
          questions: []
        };
        sections.push(currentSection);
        continue;
      }

      // Detect difficulty level
      const difficultyMatch = line.match(/^\[(Easy|Medium|Hard)\]$/);
      if (difficultyMatch && currentSection) {
        currentSection.difficulty = difficultyMatch[1].toLowerCase() as 'easy' | 'medium' | 'hard';
        continue;
      }

      // Parse questions if we have a current section
      if (currentSection) {
        // MCQ questions
        if (currentSection.type === 'mcq') {
          const questionMatch = line.match(/^(\d+)\.\s+(.+)/);
          if (questionMatch) {
            questionNumber++;
            const questionText = questionMatch[2];
            const options = [];
            
            // Get the next 4 lines as options
            for (let j = 1; j <= 4; j++) {
              if (i + j < lines.length) {
                const optionLine = lines[i + j];
                const optionMatch = optionLine.match(/^([A-D])\)\s+(.+?)(\s+\(Correct\))?$/);
                if (optionMatch) {
                  options.push({
                    text: optionMatch[2],
                    isCorrect: optionMatch[3] !== undefined
                  });
                }
              }
            }
            
            currentSection.questions.push({
              number: questionNumber,
              text: questionText,
              options,
              marks: currentSection.difficulty === 'easy' ? 1 : 
                    currentSection.difficulty === 'medium' ? 2 : 3
            });
            
            // Skip the option lines we just processed
            i += 4;
          }
        }
        // Subjective questions
        else {
          const questionMatch = line.match(/^(\d+)\.\s+(.+)/);
          if (questionMatch) {
            questionNumber++;
            currentSection.questions.push({
              number: questionNumber,
              text: questionMatch[2],
              marks: currentSection.difficulty === 'easy' ? 2 : 
                    currentSection.difficulty === 'medium' ? 4 : 6
            });
          }
        }
      }
    }

    return sections;
  };

  const renderQuestions = () => {
    if (sections.length === 0) return null;

    return (
      <div className="mt-8 space-y-8">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">
              {section.type === 'mcq' ? 'Multiple Choice' : 'Subjective'} Questions - 
              <span className="capitalize ml-2">{section.difficulty}</span>
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({section.questions.length} questions)
              </span>
            </h3>
            
            <div className="space-y-6">
              {section.questions.map((question, qIndex) => (
                <div key={qIndex} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <p className="font-medium">
                      {question.number}. {question.text}
                    </p>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {question.marks} mark{question.marks !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {section.type === 'mcq' && question.options && (
                    <div className="mt-3 ml-6 space-y-2">
                      {question.options.map((option, optIndex) => (
                        <div 
                          key={optIndex} 
                          className={`flex items-start p-2 rounded ${
                            option.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                          }`}
                        >
                          <span className="mr-2 mt-0.5">{String.fromCharCode(65 + optIndex)})</span>
                          <span className={option.isCorrect ? 'font-medium text-green-700' : ''}>
                            {option.text}
                          </span>
                          {option.isCorrect && (
                            <span className="ml-2 text-green-600 text-xs mt-0.5">(Correct)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Question Generator</h1>
          <p className="mt-2 text-lg text-gray-600">
            {user ? `Welcome, ${user.firstName || 'User'}` : 'Please sign in to generate questions'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic
                </label>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your topic"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attach File (Optional)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-l-md border border-gray-300"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden" 
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <div className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md bg-gray-50 text-sm text-gray-500 truncate">
                    {file ? file.name : 'No file selected'}
                  </div>
                </div>
                {file && (
                  <p className="mt-1 text-xs text-gray-500">
                    {Math.round(file.size / 1024)} KB
                  </p>
                )}
              </div>

              <div className="self-end">
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || !user}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </span>
                  ) : 'Generate'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Question Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">Multiple Choice Questions</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {(['easy', 'medium', 'hard'] as const).map(level => (
                      <div key={`mcq-${level}`} className="space-y-1">
                        <label htmlFor={`mcq-${level}`} className="block text-sm font-medium text-gray-700 capitalize">
                          {level}
                        </label>
                        <input
                          id={`mcq-${level}`}
                          type="number"
                          min="0"
                          max="20"
                          value={difficultyCounts.mcq[level]}
                          onChange={(e) => handleDifficultyChange('mcq', level, parseInt(e.target.value) || 0)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">Subjective Questions</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {(['easy', 'medium', 'hard'] as const).map(level => (
                      <div key={`subj-${level}`} className="space-y-1">
                        <label htmlFor={`subj-${level}`} className="block text-sm font-medium text-gray-700 capitalize">
                          {level}
                        </label>
                        <input
                          id={`subj-${level}`}
                          type="number"
                          min="0"
                          max="20"
                          value={difficultyCounts.subjective[level]}
                          onChange={(e) => handleDifficultyChange('subjective', level, parseInt(e.target.value) || 0)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {isLoading && (
          <div className="mt-8 text-center py-12 bg-white rounded-lg shadow">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
            <p className="mt-4 text-lg font-medium text-gray-700">Generating your questions...</p>
            <p className="mt-1 text-gray-500">This may take a few moments</p>
          </div>
        )}

        {!isLoading && sections.length > 0 && renderQuestions()}
      </div>
    </div>
  );
}