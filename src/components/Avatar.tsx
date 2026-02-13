import React from 'react';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  sizeClassName?: string;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  imageUrl,
  sizeClassName = 'h-9 w-9',
  className = '',
  onClick,
}) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const sharedClassName = `inline-flex items-center justify-center rounded-full overflow-hidden border border-white/20 bg-white/10 ${sizeClassName} ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={sharedClassName}
        aria-label={`Open profile for ${name}`}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] font-semibold text-white/80">{initial}</span>
        )}
      </button>
    );
  }

  return (
    <span className={sharedClassName} aria-label={name}>
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-[10px] font-semibold text-white/80">{initial}</span>
      )}
    </span>
  );
};
