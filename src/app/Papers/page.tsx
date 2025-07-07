"use client";
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

interface QuestionPaper {
  _id: string;
  title: string;
  topic: string;
  createdAt: string;
  sectionsCount: number;
}

export default function PapersPage() {
  const { user, isLoaded } = useUser();
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchPapers = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/papers?page=${page}`);
        const data = await res.json();
        
        if (data.success) {
          setPapers(data.papers);
          setTotalPages(data.pagination.totalPages);
        }
      } catch (error) {
        console.error('Error fetching papers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, [isLoaded, user, page]);

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Question Papers</h1>
          <Link href="/Dashboard" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            Create New
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        ) : papers.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-lg text-gray-600">No papers found</p>
            <Link href="/Dashboard" className="mt-4 inline-block text-green-600 hover:underline">
              Create your first question paper
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {papers.map((paper) => (
                  <li key={paper._id}>
                    <Link href={`/Papers/${paper._id}`} className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-medium text-green-600 truncate">{paper.title}</p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {paper.sectionsCount} sections
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              {paper.topic}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <p>
                              Created on {new Date(paper.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}