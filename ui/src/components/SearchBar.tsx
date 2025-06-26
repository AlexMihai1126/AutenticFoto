'use client';

import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { useRouter } from 'next/navigation';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';

export interface SearchResultItem {
  _id: string;
  title: string;
}

interface SearchBarProps {
  onSelect?: (image: SearchResultItem) => void;
  placeholder?: string;
  maxResults?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSelect,
  placeholder = 'Căutare după titlu...',
  maxResults = 10,
}) => {
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<SearchResultItem[]>([]);
  const [loading, setLoading]     = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchResults = async () => {
      const term = query.trim();
      if (!term) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get<{ results: SearchResultItem[] }>(
          '/main/search',
          { params: { searchterm: term } }
        );
        const list = response.data.results;
        setResults(list.slice(0, maxResults));
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    const handler = window.setTimeout(fetchResults, 300);
    return () => window.clearTimeout(handler);
  }, [query, maxResults]);

  return (
    <div className="position-relative w-100">
      <Form.Control
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        className="py-2"
      />

      {loading && (
        <Spinner
          animation="border"
          size="sm"
          className="position-absolute"
          style={{ top: '50%', right: '1rem', transform: 'translateY(-50%)' }}
        />
      )}

      {results.length > 0 && (
        <ListGroup
          className="position-absolute w-100 mt-1 shadow-sm"
          style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
        >
          {results.map(img => (
            <ListGroup.Item
              key={img._id}
              action
              onClick={() => {
                if (onSelect) onSelect(img);
                else router.push(`/photos/${img._id}`);
              }}
            >
              {img.title}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
};

export default SearchBar;
