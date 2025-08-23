'use client';

import React from 'react';

interface AnimatedProgressBarProps {
  progress: number;
  color?: 'blue' | 'green' | 'yellow' | 'red';
  height?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

export default function AnimatedProgressBar({
  progress,
  color = 'blue',
  height = 'md',
  showPercentage = true,
  className = ''
}: AnimatedProgressBarProps) {
  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };

  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`w-full ${className}`}>
      {showPercentage && (
        <div className="flex justify-between text-sm text-neutral-400 mb-2">
          <span>Progress</span>
          <span>{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div className={`w-full bg-neutral-700 rounded-full ${heightClasses[height]} overflow-hidden`}>
        <div 
          className={`${colorClasses[color]} ${heightClasses[height]} rounded-full transition-all duration-700 ease-out`}
          style={{ 
            width: `${clampedProgress}%`,
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </div>
    </div>
  );
}
