'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Link, AuthUser } from '@/types';
import LinkDetailModal from './LinkDetailModal';
import { CATEGORY_STYLE, STATUS_STYLE } from '@/lib/badge';

type Member = { id: string; name: string; avatar_url?: string | null; color?: string | null };

interface Props {
  link: Link;
  currentUser: AuthUser;
  color: { bg: string; border: string };
  members: Member[];
  onDelete: (id: string) => void;
  onUpdate: (link: Link) => void;
}

export default function LinkCard({ link, currentUser, color, members, onDelete, onUpdate }: Props) {
  const [showDetail, setShowDetail] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [selfLikeMsg, setSelfLikeMsg] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (link.author_id === currentUser.id) {
      setSelfLikeMsg(true);
      setTimeout(() => setSelfLikeMsg(false), 2000);
      return;
    }
    if (likeLoading) return;
    setLikeLoading(true);
    if (!link.liked_by_me) { setLikeAnim(true); setTimeout(() => setLikeAnim(false), 600); }
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link_id: link.id }),
      });
      const data = await res.json();
      if (res.ok) onUpdate({ ...link, liked_by_me: data.liked, likes_count: data.liked ? link.likes_count + 1 : link.likes_count - 1 });
    } finally { setLikeLoading(false); }
  };

  const categoryStyle = link.category ? CATEGORY_STYLE[link.category] : null;
  const statusStyle = link.status ? STATUS_STYLE[link.status] : null;
  const isHolding = link.status === '홀딩 중' || link.status === '사용 종료' || link.status === '폐기';

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        className={`bg-white rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col h-72 ${isHolding ? 'opacity-60' : ''}`}
        style={{ borderTop: `4px solid ${color.border}` }}
      >
        {link.notice_active && link.notice && (
          <div className="bg-amber-50 border-b border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700 shrink-0 truncate">
            {link.notice}
          </div>
        )}

        <div className="relative w-full h-36 bg-gray-100 shrink-0">
          <Image src={link.image || '/placeholder.png'} alt={link.title ?? ''} fill
            className="object-cover"
            style={{ objectPosition: 'center 65%' }}
            unoptimized />
          <div className="absolute top-2 left-2 flex gap-1">
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
        </div>

        <div className="px-3 py-2.5 flex flex-col flex-1 overflow-hidden">
          <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{link.title || link.url}</p>
          {link.memo && <p className="text-gray-400 text-xs mt-1 line-clamp-1">{link.memo}</p>}
          {link.target && link.target.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {link.target.map((t) => (
                <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-md">{t}</span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 mt-auto pt-1">
            {link.usage_url && (
              <a href={link.usage_url} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs px-2 py-0.5 rounded-full border text-gray-400 hover:text-indigo-600 hover:border-indigo-400 transition-colors"
                style={{ borderColor: color.border + '80' }}>
                사용법
              </a>
            )}
            <div className="ml-auto flex items-center gap-3">
              <button onClick={handleLike} disabled={likeLoading}
                className={`flex items-center gap-1 text-xs transition-colors relative ${link.liked_by_me ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'}`}>
                <span className="relative inline-block" style={{ fontSize: '1rem' }}>
                  {link.liked_by_me ? '♥' : '♡'}
                  {selfLikeMsg && (
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded-lg pointer-events-none z-50">
                      내 AX는 신청할 수 없어요
                    </span>
                  )}
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
