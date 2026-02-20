import React from 'react';
import { cn } from '../lib/utils';

interface HomepageSearchBarProps {
  className?: string;
  placeholder?: string;
  onSearch?: (value: string) => void;
}

export const HomepageSearchBar: React.FC<HomepageSearchBarProps> = ({
  className,
  placeholder = 'Search...',
  onSearch,
}) => {
  const [value, setValue] = React.useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch?.(value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'glass-secondary rounded-full flex items-center gap-3 px-4 sm:px-6 py-1.5 w-full max-w-xl text-foreground overflow-hidden',
        className
      )}
    >
      <input
        type="text"
        className="flex-1 min-w-0 bg-transparent outline-none text-base sm:text-lg px-2 text-foreground placeholder:text-muted-foreground"
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button
        type="submit"
        className="px-4 sm:px-5 py-2 rounded-full bg-hero-gradient text-foreground sm:font-semibold text-xs sm:text-base transition-colors hover:brightness-110 shrink-0"
      >
        Search
      </button>
    </form>
  );
};
