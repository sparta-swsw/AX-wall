'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Link, Comment, AuthUser, LinkCategory, LinkTarget, LinkStatus } from '@/types';
import { CATEGORY_STYLE, STATUS_STYLE } from '@/lib/badge';
import { handleBulletKeyDown } from '@/lib/autoBullet';
import FloatingTooltip from './FloatingTooltip';

function renderMemo(text: string) {
  return text.split('\n').filter(l => l.trim()).map((line, i) => {
    const isBullet = /^[-•]\s/.test(line);
    return (
      <div key={i} className={isBullet ? 'flex gap-1' : ''}>
        {isBullet && <span className="shrink-0">•</span>}
        <span>{isBullet ? line.replace(/^[-•]\s/, '') : line}</span>
      </div>
    );
  });
}

const CATEGORIES: LinkCategory[] = ['스킬', '배포', '자동화'];
const TARGETS: LinkTarget[] = ['수강생', '전사', '팀', '파트', '트랙', '개인'];
const STATUSES: { value: LinkStatus; color: string }[] = [
  { value: '기획 중', color: '#9CA3AF' },
  { value: '개발 중', color: '#3B82F6' },
  { value: '홀딩 중', color: '#F59E0B' },
  { value: '사용 중', color: '#10B981' },
  { value: '사용 종료', color: '#EF4444' },
  { value: '폐기', color: '#6B7280' },
];
import CommentSection from './CommentSection';
import { Avatar } from './ProfileDropdown';

type Member = { id: string; name: string; avatar_url?: string | null };

