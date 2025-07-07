import { NextResponse } from "next/server";
import QuestionPaper from '@/models/QuestionPaper';
import dbConnect from '@/lib/dbConnect';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Fetch paginated papers for the user
    const papers = await QuestionPaper.find({ userId })
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit)
      .lean(); // Convert to plain JS objects

    // Get total count for pagination
    const total = await QuestionPaper.countDocuments({ userId });

    return NextResponse.json({ 
      success: true,
      papers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching papers:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch papers",
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}