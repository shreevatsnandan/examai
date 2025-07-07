import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import QuestionPaper from '@/models/QuestionPaper';
import dbConnect from '@/lib/dbConnect';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const difficulty = formData.get('difficulty') as string;
    const file = formData.get('file') as File | null;

    const difficultyCounts = JSON.parse(difficulty) as {
      mcq: { easy: number; medium: number; hard: number };
      subjective: { easy: number; medium: number; hard: number };
    };

    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY || "" 
    });

    const contents = [{
      text: buildPrompt(prompt, difficultyCounts)
    }];

    if (file) {
      const fileBuffer = await file.arrayBuffer();
      contents.push({
        inlineData: {
          mimeType: file.type,
          data: Buffer.from(fileBuffer).toString("base64")
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents
    });

    const generatedText = response.text;
    const sections = parseGeneratedQuestions(generatedText, difficultyCounts);

    // Create and save question paper
    const questionPaper = new QuestionPaper({
      title: `Questions: ${prompt}`,
      topic: prompt,
      prompt: contents[0].text,
      userId,
      sections
    });

    await questionPaper.save();

    return NextResponse.json({ 
      success: true,
      text: generatedText,
      sections, // Send parsed sections back to client
      paperId: questionPaper._id 
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}

function buildPrompt(topic: string, counts: any): string {
  return `Generate exam questions about: ${topic}

  Question Requirements:
  
  Multiple Choice Questions (MCQs):
  - Easy: ${counts.mcq.easy} questions
  - Medium: ${counts.mcq.medium} questions
  - Hard: ${counts.mcq.hard} questions
  
  Subjective Questions:
  - Easy: ${counts.subjective.easy} questions
  - Medium: ${counts.subjective.medium} questions
  - Hard: ${counts.subjective.hard} questions

  Format Rules:
  1. For MCQs:
     - Provide exactly 4 options
     - Group questions by difficulty level with headers: [Easy], [Medium], [Hard]
  2. For Subjective:
     - Group questions by difficulty level with headers: [Easy], [Medium], [Hard]
     - Questions should match complexity
  3. Number all questions sequentially within each section

  Example Format:
  
  MCQs:
  [Easy]
  1. What is...?
     A) Option 1
     B) Option 2
     C) Option 3
     D) Option 4
  2. Another question...?
     A) Option 1
     B) Option 2
     C) Option 3 
     D) Option 4

  [Medium]
  3. Medium question...?
     A) Option 1
     B) Option 2 
     C) Option 3
     D) Option 4

  [Hard]

  4. Hard question...?
     A) Option 1
     B) Option 2 
     C) Option 3
     D) Option 4

  5. Hard question...?
     A) Option 1
     B) Option 2 
     C) Option 3
     D) Option 4


  Subjective:
  [Easy]
  1. Easy question?
  
  [Medium]
  2. Medium question?
  
   [Hard]
  3. Hard question?
  `;
}

function parseGeneratedQuestions(text: string, counts: any): any[] {
  const sections: any[] = [];
  let currentSection: any = null;
  let questionNumber = 0;

  // Split by double newlines to handle sections
  const blocks = text.split(/\n\s*\n/).filter(block => block.trim());

  for (const block of blocks) {
    const lines = block.split('\n').filter(line => line.trim());
    
    // Check for section headers
    if (block.includes('MCQs:')) {
      currentSection = { type: 'mcq', difficulty: 'easy', questions: [] };
      sections.push(currentSection);
      continue;
    }

    if (block.includes('Subjective:')) {
      currentSection = { type: 'subjective', difficulty: 'easy', questions: [] };
      sections.push(currentSection);
      continue;
    }

    // Check for difficulty level headers
    const difficultyMatch = lines[0].match(/^\[(Easy|Medium|Hard)\]$/);
    if (difficultyMatch && currentSection) {
      currentSection.difficulty = difficultyMatch[1].toLowerCase();
      continue;
    }

    // Parse questions if we have a current section
    if (currentSection) {
      // For MCQs
      if (currentSection.type === 'mcq') {
        const questionRegex = /^\d+\.\s+(.+)/;
        const optionRegex = /^[A-D]\)\s+(.+?)(?:\s+\(Correct\))?$/;
        
        let currentQuestion: any = null;
        
        for (const line of lines) {
          // New question
          const questionMatch = line.match(questionRegex);
          if (questionMatch) {
            questionNumber++;
            currentQuestion = {
              text: questionMatch[1],
              options: [],
              marks: currentSection.difficulty === 'easy' ? 1 : 
                    currentSection.difficulty === 'medium' ? 2 : 3
            };
            currentSection.questions.push(currentQuestion);
            continue;
          }
          
          // Option for current question
          const optionMatch = line.match(optionRegex);
          if (optionMatch && currentQuestion) {
            currentQuestion.options.push({
              text: optionMatch[1],
              isCorrect: line.includes('(Correct)')
            });
          }
        }
      }
      // For Subjective
      else {
        for (const line of lines) {
          const questionMatch = line.match(/^\d+\.\s+(.+)/);
          if (questionMatch) {
            questionNumber++;
            currentSection.questions.push({
              text: questionMatch[1],
              marks: currentSection.difficulty === 'easy' ? 2 : 
                    currentSection.difficulty === 'medium' ? 4 : 6
            });
          }
        }
      }
    }
  }

  return sections;
}