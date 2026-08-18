'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/stock/${query.trim().toUpperCase()}`);
    }
  };

  return (
    <motion.form 
      whileHover={{ scale: 1.01 }}
      onSubmit={handleSearch} 
      className={`flex w-full items-center space-x-3 glass-panel p-2 rounded-2xl transition-all duration-300 ${
        isFocused ? 'border-primary/50 shadow-[0_0_40px_-10px_var(--color-primary)] bg-card/80' : 'border-white/10 hover:border-white/20'
      }`}
    >
      <div className="relative w-full">
        <Search className={`absolute left-4 top-3.5 h-5 w-5 transition-colors duration-300 ${isFocused ? 'text-primary' : 'text-muted-foreground'}`} />
        <Input
          type="text"
          placeholder="Search NSE/BSE stocks (e.g., RELIANCE, TCS, IRFC)"
          className="w-full pl-12 h-12 bg-transparent border-none text-foreground text-lg placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </div>
      <Button 
        type="submit" 
        className="h-12 px-8 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_var(--color-primary)] opacity-90 hover:opacity-100 transition-all"
      >
        Analyze
      </Button>
    </motion.form>
  );
}
