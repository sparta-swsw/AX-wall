'use client';

import { useState } from 'react';
import { Avatar } from './ProfileDropdown';
import { getAuthorColor, CATEGORY_STYLE, STATUS_STYLE } from '@/lib/colors';

type Member = { id: string; name: string; avatar_url?: string | null; color?: string | null };

interface Props {
  headerHeight?: number;
  members: Member[];
  selected: string | null;
  onSelect: (name: string | null) => void;
  linkCounts: Record<string, number>;
  filterCategories: string[];
  filterStatuses: string[];
  filterTargets: string[];
  onToggle: (type: 'category' | 'status' | 'target', val: string) => void;
  onClearFilters: () => void;
}

const TARGETS = ['수강생', '전사', '팀', '파트', '트랙', '개인'];

export default function Sidebar({ headerHeight = 57, members, selected, onSelect, linkCounts, filterCategories, filterStatuses, filterTargets, onToggle, onClearFilters }: Props) {
  const [membersOpen, setMembersOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const hasFilter = filterCategories.length + filterStatuses.length + filterTargets.length > 0;

  return (
    <aside className="fixed left-0 w-52 overflow-y-auto py-4 px-3 border-r border-gray-200 bg-white/60 backdrop-blur z-30 space-y-3"
      style={{ top: headerHeight, height: `calc(100vh - ${headerHeight}px)` }}>

      {/* 구성원 섹션 */}
      <div>
        <button onClick={() => setMembersOpen(!membersOpen)}
          className="w-full flex items-center justify-between px-2 mb-2 group">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">구성원</p>
          <span className="text-gray-300 group-hover:text-gray-500 text-xs">{membersOpen ? '▲' : '▼'}</span>
        </button>
        {membersOpen && (
          <ul className="space-y-1">
            {members.map((m) => {
              const color = getAuthorColor(m.name, members);
              const isSelected = selected === m.name;
              return (
                <li key={m.id}>
                  <button onClick={() => onSelect(isSelected ? null : m.name)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm transition-colors ${isSelected ? 'font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
                    style={isSelected ? { background: color.border + '18', color: color.border } : undefined}>
                    <Avatar user={m} size={26} />
                    <span className="truncate text-xs">{m.name}</span>
                    {linkCounts[m.name] != null && (
                      <span className="ml-auto text-xs text-gray-400 shrink-0">{linkCounts[m.name]}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-gray-200" />

      {/* 필터 섹션 */}
      <div>
        <button onClick={() => setFiltersOpen(!filtersOpen)}
          className="w-full flex items-center justify-between px-2 mb-2 group">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">필터</p>
            {hasFilter && (
              <span className="bg-indigo-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                {filterCategories.length + filterStatuses.length + filterTargets.length}
              </span>
            )}
          </div>
          <span className="text-gray-300 group-hover:text-gray-500 text-xs">{filtersOpen ? '▲' : '▼'}</span>
        </button>

        {filtersOpen && (
          <div className="space-y-3 overflow-hidden pl-3">
            {/* 카테고리 */}
            <div>
              <button onClick={() => setCategoryOpen(!categoryOpen)}
                className="flex items-center gap-1 mb-1">
                <p className="text-xs text-gray-500 font-medium">카테고리</p>
                <span className="text-gray-300 text-[9px]">{categoryOpen ? '▲' : '▼'}</span>
              </button>
              {categoryOpen && (
                <div className="flex flex-col gap-0.5">
                  {(Object.keys(CATEGORY_STYLE) as string[]).map(c => {
                    const s = CATEGORY_STYLE[c as keyof typeof CATEGORY_STYLE];
                    const on = filterCategories.includes(c);
                    return (
                      <button key={c} onClick={() => onToggle('category', c)}
                        className="w-full text-left px-2 py-1 rounded-lg text-xs font-medium transition-all"
                        style={on ? { background: s.text, color: '#fff' } : { color: '#9CA3AF' }}>
                        {c}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 상태 */}
            <div>
              <button onClick={() => setStatusOpen(!statusOpen)}
                className="flex items-center gap-1 mb-1">
                <p className="text-xs text-gray-500 font-medium">상태</p>
                <span className="text-gray-300 text-[9px]">{statusOpen ? '▲' : '▼'}</span>
              </button>
              {statusOpen && (
                <div className="flex flex-col gap-0.5">
                  {(Object.keys(STATUS_STYLE) as string[]).map(s => {
                    const st = STATUS_STYLE[s as keyof typeof STATUS_STYLE];
                    const on = filterStatuses.includes(s);
                    return (
                      <button key={s} onClick={() => onToggle('status', s)}
                        className="w-full text-left px-2 py-1 rounded-lg text-xs font-medium transition-all"
                        style={on ? { background: st.text, color: '#fff' } : { color: '#9CA3AF' }}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 대상 */}
            <div>
              <button onClick={() => setTargetOpen(!targetOpen)}
                className="flex items-center gap-1 mb-1">
                <p className="text-xs text-gray-500 font-medium">대상</p>
                <span className="text-gray-300 text-[9px]">{targetOpen ? '▲' : '▼'}</span>
              </button>
              {targetOpen && (
                <div className="flex flex-col gap-0.5">
                  {TARGETS.map(t => {
                    const on = filterTargets.includes(t);
                    return (
                      <button key={t} onClick={() => onToggle('target', t)}
                        className="w-full text-left px-2 py-1 rounded-lg text-xs font-medium transition-all"
                        style={on ? { background: '#6366F1', color: '#fff' } : { color: '#9CA3AF' }}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {hasFilter && (
              <button onClick={onClearFilters} className="text-[10px] text-red-400 hover:text-red-500 px-1">
                초기화
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
