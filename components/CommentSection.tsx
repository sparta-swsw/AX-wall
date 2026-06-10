'use client';

import { useState } from 'react';
import { Comment, AuthUser } from '@/types';
import { Avatar } from './ProfileDropdown';

type Member = { id: string; name: string; avatar_url?: string | null };

interface Props {
  linkId: string;
  comments: Comment[];
  currentUser: AuthUser;
  members: Member[];
  onAdd: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
}

interface CommentItemProps {
  comment: Comment;
  replies: Comment[];
  currentUser: AuthUser;
  members: Member[];
  linkId: string;
  onAdd: (comment: Comment) => void;
  onDelete: (id: string) => void;
}

function CommentItem({ comment, replies, currentUser, members, linkId, onAdd, onDelete }: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const getMember = (name: string | null) => members.find((m) => m.name === name) ?? { name: name ?? '' };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link_id: linkId, content: replyText, parent_id: comment.id }),
      });
      const data = await res.json();
      if (res.ok) { onAdd(data); setReplyText(''); setShowReply(false); }
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex items-start gap-2 text-sm">
        <Avatar user={getMember(comment.author_name)} size={22} />
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-indigo-600 mr-1.5">{comment.author_name}</span>
          <span className="text-gray-600">{comment.content}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <button
              onClick={() => setShowReply(!showReply)}
              className="text-xs text-gray-400 hover:text-indigo-500 transition-colors"
            >
              답글
            </button>
            {comment.author_id === currentUser.id && (
              <button onClick={() => onDelete(comment.id)} className="text-xs text-gray-300 hover:text-red-400 transition-colors">
                삭제
              </button>
            )}
          </div>
        </div>
      </div>

      {replies.length > 0 && (
        <div className="ml-8 mt-1.5 space-y-1.5 border-l-2 border-gray-100 pl-3">
          {replies.map((r) => (
            <div key={r.id} className="flex items-start gap-2 text-sm">
              <Avatar user={getMember(r.author_name)} size={18} />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-indigo-600 mr-1.5 text-xs">{r.author_name}</span>
                <span className="text-gray-600 text-xs">{r.content}</span>
              </div>
              {r.author_id === currentUser.id && (
                <button onClick={() => onDelete(r.id)} className="text-xs text-gray-300 hover:text-red-400 transition-colors shrink-0">
                  삭제
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showReply && (
        <form onSubmit={handleReply} className="ml-8 mt-1.5 flex gap-2">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`${comment.author_name}에게 답글...`}
            autoFocus
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400"
          />
          <button type="submit" disabled={loading || !replyText.trim()} className="px-2 py-1 bg-indigo-500 hover:bg-indigo-400 disabled:bg-gray-200 text-white text-xs rounded-lg">
            등록
          </button>
          <button type="button" onClick={() => setShowReply(false)} className="px-2 py-1 text-gray-400 text-xs">
            취소
          </button>
        </form>
      )}
    </div>
  );
}

export default function CommentSection({ linkId, comments, currentUser, members, onAdd, onDelete }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const topLevel = comments.filter((c) => !c.parent_id);
  const getReplies = (id: string) => comments.filter((c) => c.parent_id === id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link_id: linkId, content: text }),
      });
      const data = await res.json();
      if (res.ok) { onAdd(data); setText(''); }
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      {topLevel.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          replies={getReplies(c.id)}
          currentUser={currentUser}
          members={members}
          linkId={linkId}
          onAdd={onAdd}
          onDelete={onDelete}
        />
      ))}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="댓글 작성..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400"
        />
        <button type="submit" disabled={loading || !text.trim()} className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm rounded-lg transition-colors">
          등록
        </button>
      </form>
    </div>
  );
}
