'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/stock/${query.trim().toUpperCase()}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center space-x-2">
      <div className="relative w-full">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by symbol (e.g., RELIANCE)"
          className="w-full pl-9 bg-slate-900/50 border-slate-800 text-slate-100 placeholder:text-slate-500 focus-visible:ring-emerald-500"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
        Analyze
      </Button>
    </form>
  );
}
