'use client';

import { useState, useEffect, useRef } from 'react';
import { AuthUser } from '@/types';
import { Avatar } from './ProfileDropdown';
import { supabase } from '@/lib/supabase';

interface Entry {
  id: string;
  author_id: string;
  author_name: string;
  message: string;
  created_at: string;
}

type Member = { id: string; name: string; avatar_url?: string | null };

interface Props {
  currentUser: AuthUser;
  members: Member[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function getDateStr(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getTimeStr(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function renderMessage(message: string) {
  return message.split(/(@\S+)/g).map((part, i) =>
    part.startsWith('@')
      ? <span key={i} className="font-semibold text-indigo-400">{part}</span>
      : part
  );
}

export default function Guestbook({ currentUser, members, open, onOpenChange }: Props) {
  const setOpen = onOpenChange;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<Member[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openRef = useRef(open);
  useEffect(() => { openRef.current = open; if (open) setHasUnread(false); }, [open]);

  useEffect(() => {
    fetch('/api/guestbook').then((r) => r.ok ? r.json() : []).then((data) => {
      setEntries(data.reverse());
    });
  }, []);

  useEffect(() => {
    const channel = supabase.channel('guestbook-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'guestbook' }, (payload) => {
        const entry = payload.new as Entry;
        setEntries((prev) => prev.some((e) => e.id === entry.id) ? prev : [...prev, entry]);
        if (!openRef.current) setHasUnread(true);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'guestbook' }, (payload) => {
        setEntries((prev) => prev.filter((e) => e.id !== (payload.old as Entry).id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, open]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);

    const cursor = e.target.selectionStart ?? val.length;
    const before = val.slice(0, cursor);
    const match = before.match(/@(\S*)$/);

    if (match) {
      const query = match[1].toLowerCase();
      setMentionQuery(query);
      setMentionSuggestions(
        members.filter((m) => m.name.toLowerCase().includes(query) && m.id !== currentUser.id)
      );
    } else {
      setMentionQuery(null);
      setMentionSuggestions([]);
    }
  };

  const handleMentionSelect = (member: Member) => {
    const cursor = inputRef.current?.selectionStart ?? text.length;
    const before = text.slice(0, cursor);
    const after = text.slice(cursor);
    const newBefore = before.replace(/@\S*$/, `@${member.name} `);
    setText(newBefore + after);
    setMentionQuery(null);
    setMentionSuggestions([]);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    setMentionQuery(null);
    setMentionSuggestions([]);
    setLoading(true);
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setEntries((prev) => [...prev, data]);
        setText('');
      }
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch('/api/guestbook', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const getMember = (name: string) => members.find((m) => m.name === name) ?? { name };
  const isMine = (entry: Entry) => entry.author_id === currentUser.id;

  return (
    <>
      <div className="fixed bottom-10 right-24 z-50">
        <button
          onClick={() => setOpen(!open)}
          className="w-12 h-12 bg-indigo-500 hover:bg-indigo-400 text-white rounded-full shadow-lg flex items-center justify-center text-xl transition-all"
        >
          {open ? '✕' : '💬'}
        </button>
        {hasUnread && !open && (
          <span className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </div>

      {open && (
        <div
          className="fixed bottom-10 right-40 z-50 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ height: '460px', animation: 'slideUp 0.2s ease-out' }}
        >
          <div className="px-5 py-4 border-b border-gray-100 shrink-0">
            <p className="font-bold text-gray-900">방명록</p>
            <p className="text-xs text-gray-400 mt-0.5">@이름으로 태그할 수 있어요</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {entries.length === 0 && (
              <div className="h-full flex items-center justify-center text-gray-300 text-sm">
                아직 메시지가 없습니다
              </div>
            )}
            {entries.map((entry, i) => {
              const prevDate = i > 0 ? getDateStr(entries[i - 1].created_at) : null;
              const thisDate = getDateStr(entry.created_at);
              const showDate = thisDate !== prevDate;
              return (
              <div key={entry.id}>
                {showDate && (
                  <div className="flex items-center gap-2 my-2">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[10px] text-gray-400 shrink-0">{thisDate}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                )}
              <div className={`flex gap-2 ${isMine(entry) ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isMine(entry) && <Avatar user={getMember(entry.author_name)} size={28} />}
                <div className={`max-w-[70%] flex flex-col gap-1 ${isMine(entry) ? 'items-end' : 'items-start'}`}>
                  {!isMine(entry) && (
                    <span className="text-xs text-gray-400 font-medium px-1">{entry.author_name}</span>
                  )}
                  <div className={`flex items-end gap-1 group/bubble ${isMine(entry) ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      isMine(entry)
                        ? 'bg-indigo-500 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    }`}>
                      {renderMessage(entry.message)}
                    </div>
                    <div className={`flex items-center gap-0.5 pb-0.5 ${isMine(entry) ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-[10px] text-gray-400 shrink-0">{getTimeStr(entry.created_at)}</span>
                      {isMine(entry) && (
                        <div className="relative opacity-0 group-hover/bubble:opacity-100 transition-opacity">
                          <button
                            onClick={() => setMenuId(menuId === entry.id ? null : entry.id)}
                            className="text-gray-400 hover:text-gray-600 text-xs px-0.5 leading-none"
                          >
                            ···
                          </button>
                          {menuId === entry.id && (
                            <div className="absolute bottom-full right-0 mb-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-10">
                              <button
                                onClick={() => { handleDelete(entry.id); setMenuId(null); }}
                                className="px-4 py-2 text-sm text-red-500 hover:bg-gray-50 whitespace-nowrap"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              </div>
            );})}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="px-3 py-3 border-t border-gray-100 shrink-0 relative">
            {mentionSuggestions.length > 0 && mentionQuery !== null && (
              <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-10">
                {mentionSuggestions.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleMentionSelect(m); }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <Avatar user={m} size={22} />
                    <span className="text-sm text-gray-700">{m.name}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={text}
                onChange={handleTextChange}
                placeholder="메시지 입력... (@태그 가능)"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="px-3 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:bg-gray-200 text-white text-sm rounded-xl transition-colors shrink-0"
              >
                전송
              </button>
            </div>
          </form>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
