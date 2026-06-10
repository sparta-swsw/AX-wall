'use client';

import { useEffect, useRef, useState } from 'react';
import { Link } from '@/types';

interface Props {
  links: Link[];
  onOpenLink?: (id: string) => void;
}

const SPEED = 60;

export default function GlobalNoticeBanner({ links, onOpenLink }: Props) {
  const active = links.filter((l) => l.notice_active && l.notice);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const [animStyle, setAnimStyle] = useState<React.CSSProperties>({});
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;
    const cw = containerRef.current.offsetWidth;
    const tw = contentRef.current.scrollWidth;
    const duration = (cw + tw + 40) / SPEED;

    setAnimStyle({
      ['--from' as string]: `${cw + 20}px`,
      ['--to' as string]: `${-(tw + 20)}px`,
      animation: `marquee-js ${duration}s linear infinite`,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.length]);

  if (active.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="bg-yellow-400 text-yellow-950 py-2 text-sm font-medium shadow-md overflow-hidden cursor-pointer"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span
        ref={contentRef}
        className="inline-block whitespace-nowrap"
        style={{ ...animStyle, animationPlayState: paused ? 'paused' : 'running' }}
      >
        {active.map((link, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-8 hover:underline"
            onClick={() => onOpenLink?.(link.id)}
          >
            <span className="font-bold">[공지]</span>
            <span className="font-semibold">{link.title || link.url}</span>
            <span className="mx-0.5 opacity-60">—</span>
            <span>{link.notice}</span>
          </span>
        ))}
      </span>
    </div>
  );
}
