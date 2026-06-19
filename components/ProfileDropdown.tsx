'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { AuthUser } from '@/types';

interface Props {
  currentUser: AuthUser;
  currentColor: string;
  onLogout: () => void;
  onAvatarChange: (url: string) => void;
  onColorChange: (color: string) => void;
}

export default function ProfileDropdown({ currentUser, currentColor, onLogout, onAvatarChange, onColorChange }: Props) {
  const [open, setOpen] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setShowPwForm(false); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/auth/avatar', { method: 'PUT', body: form });
      const data = await res.json();
      if (res.ok) onAvatarChange(data.avatar_url);
    } finally { setUploading(false); e.target.value = ''; }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.next !== pwForm.confirm) { setPwError('새 비밀번호가 일치하지 않습니다.'); return; }
    const res = await fetch('/api/auth/password', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.next }) });
    const data = await res.json();
    if (!res.ok) { setPwError(data.error); return; }
    setPwSuccess(true);
    setTimeout(() => { setOpen(false); setShowPwForm(false); setPwForm({ current: '', next: '', confirm: '' }); setPwSuccess(false); }, 1200);
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <Avatar user={currentUser} size={28} />
        <span className="text-gray-700 text-sm font-medium">{currentUser.name}</span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
            <div className="relative">
              <Avatar user={currentUser} size={40} />
              {uploading && <div className="absolute inset-0 bg-white/70 rounded-full flex items-center justify-center"><span className="text-gray-500 text-xs">...</span></div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 text-sm font-semibold">{currentUser.name}</p>
              <button onClick={() => fileRef.current?.click()} className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors">프로필 이미지 변경</button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
          </div>

          {!showPwForm ? (
            <>
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs text-gray-400 mb-2">카드 색상</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => colorRef.current?.click()}
                    className="w-7 h-7 rounded-full border-2 border-white shadow ring-1 ring-gray-200 hover:scale-110 transition-transform shrink-0"
                    style={{ background: currentColor }}
                  />
                  <span className="text-xs text-gray-500 font-mono">{currentColor}</span>
                  <button
                    onClick={() => colorRef.current?.click()}
                    className="ml-auto text-xs text-indigo-500 hover:text-indigo-400"
                  >
                    변경
                  </button>
                  <input
                    ref={colorRef}
                    type="color"
                    value={currentColor}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="sr-only"
                  />
                </div>
              </div>
              <button onClick={() => setShowPwForm(true)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">비밀번호 변경</button>
              <div className="border-t border-gray-100" />
              <button onClick={onLogout} className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-50 transition-colors">로그아웃</button>
            </>
          ) : (
            <form onSubmit={handlePasswordChange} className="p-4 space-y-3">
              {(['current', 'next', 'confirm'] as const).map((field) => (
                <input key={field} type="password" value={pwForm[field]} onChange={(e) => setPwForm((f) => ({ ...f, [field]: e.target.value }))}
                  placeholder={field === 'current' ? '현재 비밀번호' : field === 'next' ? '새 비밀번호' : '새 비밀번호 확인'}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400" />
              ))}
              {pwError && <p className="text-red-500 text-xs">{pwError}</p>}
              {pwSuccess && <p className="text-emerald-600 text-xs">변경되었습니다.</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowPwForm(false)} className="flex-1 py-1.5 text-xs border border-gray-200 text-gray-500 rounded-xl">취소</button>
                <button type="submit" className="flex-1 py-1.5 text-xs bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl">변경</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export function Avatar({ user, size = 32 }: { user: { name: string; avatar_url?: string | null; color?: string | null }; size?: number }) {
  const crown = user.name === '효승';
  const crownSize = Math.round(size * 0.45);

  const inner = user.avatar_url ? (
    <div className="rounded-full overflow-hidden shrink-0" style={{ width: size, height: size }}>
      <Image src={user.avatar_url} alt={user.name} width={size} height={size} className="w-full h-full object-cover" unoptimized />
    </div>
  ) : (
    <div className="rounded-full flex items-center justify-center shrink-0 text-white font-bold"
      style={{ width: size, height: size, fontSize: size * 0.4, background: user.color || '#6366F1' }}>
      {user.name.charAt(0)}
    </div>
  );

  if (!crown) return inner;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {inner}
      <span
        className="absolute pointer-events-none"
        style={{ fontSize: crownSize, top: -crownSize * 0.5, left: -crownSize * 0.3, lineHeight: 1, transform: 'rotate(-32deg)' }}
      >
        👑
      </span>
    </div>
  );
}
