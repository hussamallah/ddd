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
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setIsAnimating(true);
      // Small delay to ensure DOM is ready for animation
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(true);
      // Wait for exit animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
        onTransitionComplete?.();
      }, 100); // Reduced from 300ms to 100ms to prevent component overlap
      return () => clearTimeout(timer);
    }
  }, [isVisible, onTransitionComplete]);

  if (!shouldRender) return null;

  return (
    <div
      className={`transition-all duration-300 ease-in-out ${
        isVisible && !isAnimating
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      {children}
    </div>
  );
}
