'use client';

type CrumiState = 'default' | 'analyze' | 'celebrate' | 'alert' | 'working' | 'sad';

interface CrumiAvatarProps {
  state?: CrumiState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function CrumiAvatar({ state = 'default', size = 'md', className = '' }: CrumiAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-base',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
    xl: 'w-24 h-24 text-5xl',
  };

  const bgColors = {
    default: 'bg-[var(--crumi-default)]',
    analyze: 'bg-[var(--crumi-analyze)]',
    celebrate: 'bg-[var(--crumi-celebrate)]',
    alert: 'bg-[var(--crumi-alert)]',
    working: 'bg-[var(--crumi-working)]',
    sad: 'bg-[var(--crumi-sad)]',
  };

  const emojis = {
    default: '😊',
    analyze: '🧐',
    celebrate: '🎉',
    alert: '💡',
    working: '💻',
    sad: '😢',
  };

  return (
    <div
      className={`flex items-center justify-center rounded-full shadow-sm transition-all duration-300 ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: `var(--crumi-${state}, var(--crumi-default))` }}
    >
      <span className="drop-shadow-sm">{emojis[state]}</span>
    </div>
  );
}
