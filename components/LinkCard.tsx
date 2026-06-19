'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Link, AuthUser } from '@/types';
import LinkDetailModal from './LinkDetailModal';
import { CATEGORY_STYLE, STATUS_STYLE } from '@/lib/badge';
import FloatingTooltip from './FloatingTooltip';
import { Avatar } from './ProfileDropdown';

type Member = { id: string; name: string; avatar_url?: string | null; color?: string | null };

interface Props {
  link: Link;
  currentUser: AuthUser;
  color: { bg: string; border: string };
  members: Member[];
  showAuthor?: boolean;
  onDelete: (id: string) => void;
  onUpdate: (link: Link) => void;
}

function renderMemoPreview(text: string, maxLines = 3) {
  const lines = text.split('\n').filter(l => l.trim());
  const truncated = lines.length > maxLines;
  return (
    <>
      {lines.slice(0, maxLines).map((line, i) => {
        const isBullet = /^[-•]\s/.test(line);
        return (
          <div key={i} className={isBullet ? 'flex gap-1' : ''}>
            {isBullet && <span className="shrink-0">•</span>}
            <span className="line-clamp-1">{isBullet ? line.replace(/^[-•]\s/, '') : line}</span>
          </div>
        );
      })}
      {truncated && <span className="text-gray-300">...</span>}
    </>
  );
}

export default function LinkCard({ link, currentUser, color, members, showAuthor, onDelete, onUpdate }: Props) {
  const authorMember = showAuthor ? members.find(m => m.name === link.author_name) : undefined;
  const [showDetail, setShowDetail] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [selfLikeMsg, setSelfLikeMsg] = useState(false);
  const likeButtonRef = useRef<HTMLButtonElement>(null);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (link.author_id === currentUser.id) {
      setSelfLikeMsg(true);
      setTimeout(() => setSelfLikeMsg(false), 2000);
      return;
    }
    if (likeLoading) return;
    setLikeLoading(true);
    const newLiked = !link.liked_by_me;
    if (newLiked) { setLikeAnim(true); setTimeout(() => setLikeAnim(false), 600); }
    onUpdate({ ...link, liked_by_me: newLiked, likes_count: newLiked ? link.likes_count + 1 : link.likes_count - 1 });
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link_id: link.id }),
      });
      if (!res.ok) onUpdate(link);
    } catch { onUpdate(link); }
    finally { setLikeLoading(false); }
  };

  const categoryStyle = link.category ? CATEGORY_STYLE[link.category] : null;
  const statusStyle = link.status ? STATUS_STYLE[link.status] : null;
  const isHolding = link.status === '홀딩 중' || link.status === '사용 종료' || link.status === '폐기';

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        className={`rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 flex flex-col h-[265px] ${isHolding ? 'bg-gray-100' : 'bg-white'}`}
        style={{ borderTop: `6px solid ${color.border}` }}
      >
        <div className="relative w-full h-32 bg-gray-100 shrink-0 overflow-hidden">
          <Image src={link.image || '/placeholder.png'} alt={link.title ?? ''} fill
            className="object-cover"
            style={{ objectPosition: link.image ? 'center center' : 'center 65%' }}
            unoptimized />
          {link.notice_active && link.notice && (
            <div className="absolute top-0 left-0 right-0 z-10 bg-yellow-400/90 px-3 py-1 text-[10px] font-semibold text-yellow-950 truncate">
              {link.notice}
            </div>
          )}
          {(categoryStyle || statusStyle) && (
            <div className={`absolute left-2 flex gap-1 ${link.notice_active && link.notice ? 'top-7' : 'top-2'}`}>
              {categoryStyle && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: categoryStyle.bg, color: categoryStyle.text }}>
                  {categoryStyle.label}
                </span>
              )}
              {statusStyle && link.status && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: statusStyle.bg, color: statusStyle.text }}>
                  {link.status}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="px-3 py-2.5 flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            {showAuthor && (
              <div className="shrink-0 rounded-full" style={{ boxShadow: `0 0 0 1.5px ${color.border}, 0 0 5px 1px ${color.border}60` }}>
                <Avatar user={authorMember ?? { name: link.author_name ?? '', color: color.border }} size={24} />
              </div>
            )}
            <p className="font-semibold text-gray-900 text-base leading-snug line-clamp-2">{link.title || link.url}</p>
          </div>
          {link.memo && (
            <div className="text-gray-400 text-xs mt-1 leading-relaxed overflow-hidden">
              {renderMemoPreview(link.memo, 1)}
            </div>
          )}
          <div className="mt-auto pt-2 flex items-center gap-1.5 overflow-hidden">
            {link.usage_url && (
              <a href={link.usage_url} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs px-2 py-0.5 rounded-full border text-gray-400 hover:text-indigo-600 hover:border-indigo-400 transition-colors shrink-0"
                style={{ borderColor: color.border + '80' }}>
                사용법
              </a>
            )}
            {link.target && link.target.length > 0 && (
              <div className="flex gap-1 overflow-hidden shrink">
                {link.target.map((t) => (
                  <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-md shrink-0">{t}</span>
                ))}
              </div>
            )}
            <div className="ml-auto flex items-center gap-3 shrink-0">
              <FloatingTooltip visible={selfLikeMsg} anchorRef={likeButtonRef} text="내 AX는 신청할 수 없어요" />
              <button ref={likeButtonRef} onClick={handleLike} disabled={likeLoading}
                className={`flex items-center gap-1 text-xs transition-colors relative ${link.liked_by_me ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'}`}>
                <span className="relative inline-block" style={{ fontSize: '1rem' }}>
                  {link.liked_by_me ? '♥' : '♡'}
                  {likeAnim && (
                    <>
                      <span className="heart-pop absolute text-rose-400 pointer-events-none" style={{ left: '50%', top: '50%', fontSize: '1.6rem' }}>♥</span>
                      {[0,1,2,3,4,5].map(i => (
                        <span key={i} className={`heart-fly heart-fly-${i} absolute text-rose-300 pointer-events-none`}
                          style={{ left: '50%', top: '50%', fontSize: '0.7rem', transform: 'translate(-50%,-50%)' }}>♥</span>
                      ))}
                    </>
                  )}
                </span>
                <span>{link.likes_count}</span>
              </button>
              <span className="text-gray-400 text-xs flex items-center gap-1">
                <span>💬</span><span>{link.comments.length}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {showDetail && typeof document !== 'undefined' && createPortal(
        <LinkDetailModal link={link} currentUser={currentUser} members={members}
          onClose={() => setShowDetail(false)} onDelete={onDelete} onUpdate={onUpdate} />,
        document.body
      )}
    </>
  );
}
