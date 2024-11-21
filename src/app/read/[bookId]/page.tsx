import { Suspense } from 'react';
import Layout from '@/components/Layout';
import Reader from '@/components/Reader';
import { loadBookData } from '@/lib/bookLoader';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    bookId: string;
  };
}

export default async function ReaderPage({ params }: Props) {
  try {
    const bookData = await loadBookData();
    
    if (!bookData) {
      notFound();
    }
    
    return (
      <Layout>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-white text-lg">Loading book...</div>
          </div>
        }>
          <Reader book={bookData} />
        </Suspense>
      </Layout>
    );
  } catch (error) {
    console.error('Error in ReaderPage:', error);
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-500 text-lg">
            Error loading book. Please try again later.
          </div>
        </div>
      </Layout>
    );
  }
}