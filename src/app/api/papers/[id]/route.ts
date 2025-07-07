// app/api/papers/[id]/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import QuestionPaper from '@/models/QuestionPaper';
import dbConnect from '@/lib/dbConnect';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const paper = await QuestionPaper.findOne({
      _id: params.id,
      userId
    }).lean();

    if (!paper) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    return NextResponse.json(paper);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}