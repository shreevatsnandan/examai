// app/Papers/[id]/page.tsx
import { notFound } from 'next/navigation';
import { IQuestionPaper } from '@/models/QuestionPaper';

async function getPaper(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/papers/${id}`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include' // Important for sending cookies
  });

  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch paper');
  }

  return res.json() as Promise<IQuestionPaper>;
}

export default async function PaperDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  try {
    const paper = await getPaper(params.id);

    if (!paper) {
      return notFound();
    }

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{paper.title}</h1>
            <p className="mt-2 text-lg text-gray-600">Topic: {paper.topic}</p>
            <p className="text-sm text-gray-500">
              Created on {new Date(paper.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-8">
            {paper.sections.map((section, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4">
                  {section.type === 'mcq' ? 'Multiple Choice' : 'Subjective'} - 
                  <span className="capitalize ml-2">{section.difficulty}</span>
                </h3>
                
                <div className="space-y-6">
                  {section.questions.map((q, j) => (
                    <div key={j} className="border-b pb-4 last:border-b-0">
                      <div className="flex justify-between">
                        <p className="font-medium">
                          {j + 1}. {q.text}
                        </p>
                        <span className="text-sm text-gray-500">
                          {q.marks} mark{q.marks !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {section.type === 'mcq' && q.options && (
                        <div className="mt-3 ml-6 space-y-2">
                          {q.options.map((opt, k) => (
                            <div 
                              key={k} 
                              className={`flex items-start p-2 rounded ${
                                opt.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                              }`}
                            >
                              <span className="mr-2 mt-0.5">{String.fromCharCode(65 + k)})</span>
                              <span className={opt.isCorrect ? 'font-medium text-green-700' : ''}>
                                {opt.text}
                              </span>
                              {opt.isCorrect && (
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
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading paper:', error);
    return notFound();
  }
}