'use client';

import { Avatar } from './ProfileDropdown';
import { getAuthorColor } from '@/lib/colors';

type Member = { id: string; name: string; avatar_url?: string | null; color?: string | null };

interface Props {
  members: Member[];
  selected: string | null;
  onSelect: (name: string | null) => void;
  linkCounts: Record<string, number>;
}

export default function Sidebar({ members, selected, onSelect, linkCounts }: Props) {
  return (
    <aside className="w-44 shrink-0 sticky top-[57px] self-start h-[calc(100vh-57px)] overflow-y-auto py-6 px-3 border-r border-gray-200 bg-white/60 backdrop-blur">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">구성원</p>
      <ul className="space-y-1">
        {members.map((m) => {
          const color = getAuthorColor(m.name, members);
          const isSelected = selected === m.name;
          return (
            <li key={m.id}>
              <button
                onClick={() => onSelect(isSelected ? null : m.name)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-colors ${
                  isSelected ? 'font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
                style={isSelected ? { background: color.border + '18', color: color.border } : undefined}
              >
                <Avatar user={m} size={28} />
                <span className="truncate">{m.name}</span>
                {linkCounts[m.name] != null && (
                  <span className="ml-auto text-xs text-gray-400 shrink-0">{linkCounts[m.name]}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
