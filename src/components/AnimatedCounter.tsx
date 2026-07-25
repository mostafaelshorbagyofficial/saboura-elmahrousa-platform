'use client';

import React, { useState, useEffect } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}

export default function AnimatedCounter({ value, duration = 800, suffix = '', prefix = '' }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.round(value);
    
    if (end <= 0) {
      setCount(0);
      return;
    }

    if (start === end) {
      setCount(end);
      return;
    }

    const stepTime = Math.max(Math.floor(duration / Math.max(end, 1)), 16);
    
    let timer = setInterval(() => {
      start += Math.ceil((end - start) / 8);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}
