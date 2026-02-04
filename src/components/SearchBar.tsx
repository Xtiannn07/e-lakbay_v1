import React from 'react';
import { cn } from '../lib/utils';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onSearch?: (value: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ className, placeholder = 'Search...', onSearch }) => {
  const [value, setValue] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'glass-secondary shadow-xl rounded-full flex items-center gap-3 px-2 md:px-6 py-1 md:py-2 w-full max-w-xl text-white',
        className
      )}
    >
      <input
        type="text"
        className="flex-1 bg-transparent outline-none text-sm md:text-lg px-2 text-white placeholder:text-white/70"
        placeholder={placeholder}
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <button
        type="submit"
        className="px-5 py-2 rounded-full bg-hero-gradient text-white font-semibold text-sm md:text-lg transition-colors hover:brightness-110 shrink-0"
      >
        Search
      </button>
    </form>
  );
};
