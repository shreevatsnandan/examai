import mongoose, { Schema, Document } from 'mongoose';

interface IQuestionOption {
  text: string;
  isCorrect: boolean;
}

interface IQuestion {
  text: string;
  options?: IQuestionOption[];
  marks: number;
}

interface ISection {
  type: 'mcq' | 'subjective';
  difficulty: 'easy' | 'medium' | 'hard';
  questions: IQuestion[];
}

interface IQuestionPaper extends Document {
  title: string;
  topic: string;
  prompt: string;
  userId: string; // Clerk user ID
  sections: ISection[];
  createdAt: Date;
  updatedAt: Date;
}

const QuestionPaperSchema = new Schema<IQuestionPaper>({
  title: { type: String, required: true },
  topic: { type: String, required: true },
  prompt: { type: String, required: true },
  userId: { type: String, required: true, index: true }, // Clerk user ID
  sections: [{
    type: { type: String, enum: ['mcq', 'subjective'], required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    questions: [{
      text: { type: String, required: true },
      options: [{
        text: { type: String },
        isCorrect: { type: Boolean }
      }],
      marks: { type: Number, required: true }
    }]
  }],
}, { timestamps: true });

export default mongoose.models.QuestionPaper || 
       mongoose.model<IQuestionPaper>('QuestionPaper', QuestionPaperSchema);