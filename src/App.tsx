import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Library from './pages/Library';
import Account from './pages/Account';
import Reader from './components/Reader';
import { loadBookData } from './data/bookLoader';
import { Book } from './types';
import { sampleBooks } from './data/sampleBook';

function App() {
  const [books, setBooks] = useState<Book[]>(sampleBooks);
  const [psychologyOfMoney, setPsychologyOfMoney] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    loadBookData()
      .then(bookData => {
        setPsychologyOfMoney(bookData);
        setBooks(prev => [bookData, ...prev.slice(1)]);
      })
      .catch(error => {
        console.error('Failed to load book data:', error);
        setError('Failed to load book data. Using sample content instead.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-lg">Loading your library...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Layout>
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
            {error}
          </div>
        )}
        <Routes>
          <Route path="/" element={<Home books={books} />} />
          <Route path="/library" element={<Library books={books} />} />
          <Route path="/account" element={<Account />} />
          <Route
            path="/read/:bookId"
            element={
              <Reader
                book={psychologyOfMoney || books[0]}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;