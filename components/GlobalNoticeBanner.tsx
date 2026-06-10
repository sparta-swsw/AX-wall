'use client';

import { Link } from '@/types';

export default function GlobalNoticeBanner({ links }: { links: Link[] }) {
  const active = links.filter((l) => l.notice_active && l.notice);
  if (active.length === 0) return null;

  return (
    <div className="bg-amber-400 text-amber-950 px-4 py-2 text-sm font-medium shadow-sm">
      <div className="max-w-6xl mx-auto flex flex-col gap-1">
        {active.map((link) => (
          <div key={link.id} className="flex items-start gap-2">
            <span className="shrink-0 font-bold">[공지]</span>
            <span className="font-semibold">{link.title || link.url}</span>
            <span className="mx-1">—</span>
            <span>{link.notice}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
