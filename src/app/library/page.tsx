import { Suspense } from 'react';
import Layout from '@/components/Layout';
import Library from '@/components/Library';
import { loadBookData } from '@/lib/bookLoader';

export default async function LibraryPage() {
  const bookData = await loadBookData();
  
  return (
    <Layout>
      <Suspense fallback={<div className="text-white text-lg">Loading library...</div>}>
        <Library initialBook={bookData} />
      </Suspense>
    </Layout>
  );
}