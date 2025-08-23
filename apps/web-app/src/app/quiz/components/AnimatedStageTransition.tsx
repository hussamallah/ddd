'use client';

import React, { useState, useEffect } from 'react';

interface AnimatedStageTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  onTransitionComplete?: () => void;
  className?: string;
}

export default function AnimatedStageTransition({
  children,
  isVisible,
  onTransitionComplete,
  className = ''
}: AnimatedStageTransitionProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Small delay to ensure DOM is ready for animation
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(true);
      // Wait for exit animation to complete before calling transition complete
      const timer = setTimeout(() => {
        onTransitionComplete?.();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onTransitionComplete]);

  return (
    <div
      className={`transition-all duration-300 ease-in-out ${
        isVisible && !isAnimating
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      } ${className}`}
      style={{
        display: isVisible ? 'block' : 'none'
      }}
    >
      {children}
    </div>
  );
}
