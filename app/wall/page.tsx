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
import { createPortal } from 'react-dom';
import { getAuthorColor } from '@/lib/colors';
import { supabase } from '@/lib/supabase';
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
  const [tab, setTab] = useState<'전체' | '배포 고려' | '내 신청'>('전체');
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterTargets, setFilterTargets] = useState<string[]>([]);
  const [focusedLink, setFocusedLink] = useState<import('@/types').Link | null>(null);
  const [headerHeight, setHeaderHeight] = useState(57);
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

  useEffect(() => { // eslint-disable-next-line react-hooks/exhaustive-deps
    const channel = supabase.channel('wall-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'links' }, () => {
        fetchLinks();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'links' }, (p) => {
        setLinks((prev) => prev.map((l) => l.id === p.new.id ? { ...l, ...p.new } : l));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'links' }, (p) => {
        setLinks((prev) => prev.filter((l) => l.id !== p.old.id));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, (p) => {
        const newComment = { id: p.new.id, link_id: p.new.link_id, parent_id: p.new.parent_id ?? null, author_id: p.new.author_id, author_name: p.new.author_name, content: p.new.content, created_at: p.new.created_at };
        setLinks((prev) => prev.map((l) => l.id === p.new.link_id
          ? { ...l, comments: [...l.comments, newComment] }
          : l));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments' }, (p) => {
        setLinks((prev) => prev.map((l) => ({ ...l, comments: l.comments.filter((c) => c.id !== p.old.id) })));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'likes' }, (p) => {
        setLinks((prev) => prev.map((l) => l.id === p.new.link_id
          ? { ...l, likes_count: l.likes_count + 1, likers: [...(l.likers ?? []), p.new.author_id] }
          : l));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'likes' }, (p) => {
        setLinks((prev) => prev.map((l) => l.id === p.old.link_id
          ? { ...l, likes_count: Math.max(0, l.likes_count - 1), likers: (l.likers ?? []).filter((id) => id !== p.old.author_id) }
          : l));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchLinks]);

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

  useEffect(() => {
    if (!loading && members.length > 0) {
      const linked = new Set(links.map(l => l.author_name).filter(Boolean) as string[]);
      setCollapsed(new Set(members.filter(m => !linked.has(m.name)).map(m => m.name)));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const toggleCollapse = (name: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const handleColorChange = async (color: string) => {
    const c = color || null;
    setMembers((prev) => prev.map((m) => m.name === currentUser?.name ? { ...m, color: c } : m));
    setCurrentUser((u) => u ? { ...u, color: c } : u);
    await fetch('/api/auth/color', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color }),
    });
  };

  const handleToggleFilter = (type: 'category' | 'status' | 'target', val: string) => {
    if (type === 'category') setFilterCategories(p => p.includes(val) ? p.filter(x => x !== val) : [...p, val]);
    if (type === 'status') setFilterStatuses(p => p.includes(val) ? p.filter(x => x !== val) : [...p, val]);
    if (type === 'target') setFilterTargets(p => p.includes(val) ? p.filter(x => x !== val) : [...p, val]);
  };

  const applyFilters = (linkList: import('@/types').Link[]) => {
    return linkList.filter(l => {
      if (filterCategories.length > 0 && !filterCategories.includes(l.category ?? '')) return false;
      if (filterStatuses.length > 0 && !filterStatuses.includes(l.status ?? '')) return false;
      if (filterTargets.length > 0 && !l.target?.some(t => filterTargets.includes(t))) return false;
      return true;
    });
  };

  const q = search.trim().toLowerCase();
  const hasFilter = filterCategories.length > 0 || filterStatuses.length > 0 || filterTargets.length > 0;
  const filteredLinks = (q || hasFilter)
    ? applyFilters(links.filter((l) => !q || l.author_name?.toLowerCase().includes(q) || l.title?.toLowerCase().includes(q)))
    : null;

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">불러오는 중...</div>
      </div>
    );
  }

  const linkedGroups = groupByAuthor(links);
  const groups = [
    ...linkedGroups,
    ...members
      .filter((m) => !linkedGroups.find((g) => g.name === m.name))
      .map((m) => ({ name: m.name, links: [] as import('@/types').Link[], latestAt: '' })),
  ];

  return (
    <div className="min-h-screen relative">
      <div className="sticky top-0 z-40" ref={(el) => { if (el) setHeaderHeight(el.offsetHeight); }}>
        <GlobalNoticeBanner links={links} onOpenLink={(id) => {
          const link = links.find((l) => l.id === id);
          if (link) setFocusedLink(link);
        }} />
        <header className="bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
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
              currentColor={currentUser.color || getAuthorColor(currentUser.name, members).border}
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
              AX 기록하기
            </button>
          </div>
        </div>
        </header>
      </div>

      <div className="flex pl-52">
        <Sidebar
          headerHeight={headerHeight}
          members={members}
          selected={selectedAuthor}
          onSelect={setSelectedAuthor}
          linkCounts={Object.fromEntries(groupByAuthor(links).map((g) => [g.name, g.links.length]))}
          filterCategories={filterCategories}
          filterStatuses={filterStatuses}
          filterTargets={filterTargets}
          onToggle={handleToggleFilter}
          onClearFilters={() => { setFilterCategories([]); setFilterStatuses([]); setFilterTargets([]); }}
        />
      <main className="flex-1 min-w-0 px-4 py-6">
        <div className="flex gap-2 mb-5">
          {(['전체', '배포 고려', '내 신청'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-1 ${
                tab === t ? 'bg-indigo-500 text-white' : 'bg-white/70 text-gray-500 hover:bg-white'
              }`}>
              {t === '배포 고려' && <span className="text-xs">♥</span>}
              {t}
              {t === '배포 고려' && <span className="text-xs opacity-70">{links.filter(l => l.likes_count >= 2).length}</span>}
              {t === '내 신청' && <span className="text-xs opacity-70">{links.filter(l => l.liked_by_me).length}</span>}
            </button>
          ))}
        </div>
        {tab !== '전체' ? (
          <div className="rounded-2xl px-5 pt-4 pb-5 relative z-10"
            style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(4px)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            {(() => {
              const filtered = applyFilters(tab === '배포 고려' ? links.filter(l => l.likes_count >= 2) : links.filter(l => l.liked_by_me));
              if (filtered.length === 0) return <p className="text-center py-10 text-gray-400 text-sm">{tab === '배포 고려' ? '사용 신청 2개 이상인 항목이 없습니다.' : '신청한 항목이 없습니다.'}</p>;
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {filtered.map((link) => {
                    const color = getAuthorColor(link.author_name ?? '', members);
                    return (
                      <LinkCard key={link.id} link={link} currentUser={currentUser} color={color} members={members}
                        onDelete={(id) => setLinks((p) => p.filter((l) => l.id !== id))}
                        onUpdate={(u) => setLinks((p) => p.map((l) => l.id === u.id ? u : l))} />
                    );
                  })}
                </div>
              );
            })()}
          </div>
        ) : filteredLinks ? (
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(4px)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            {q && <p className="text-sm text-gray-400 mb-4">&quot;{search}&quot; 검색 결과 {filteredLinks.length}개</p>}
            {filteredLinks.length === 0 ? (
              <div className="text-center py-20 text-gray-400">검색 결과가 없습니다.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
            {[...groups]
              .sort((a, b) => a.name === currentUser.name ? -1 : b.name === currentUser.name ? 1 : 0)
              .filter((g) => !selectedAuthor || g.name === selectedAuthor)
              .map((g) => ({ ...g, links: applyFilters(g.links) }))
              .filter((g) => !hasFilter || g.links.length > 0)
              .map((group) => {
              const color = getAuthorColor(group.name, members);
              const member = members.find((m) => m.name === group.name);
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
                  {!isCollapsed && group.links.length === 0 && (
                    <p className="text-sm text-gray-300 py-4 text-center">아직 등록한 AX가 없습니다</p>
                  )}
                  {!isCollapsed && group.links.length > 0 && <SortableCardGrid
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

      {focusedLink && typeof document !== 'undefined' && createPortal(
        <LinkDetailModal
          link={links.find((l) => l.id === focusedLink.id) ?? focusedLink}
          currentUser={currentUser}
          members={members}
          onClose={() => setFocusedLink(null)}
          onDelete={(id) => { setLinks((p) => p.filter((l) => l.id !== id)); setFocusedLink(null); }}
          onUpdate={(u) => { setLinks((p) => p.map((l) => l.id === u.id ? u : l)); setFocusedLink(u); }}
        />,
        document.body
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
