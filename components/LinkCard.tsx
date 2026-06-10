'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Link, AuthUser } from '@/types';
import LinkDetailModal from './LinkDetailModal';

type Member = { id: string; name: string; avatar_url?: string | null };

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
  const [likeLoading, setLikeLoading] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link_id: link.id }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdate({
          ...link,
          liked_by_me: data.liked,
          likes_count: data.liked ? link.likes_count + 1 : link.likes_count - 1,
        });
      }
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        className="bg-white rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col h-72"
        style={{ borderTop: `4px solid ${color.border}` }}
      >
        {link.notice_active && link.notice && (
          <div className="bg-amber-50 border-b border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700 shrink-0 truncate">
            {link.notice}
          </div>
        )}

        <div className="relative w-full h-36 bg-gray-100 shrink-0">
          <Image
            src={link.image || '/placeholder.png'}
            alt={link.title ?? ''}
            fill
            className="object-cover"
            style={{ objectPosition: 'center 65%' }}
            unoptimized
          />
        </div>

        <div className="px-3 py-2.5 flex flex-col flex-1 overflow-hidden">
          <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
            {link.title || link.url}
          </p>
          {link.memo && (
            <p className="text-gray-400 text-xs mt-1 line-clamp-1">{link.memo}</p>
          )}
          <div className="flex items-center gap-2 mt-auto pt-1">
            {link.usage_url && (
              <a
                href={link.usage_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs px-2 py-0.5 rounded-full border text-gray-400 hover:text-indigo-600 hover:border-indigo-400 transition-colors"
                style={{ borderColor: color.border + '80' }}
              >
                사용법
              </a>
            )}
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={handleLike}
                disabled={likeLoading}
                className={`flex items-center gap-1 text-xs transition-colors ${link.liked_by_me ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'}`}
              >
                <span>{link.liked_by_me ? '♥' : '♡'}</span>
                <span>{link.likes_count}</span>
              </button>
              <span className="text-gray-400 text-xs flex items-center gap-1">
                <span>💬</span><span>{link.comments.length}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {showDetail && (
        <LinkDetailModal
          link={link}
          currentUser={currentUser}
          members={members}
          onClose={() => setShowDetail(false)}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}
