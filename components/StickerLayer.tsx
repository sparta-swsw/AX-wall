'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AuthUser } from '@/types';
import { supabase } from '@/lib/supabase';

interface Sticker {
  id: string;
  emoji: string;
  x: number; // px from left of document
  y: number; // px from top of document
  author_id: string;
  author_name: string;
}

const EMOJIS = [
  '❤️', '🔥', '⭐', '✨', '🎉', '👏', '😍', '🚀',
  '💯', '🌟', '😂', '🥳', '💪', '🎯', '🌈', '💡',
  '🙌', '👀', '💎', '🎨', '🍀', '🫶', '😎', '🤩',
];

export default function StickerLayer({ currentUser }: { currentUser: AuthUser }) {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const dragging = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestStickers = useRef(stickers);
  latestStickers.current = stickers;

  useEffect(() => {
    fetch('/api/stickers').then((r) => r.ok ? r.json() : []).then(setStickers);

    const channel = supabase
      .channel('stickers')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stickers' }, (payload) => {
        setStickers((p) => {
          if (p.find((s) => s.id === payload.new.id)) return p;
          return [...p, payload.new as Sticker];
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stickers' }, (payload) => {
        if (dragging.current?.id === payload.new.id) return;
        setStickers((p) => p.map((s) => s.id === payload.new.id ? { ...s, x: payload.new.x, y: payload.new.y } : s));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'stickers' }, (payload) => {
        setStickers((p) => p.filter((s) => s.id !== payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAdd = async (emoji: string) => {
    setShowPicker(false);
    const x = window.scrollX + 120 + Math.random() * (window.innerWidth - 240);
    const y = window.scrollY + 120 + Math.random() * (window.innerHeight - 240);
    const res = await fetch('/api/stickers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji, x, y }),
    });
    if (res.ok) { const data = await res.json(); setStickers((p) => [...p, data]); }
  };

  const handleDelete = async (id: string) => {
    setStickers((p) => p.filter((s) => s.id !== id));
    await fetch(`/api/stickers/${id}`, { method: 'DELETE' });
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('다른 구성원의 이모지도 모두 지워져요!\n지우시겠어요?')) return;
    setShowPicker(false);
    setStickers([]);
    await fetch('/api/stickers', { method: 'DELETE' });
  };

  const handleMouseDown = (e: React.MouseEvent, sticker: Sticker) => {
    e.preventDefault();
    dragging.current = {
      id: sticker.id,
      ox: e.clientX + window.scrollX - sticker.x,
      oy: e.clientY + window.scrollY - sticker.y,
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    const { id, ox, oy } = dragging.current;
    const x = e.clientX + window.scrollX - ox;
    const y = e.clientY + window.scrollY - oy;
    setStickers((p) => p.map((s) => s.id === id ? { ...s, x, y } : s));
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!dragging.current) return;
    const id = dragging.current.id;
    dragging.current = null;
    const sticker = latestStickers.current.find((s) => s.id === id);
    if (!sticker) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch(`/api/stickers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: sticker.x, y: sticker.y }),
      });
    }, 500);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <>
      {stickers.map((s) => {
        return (
          <div
            key={s.id}
            onMouseDown={(e) => handleMouseDown(e, s)}
            onMouseEnter={() => setHoverId(s.id)}
            onMouseLeave={() => setHoverId(null)}
            className="absolute z-30 select-none"
            style={{
              left: s.x,
              top: s.y,
              cursor: 'grab',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span style={{ fontSize: '3rem', lineHeight: 1 }}>{s.emoji}</span>
            {hoverId === s.id && (
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => handleDelete(s.id)}
                className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center leading-none shadow"
              >
                ×
              </button>
            )}
          </div>
        );
      })}

      <div className="fixed bottom-24 right-24 z-50">
        {showPicker && (
          <div
            className="absolute bottom-10 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 grid grid-cols-6 gap-1.5 w-56"
            style={{ animation: 'slideUp 0.15s ease-out' }}
          >
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleAdd(emoji)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-xl"
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={handleDeleteAll}
              className="col-span-6 mt-1 py-1.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              이모지 전체 삭제
            </button>
          </div>
        )}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-12 h-12 bg-white border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-500 rounded-full shadow-md flex items-center justify-center text-xl transition-all"
          title="스티커 붙이기"
        >
          ⭐
        </button>
      </div>
    </>
  );
}
