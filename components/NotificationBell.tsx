'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Notification {
  id: string;
  sender_name: string;
  type: 'comment' | 'like' | 'tag' | 'deploy_consider';
  link_id: string | null;
  link_title: string | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

const TYPE_LABEL: Record<string, string> = {
  comment: '댓글을 달았습니다',
  like: '사용 신청을 했습니다',
  tag: '방명록에서 태그했습니다',
  deploy_consider: '배포 고려 대상에 선정됐습니다!',
};

interface Props {
  onOpenLink: (linkId: string) => void;
  onOpenGuestbook: () => void;
}

export default function NotificationBell({ onOpenLink, onOpenGuestbook }: Props) {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifs = useCallback(async () => {
    const res = await fetch('/api/notifications');
    if (res.ok) setNotifs(await res.json());
  }, []);

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => setOpen(!open);

  const handleClick = async (n: Notification) => {
    if (!n.is_read) {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id }),
      });
      setNotifs((p) => p.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
    }
    setOpen(false);
    if (n.type === 'tag') {
      onOpenGuestbook();
    } else if (n.link_id) {
      onOpenLink(n.link_id);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await fetch('/api/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotifs((p) => p.filter((n) => n.id !== id));
  };

  const unread = notifs.filter((n) => !n.is_read).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="font-semibold text-gray-900 text-sm">알림</p>
            {unread > 0 && (
              <button
                onClick={async () => {
                  await fetch('/api/notifications', { method: 'PUT' });
                  setNotifs((p) => p.map((n) => ({ ...n, is_read: true })));
                }}
                className="text-xs text-indigo-500 hover:text-indigo-400"
              >
                전체 읽음
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">알림이 없습니다</div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`group px-4 py-3 border-b border-gray-50 last:border-0 flex items-start gap-2 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-indigo-50/50' : ''}`}
                >
                  <span className="text-sm shrink-0 mt-0.5">
                    {n.type === 'like' ? '♥' : n.type === 'tag' ? '@' : n.type === 'deploy_consider' ? '🚀' : '💬'}
                  </span>
                  <div className="flex-1 min-w-0">
                    {n.type === 'deploy_consider' ? (
                      <p className="text-sm text-gray-800">
                        {n.link_title && <span className="font-semibold text-indigo-600">{n.link_title}</span>}
                        {n.link_title ? '을' : ''} 같이 쓰고 싶어하는 파트원이 <span className="font-bold text-rose-500">2명</span>이에요!
                      </p>
                    ) : (
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold">{n.sender_name}</span>
                        {' '}님이 {n.link_title ? <><span className="text-indigo-600">{n.link_title}</span>에 </> : ''}{TYPE_LABEL[n.type]}
                      </p>
                    )}
                    {n.message && n.type !== 'like' && (
                      <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                        {n.message.split(/(?<=[.!?])\s+/).map((s, i) => (
                          <p key={i}>{s}</p>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(n.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, n.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-xs transition-all shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