interface Props {
  link: Link;
  currentUser: AuthUser;
  members: Member[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (link: Link) => void;
}

export default function LinkDetailModal({ link, currentUser, members, onClose, onDelete, onUpdate }: Props) {
  const author = members.find((m) => m.name === link.author_name) ?? { name: link.author_name ?? '' };
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit' | 'notice'>('view');
  const [noticeText, setNoticeText] = useState(link.notice ?? '');
  const [likeLoading, setLikeLoading] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [selfLikeMsg, setSelfLikeMsg] = useState(false);
  const likeButtonRef = useRef<HTMLButtonElement>(null);
  const [editForm, setEditForm] = useState({
    title: link.title ?? '',
    url: link.url ?? '',
    memo: link.memo ?? '',
    usage_url: link.usage_url ?? '',
    category: link.category ?? null as LinkCategory | null,
    status: link.status ?? '기획 중' as LinkStatus,
    target: link.target ?? [] as LinkTarget[],
  });
  const [editLoading, setEditLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwner = link.author_id === currentUser.id;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLike = async () => {
    if (link.author_id === currentUser.id) {
      setSelfLikeMsg(true);
      setTimeout(() => setSelfLikeMsg(false), 2000);
      return;
    }
    if (likeLoading) return;
    setLikeLoading(true);
    if (!link.liked_by_me) { setLikeAnim(true); setTimeout(() => setLikeAnim(false), 600); }
    try {
      const res = await fetch('/api/likes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ link_id: link.id }) });
      const data = await res.json();
      if (res.ok) onUpdate({ ...link, liked_by_me: data.liked, likes_count: data.liked ? link.likes_count + 1 : link.likes_count - 1 });
    } finally { setLikeLoading(false); }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!confirm('삭제하시겠습니까?')) return;
    await fetch(`/api/links/${link.id}`, { method: 'DELETE' });
    onDelete(link.id); onClose();
  };

  const handleEditSave = async () => {
    if (!editForm.title.trim() || editLoading) return;
    if (editForm.category === '배포' && !editForm.url.trim()) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/links/${link.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: editForm.title.trim(), url: editForm.url.trim() || null, memo: editForm.memo.trim() || null, usage_url: editForm.usage_url.trim() || null, category: editForm.category, status: editForm.status, target: editForm.target.length > 0 ? editForm.target : null, }) });
      if (res.ok) { const data = await res.json(); onUpdate({ ...link, ...data }); setMode('view'); }
    } finally { setEditLoading(false); }
  };

  const handleNoticeSave = async (active: boolean) => {
    const res = await fetch(`/api/links/${link.id}/notice`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notice: noticeText, notice_active: active }) });
    if (res.ok) { const data = await res.json(); onUpdate({ ...link, notice: data.notice, notice_active: data.notice_active }); setMode('view'); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* 고정 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-3">
            <Avatar user={author} size={28} />
            <span className="font-semibold text-gray-900 text-sm truncate">{link.title || link.url}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isOwner && (
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors text-lg"
                >
                  ···
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-10">
                    <button onClick={() => { setMode('edit'); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">수정</button>
                    <button onClick={() => { setMode('notice'); setMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${link.notice_active ? 'text-amber-600 font-medium' : 'text-gray-700'}`}>
                      공지 {link.notice_active ? '(ON)' : ''}
                    </button>
                    <div className="border-t border-gray-100" />
                    <button onClick={handleDelete} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50">삭제</button>
                  </div>
                )}
              </div>
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">✕</button>
          </div>
        </div>

        {/* 스크롤 영역 */}
        <div className="overflow-y-auto flex-1">
          {link.notice_active && link.notice && (
            <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 text-sm font-semibold text-amber-700">
              공지 — {link.notice}
            </div>
          )}

          {link.image && mode === 'view' && (
            <div className="relative w-full h-52 bg-gray-100">
              <Image src={link.image} alt={link.title ?? ''} fill className="object-cover object-center" unoptimized />
            </div>
          )}

          <div className="p-6 space-y-4">
            {mode === 'edit' && (
              <div className="space-y-3">
                {/* 카테고리 */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">카테고리</label>
                  <div className="flex gap-2">
                    {CATEGORIES.map((c) => (
                      <button key={c} type="button" onClick={() => setEditForm((f) => ({ ...f, category: c }))}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-colors ${editForm.category === c ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 제목 */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">제목</label>
                  <input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-400" />
                </div>
                {/* 배포 링크 + 플랫폼 */}
                {editForm.category === '배포' && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">링크</label>
                      <input value={editForm.url} onChange={(e) => setEditForm((f) => ({ ...f, url: e.target.value }))}
                        placeholder="https://..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-400" />
                    </div>
                  </>
                )}
                {/* 설명 */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">설명</label>
                  <textarea value={editForm.memo} onChange={(e) => setEditForm((f) => ({ ...f, memo: e.target.value }))}
                    onKeyDown={(e) => handleBulletKeyDown(e, editForm.memo, (v) => setEditForm((f) => ({ ...f, memo: v })))} rows={4}
                    placeholder={'설명 입력 (불렛 사용 가능)'}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-400 resize-none" />
                </div>
                {/* 대상 */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">대상</label>
                  <div className="flex flex-wrap gap-1.5">
                    {TARGETS.map((t) => (
                      <button key={t} type="button"
                        onClick={() => setEditForm((f) => ({ ...f, target: f.target.includes(t) ? f.target.filter(x => x !== t) : f.target.length >= 3 ? f.target : [...f.target, t] }))}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${editForm.target.includes(t) ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 사용법 링크 */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">사용법 링크</label>
                  <input value={editForm.usage_url} onChange={(e) => setEditForm((f) => ({ ...f, usage_url: e.target.value }))}
                    placeholder="https://..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-400" />
                </div>
                {/* 상태 */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">상태</label>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map((s) => (
                      <button key={s.value} type="button" onClick={() => setEditForm((f) => ({ ...f, status: s.value }))}
                        className="px-2.5 py-1 rounded-full text-xs font-medium border transition-colors"
                        style={editForm.status === s.value ? { background: s.color, color: '#fff', borderColor: s.color } : { background: '#fff', color: '#6B7280', borderColor: '#E5E7EB' }}>
                        {s.value}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setMode('view')} className="flex-1 py-2 border border-gray-200 text-gray-500 text-sm rounded-xl">취소</button>
                  <button onClick={handleEditSave} disabled={editLoading} className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium rounded-xl">{editLoading ? '저장 중...' : '저장'}</button>
                </div>
              </div>
            )}

            {mode === 'notice' && (
              <div className="space-y-3">
                <label className="block text-sm text-gray-600 font-medium">공지 내용</label>
                <textarea value={noticeText} onChange={(e) => setNoticeText(e.target.value)} placeholder="업데이트 중 안내 등" rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-amber-400 resize-none" />
                <div className="flex gap-2">
                  <button onClick={() => setMode('view')} className="flex-1 py-2 border border-gray-200 text-gray-500 text-sm rounded-xl">취소</button>
                  <button onClick={() => handleNoticeSave(true)} className="flex-1 py-2 bg-amber-400 hover:bg-amber-300 text-amber-950 text-sm font-semibold rounded-xl">공지 활성화</button>
                  {link.notice_active && <button onClick={() => handleNoticeSave(false)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-xl">공지 해제</button>}
                </div>
              </div>
            )}

            {mode === 'view' && (
              <>
                <div>
                  {(link.category || link.status || (link.target && link.target.length > 0)) && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {link.category && CATEGORY_STYLE[link.category] && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: CATEGORY_STYLE[link.category].bg, color: CATEGORY_STYLE[link.category].text }}>
                          {CATEGORY_STYLE[link.category].label}
                        </span>
                      )}
                      {link.status && STATUS_STYLE[link.status] && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: STATUS_STYLE[link.status].bg, color: STATUS_STYLE[link.status].text }}>
                          {link.status}
                        </span>
                      )}
                      {link.target?.map((t) => (
                        <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">{t}</span>
                      ))}
                    </div>
                  )}
                  {link.url ? (
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-base font-bold text-gray-900 hover:text-indigo-600 transition-colors leading-snug">{link.title || link.url}</a>
                  ) : (
                    <p className="text-base font-bold text-gray-900 leading-snug">{link.title}</p>
                  )}
                  {link.url && <p className="text-gray-400 text-xs mt-1 truncate">{link.url}</p>}
                </div>
                {link.memo && (
                  <div className="text-gray-600 text-sm leading-relaxed border-l-2 border-indigo-300 pl-3">
                    {renderMemo(link.memo)}
                  </div>
                )}
                {link.usage_url && (
                  <a href={link.usage_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors">
                    사용법 보기
                  </a>
                )}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  {link.likers && link.likers.length > 0 && (
                    <div className="flex -space-x-1.5 mr-1">
                      {link.likers.slice(0, 5).map((authorId) => {
                        const m = members.find((mb) => mb.id === authorId) ?? { name: '?' };
                        return (
                          <div key={authorId} className="relative group/liker">
                            <Avatar user={m} size={22} />
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/liker:opacity-100 transition-opacity pointer-events-none z-50">
                              {m.name}
                            </span>
                          </div>
                        );
                      })}
                      {link.likers.length > 5 && (
                        <div className="w-[22px] h-[22px] rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 font-bold border-2 border-white">
                          +{link.likers.length - 5}
                        </div>
                      )}
                    </div>
                  )}
                  <FloatingTooltip visible={selfLikeMsg} anchorRef={likeButtonRef} text="내 AX는 신청할 수 없어요" />
                  <button ref={likeButtonRef} onClick={handleLike} disabled={likeLoading} className={`flex items-center gap-1.5 text-sm transition-colors ${link.liked_by_me ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'}`}>
                    <span className="relative inline-block" style={{ fontSize: '1.1rem' }}>
                      {link.liked_by_me ? '♥' : '♡'}
                      {likeAnim && (
                        <>
                          <span className="heart-pop absolute text-rose-400 pointer-events-none" style={{ left: '50%', top: '50%', fontSize: '2rem' }}>♥</span>
                          {[0,1,2,3,4,5].map(i => (
                            <span key={i} className={`heart-fly heart-fly-${i} absolute text-rose-300 pointer-events-none`}
                              style={{ left: '50%', top: '50%', fontSize: '0.8rem', transform: 'translate(-50%,-50%)' }}>♥</span>
                          ))}
                        </>
                      )}
                    </span>
                    <span>{link.likes_count}</span>
                  </button>
                  <span className="text-gray-400 text-sm">댓글 {link.comments.length}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <CommentSection linkId={link.id} comments={link.comments} currentUser={currentUser} members={members}
                    onAdd={(c: Comment) => onUpdate({ ...link, comments: [...link.comments, c] })}
                    onDelete={(id: string) => onUpdate({ ...link, comments: link.comments.filter((c) => c.id !== id) })} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
