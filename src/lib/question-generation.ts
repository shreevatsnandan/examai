// src/lib/question-generation.ts
import OpenAI from 'openai';
import type { DifficultyCounts, GeneratedQuestions } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate questions from textbook content
export async function generateFromTextbook({
  textbookContent,
  prompt,
  difficulty
}: {
  textbookContent: string;
  prompt: string;
  difficulty: DifficultyCounts;
}): Promise<GeneratedQuestions> {
  // Combine textbook content with prompt
  const context = `Textbook content:\n${textbookContent}\n\nGenerate questions about: ${prompt}`;
  
  const mcqPrompt = createMCQPrompt(context, difficulty.mcq);
  const subjectivePrompt = createSubjectivePrompt(context, difficulty.subjective);

  const [mcqs, subjective] = await Promise.all([
    generateWithAI(mcqPrompt),
    generateWithAI(subjectivePrompt)
  ]);

  return {
    mcq: parseMCQResponse(mcqs),
    subjective: parseSubjectiveResponse(subjective),
    source: 'textbook'
  };
}

// Generate general questions without textbook
export async function generateGeneralQuestions({
  prompt,
  difficulty
}: {
  prompt: string;
  difficulty: DifficultyCounts;
}): Promise<GeneratedQuestions> {
  const mcqPrompt = `Generate ${getTotalQuestions(difficulty.mcq)} MCQs about ${prompt} at varying difficulty levels.`;
  const subjectivePrompt = `Generate ${getTotalQuestions(difficulty.subjective)} subjective questions about ${prompt} at varying difficulty levels.`;

  const [mcqs, subjective] = await Promise.all([
    generateWithAI(mcqPrompt),
    generateWithAI(subjectivePrompt)
  ]);

  return {
    mcq: parseMCQResponse(mcqs),
    subjective: parseSubjectiveResponse(subjective),
    source: 'general'
  };
}

// Helper functions
function createMCQPrompt(context: string, counts: DifficultyCounts['mcq']): string {
  return `
  Using EXCLUSIVELY the following textbook content, generate questions:
  ${context}
  
  Generate exactly:
  - ${counts.easy} easy MCQs
  - ${counts.medium} medium MCQs 
  - ${counts.hard} hard MCQs
  
  Format each MCQ as:
  Q: [question]
  A) [option 1]
  B) [option 2]
  C) [option 3]
  D) [option 4]
  Answer: [correct letter]
  `;
}

function createSubjectivePrompt(context: string, counts: DifficultyCounts['subjective']): string {
  return `
  Using EXCLUSIVELY the following textbook content, generate questions:
  ${context}
  
  Generate exactly:
  - ${counts.easy} easy subjective questions
  - ${counts.medium} medium subjective questions
  - ${counts.hard} hard subjective questions
  
  Format each as:
  Q: [question]
  Answer: [detailed answer]
  `;
}

async function generateWithAI(prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });
  return response.choices[0]?.message?.content || '';
}

function parseMCQResponse(response: string): any[] {
  // Parse the AI response into structured MCQs
  // Implementation depends on your exact format
}

function parseSubjectiveResponse(response: string): any[] {
  // Parse the AI response into structured subjective questions
  // Implementation depends on your exact format
}

function getTotalQuestions(counts: { easy: number; medium: number; hard: number }): number {
  return counts.easy + counts.medium + counts.hard;
}