import { useState, useCallback, useRef } from 'react';
import stockService from '../services/stockService';

const useStockSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  const search = useCallback((query) => {
    setError(null);
    if (!query || query.trim().length < 1) {
      setResults([]);
      return;
    }

    // Debounce 400ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await stockService.search(query);
        setResults(data.results || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, clearResults };
};

export default useStockSearch;
