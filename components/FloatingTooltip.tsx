'use client';

import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';

interface Props {
  visible: boolean;
  anchorRef: React.RefObject<HTMLElement>;
  text: string;
}

export default function FloatingTooltip({ visible, anchorRef, text }: Props) {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (visible && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ x: rect.left + rect.width / 2, y: rect.top });
    }
  }, [visible, anchorRef]);

  if (!visible || typeof document === 'undefined') return null;

  return createPortal(
    <span
      className="fixed z-[9999] whitespace-nowrap bg-gray-800 text-white text-xs px-2.5 py-1.5 rounded-lg pointer-events-none shadow-lg"
      style={{ left: pos.x, top: pos.y - 36, transform: 'translateX(-50%)' }}
    >
      {text}
      <span className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-gray-800" />
    </span>,
    document.body
  );
}
