'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Link, AuthUser } from '@/types';
import LinkCard from '@/components/LinkCard';
import GlobalNoticeBanner from '@/components/GlobalNoticeBanner';
import AddLinkModal from '@/components/AddLinkModal';
import ProfileDropdown, { Avatar } from '@/components/ProfileDropdown';
import NotificationBell from '@/components/NotificationBell';
import Guestbook from '@/components/Guestbook';
import StickerLayer from '@/components/StickerLayer';
import LinkDetailModal from '@/components/LinkDetailModal';
import { getAuthorColor } from '@/lib/colors';
import Sidebar from '@/components/Sidebar';
import SortableCardGrid from '@/components/SortableCardGrid';

type Member = { id: string; name: string; avatar_url?: string | null; color?: string | null };

type AuthorGroup = { name: string; links: Link[]; latestAt: string };

function groupByAuthor(links: Link[]): AuthorGroup[] {
  const map = new Map<string, Link[]>();
  for (const link of links) {
    const key = link.author_name ?? '(알 수 없음)';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(link);
  }
  return Array.from(map.entries())
    .map(([name, authorLinks]) => ({ name, links: authorLinks, latestAt: authorLinks[0]?.created_at ?? '' }))
    .sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());
}

export default function WallPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [focusedLink, setFocusedLink] = useState<import('@/types').Link | null>(null);
  const [guestbookOpen, setGuestbookOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberNames, setMemberNames] = useState('');
  const [memberResult, setMemberResult] = useState<{ added: string[]; skipped: string[] } | null>(null);
  const [memberError, setMemberError] = useState('');
  const [search, setSearch] = useState('');

  const fetchLinks = useCallback(async () => {
    const res = await fetch('/api/links');
    if (res.ok) setLinks(await res.json());
  }, []);

  const fetchMembers = useCallback(async () => {
    const res = await fetch('/api/members');
    if (res.ok) setMembers(await res.json());
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => { if (!user) { router.replace('/login'); return; } setCurrentUser(user); });
    fetchLinks().finally(() => setLoading(false));
    fetchMembers();
  }, [fetchLinks, fetchMembers, router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError(''); setMemberResult(null);
    const names = memberNames.split('\n').map((n) => n.trim()).filter(Boolean);
    if (names.length === 0) { setMemberError('이름을 입력해주세요.'); return; }
    const res = await fetch('/api/auth/add-member', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ names }) });
    const data = await res.json();
    if (!res.ok) { setMemberError(data.error); return; }
    setMemberResult(data);
    if (data.added.length > 0) fetchMembers();
    if (data.skipped.length === 0) setTimeout(() => { setShowAddMemberModal(false); setMemberNames(''); setMemberResult(null); }, 1500);
  };

  const toggleCollapse = (name: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const handleColorChange = async (color: string) => {
    setMembers((prev) => prev.map((m) => m.name === currentUser?.name ? { ...m, color } : m));
    await fetch('/api/auth/color', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color }),
    });
  };

  const q = search.trim().toLowerCase();
  const filteredLinks = q
    ? links.filter((l) => l.author_name?.toLowerCase().includes(q) || l.title?.toLowerCase().includes(q))
    : null;

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">불러오는 중...</div>
      </div>
    );
  }

  const groups = groupByAuthor(links);

  return (
    <div className="min-h-screen relative">
      <GlobalNoticeBanner links={links} />

      <header className="bg-white/90 backdrop-blur border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="px-6 py-3 flex items-center gap-4">
          <h1 className="text-gray-900 font-bold text-lg shrink-0">웹게임파트 AX 담벼락</h1>
          <div className="flex-1 max-w-sm">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름 또는 제목 검색"
              className="w-full bg-gray-100 rounded-xl px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <NotificationBell
              onOpenLink={(id) => { const link = links.find((l) => l.id === id); if (link) setFocusedLink(link); }}
              onOpenGuestbook={() => setGuestbookOpen(true)}
            />
            <ProfileDropdown
              currentUser={currentUser}
              currentColor={getAuthorColor(currentUser.name, members).border}
              onLogout={handleLogout}
              onAvatarChange={(url) => setCurrentUser((u) => u ? { ...u, avatar_url: url } : u)}
              onColorChange={handleColorChange}
            />
            <button
              onClick={() => { setShowAddMemberModal(true); fetchMembers(); }}
              className="px-3 py-2 border border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700 text-sm rounded-xl transition-colors"
            >
              구성원 관리
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
            >
              + 링크 추가
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <Sidebar
          members={members}
          selected={selectedAuthor}
          onSelect={setSelectedAuthor}
          linkCounts={Object.fromEntries(groupByAuthor(links).map((g) => [g.name, g.links.length]))}
        />
      <main className="flex-1 min-w-0 px-4 py-6">
        {filteredLinks ? (
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(4px)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <p className="text-sm text-gray-400 mb-4">&quot;{search}&quot; 검색 결과 {filteredLinks.length}개</p>
            {filteredLinks.length === 0 ? (
              <div className="text-center py-20 text-gray-400">검색 결과가 없습니다.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredLinks.map((link) => {
                  const color = getAuthorColor(link.author_name ?? '', members);
                  return (
                    <div key={link.id}>
                      <div className="text-xs text-gray-400 mb-1 font-medium">{link.author_name}</div>
                      <LinkCard link={link} currentUser={currentUser} color={color} members={members}
                        onDelete={(id) => setLinks((p) => p.filter((l) => l.id !== id))}
                        onUpdate={(u) => setLinks((p) => p.map((l) => l.id === u.id ? u : l))} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg">아직 공유된 링크가 없습니다.</p>
            <p className="text-sm mt-1">첫 번째 링크를 추가해보세요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...groups]
              .sort((a, b) => a.name === currentUser.name ? -1 : b.name === currentUser.name ? 1 : 0)
              .filter((g) => !selectedAuthor || g.name === selectedAuthor)
              .map((group) => {
              const color = getAuthorColor(group.name, members);
              const member = members.find((m) => m.name === group.name);
              const isMe = group.name === currentUser.name;
              const isCollapsed = collapsed.has(group.name);
              return (
                <section
                  key={group.name}
                  className={`rounded-2xl px-5 pt-4 ${isCollapsed ? 'pb-4' : 'pb-5'}`}
                  style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(4px)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                >
                  <div className={`flex items-center gap-3 relative ${isCollapsed ? 'mb-0' : 'mb-5'}`}>
                    <button onClick={() => toggleCollapse(group.name)} className="flex items-center gap-3 min-w-0 text-left">
                      <Avatar user={member ?? { name: group.name }} size={36} />
                      <span className="font-bold text-gray-900">{group.name}</span>
                      <span className="text-gray-400 text-sm">{group.links.length}개</span>
                      <span className="text-gray-300 text-xs">{isCollapsed ? '▶' : '▼'}</span>
                    </button>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  {!isCollapsed && <SortableCardGrid
                    links={group.links}
                    currentUser={currentUser}
                    isOwner={group.name === currentUser.name}
                    color={color}
                    members={members}
                    onDelete={(id) => setLinks((p) => p.filter((l) => l.id !== id))}
                    onUpdate={(u) => setLinks((p) => p.map((l) => l.id === u.id ? u : l))}
                    onReorder={(reordered) =>
                      setLinks((p) => {
                        const ids = new Set(reordered.map((l) => l.id));
                        return [...reordered, ...p.filter((l) => !ids.has(l.id))];
                      })
                    }
                  />}
                </section>
              );
            })}
          </div>
        )}

      </main>
      </div>

      <Guestbook currentUser={currentUser} members={members} open={guestbookOpen} onOpenChange={setGuestbookOpen} />
      <StickerLayer currentUser={currentUser} />

      {focusedLink && (
        <LinkDetailModal
          link={links.find((l) => l.id === focusedLink.id) ?? focusedLink}
          currentUser={currentUser}
          members={members}
          onClose={() => setFocusedLink(null)}
          onDelete={(id) => { setLinks((p) => p.filter((l) => l.id !== id)); setFocusedLink(null); }}
          onUpdate={(u) => { setLinks((p) => p.map((l) => l.id === u.id ? u : l)); setFocusedLink(u); }}
        />
      )}

      {showModal && <AddLinkModal onAdd={(l) => setLinks((p) => [l, ...p])} onClose={() => setShowModal(false)} />}

      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-gray-900 font-semibold">구성원 관리</h2>
              <button onClick={() => setShowAddMemberModal(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            {members.length > 0 && (
              <div className="px-6 pt-5">
                <p className="text-xs text-gray-400 mb-3">현재 구성원 ({members.length}명)</p>
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => (
                    <span key={m.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      <Avatar user={m} size={18} />
                      {m.name}
                    </span>
                  ))}
                </div>
                <div className="mt-5 border-t border-gray-100" />
              </div>
            )}
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">이름 (여러 명은 줄바꿈)</label>
                <textarea value={memberNames} onChange={(e) => setMemberNames(e.target.value)}
                  placeholder={'김민준\n이서연\n박지호'} rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-indigo-400 resize-none" />
              </div>
              {memberError && <p className="text-red-500 text-sm">{memberError}</p>}
              {memberResult && (
                <div className="text-sm space-y-1">
                  {memberResult.added.length > 0 && <p className="text-emerald-600">등록 완료: {memberResult.added.join(', ')}</p>}
                  {memberResult.skipped.length > 0 && <p className="text-amber-600">이미 존재: {memberResult.skipped.join(', ')}</p>}
                </div>
              )}
              <button type="submit" className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-xl transition-colors">등록</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
