import { useState, useEffect } from 'react';

interface HeroTerminalTaglineProps {
  className?: string;
}

export function HeroTerminalTagline({
  className = '',
}: HeroTerminalTaglineProps) {
  const text = 'Markdown notes without the noise.';
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingDone, setIsTypingDone] = useState(false);
  const [cursorBlinks, setCursorBlinks] = useState(0);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayedText(text);
      setIsTypingDone(true);
      return;
    }

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex++;
      setDisplayedText(text.slice(0, currentIndex));
      if (currentIndex >= text.length) {
        clearInterval(interval);
        setIsTypingDone(true);
      }
    }, 42); // Clean typing speed ~40ms

    return () => clearInterval(interval);
  }, []);

  // Blink cursor 2 times after typing finishes, then halt
  useEffect(() => {
    if (!isTypingDone) return;
    const blinkInterval = setInterval(() => {
      setCursorBlinks((prev) => {
        if (prev >= 4) {
          clearInterval(blinkInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 450);

    return () => clearInterval(blinkInterval);
  }, [isTypingDone]);

  const showCursor = !isTypingDone || cursorBlinks < 4;

  return (
    <div
      className={`inline-flex items-center font-mono text-sm sm:text-base text-stack-bone tracking-wide ${className}`}
    >
      <span>{displayedText}</span>
      <span
        className={`ml-1 inline-block w-2 h-4 bg-stack-red-hover transition-opacity duration-150 ${
          showCursor ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
