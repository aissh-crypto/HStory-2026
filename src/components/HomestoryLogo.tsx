import React from 'react';

interface HomestoryLogoProps {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  onClick?: () => void;
  variant?: 'light' | 'dark';
  markOnly?: boolean;
}

export const HomestoryLogo: React.FC<HomestoryLogoProps> = ({
  className = '',
  markClassName = 'w-8 h-8 sm:w-9 sm:h-9',
  textClassName = 'text-lg sm:text-2xl',
  onClick,
  variant = 'light',
  markOnly = false,
}) => {
  return (
    <div
      onClick={onClick}
      onDoubleClick={(e) => {
        // Prevent any double-click text selection or unwanted event triggering
        e.preventDefault();
        e.stopPropagation();
      }}
      className={`inline-flex items-center gap-2.5 select-none transition-opacity ${
        onClick ? 'cursor-pointer hover:opacity-95' : ''
      } ${className}`}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Constant HomeStory Brandmark - Immutable Shared Icon Asset */}
      <div className={`${markClassName} shrink-0 relative flex items-center justify-center pointer-events-none select-none`}>
        <img
          src="/HomeStory-Logo-Icon.png"
          alt="HomeStory Logo"
          draggable={false}
          className="w-full h-full object-contain drop-shadow-xs pointer-events-none select-none"
          onError={(e) => {
            // Fallback to SVG if PNG fails
            const target = e.currentTarget;
            if (target.src !== '/HomeStory-Logo-Icon.svg') {
              target.src = '/HomeStory-Logo-Icon.svg';
            }
          }}
        />
      </div>

      {/* Constant HomeStory Wordmark with Vibrant Gradient Accent */}
      {!markOnly && (
        <span
          className={`font-serif font-extrabold tracking-tight flex items-baseline pointer-events-none select-none ${textClassName} ${
            variant === 'dark' ? 'text-white' : 'text-[#1E2A44]'
          }`}
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        >
          <span>Home</span>
          <span className="bg-gradient-to-r from-[#2563EB] via-[#F97316] to-[#EF4444] bg-clip-text text-transparent">
            story
          </span>
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#EC4899] inline-block ml-0.5" />
        </span>
      )}
    </div>
  );
};
