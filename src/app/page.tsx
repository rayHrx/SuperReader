import Layout from '@/components/Layout';
import Home from '@/components/Home';
import { loadBookData } from '@/lib/bookLoader';

export default async function HomePage() {
  const bookData = await loadBookData();
  
  return (
    <Layout>
      <Home initialBook={bookData} />
    </Layout>
  );
}