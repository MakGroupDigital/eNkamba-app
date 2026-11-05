'use client';

import { useEffect, useState } from 'react';

// Detects an on-screen keyboard by watching the visual viewport shrink well below the layout viewport.
export function useIsKeyboardOpen(threshold = 150) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => setIsOpen(window.innerHeight - viewport.height > threshold);
    update();
    viewport.addEventListener('resize', update);
    return () => viewport.removeEventListener('resize', update);
  }, [threshold]);

  return isOpen;
}
