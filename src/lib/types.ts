// src/lib/types.ts
export interface DifficultyCounts {
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

export interface GeneratedQuestions {
  mcq: MCQQuestion[];
  subjective: SubjectiveQuestion[];
  source: 'textbook' | 'general';
  metadata?: {
    textbookPagesUsed?: number[];
  };
}

interface BaseQuestion {
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface MCQQuestion extends BaseQuestion {
  options: string[];
  correctAnswer: string;
  type: 'mcq';
}

interface SubjectiveQuestion extends BaseQuestion {
  answer: string;
  type: 'subjective';
}