'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Link, LinkCategory, LinkTarget, LinkStatus } from '@/types';

const CATEGORIES: { value: LinkCategory; label: string }[] = [
  { value: '스킬', label: '스킬' },
  { value: '배포', label: '배포' },
  { value: '자동화', label: '자동화' },
];

const TARGETS: LinkTarget[] = ['수강생', '전사', '팀', '파트', '트랙', '개인'];

const STATUSES: { value: LinkStatus; color: string }[] = [
  { value: '기획 중', color: '#9CA3AF' },
  { value: '개발 중', color: '#3B82F6' },
  { value: '홀딩 중', color: '#F59E0B' },
  { value: '사용 중', color: '#10B981' },
  { value: '사용 종료', color: '#EF4444' },
  { value: '폐기', color: '#6B7280' },
];

interface OgData { title: string; description: string; image: string; }

interface Props {
  onAdd: (link: Link) => void;
  onClose: () => void;
}

export default function AddLinkModal({ onAdd, onClose }: Props) {
  const [category, setCategory] = useState<LinkCategory>('스킬');
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [usageUrl, setUsageUrl] = useState('');
  const [targets, setTargets] = useState<LinkTarget[]>([]);
  const [status, setStatus] = useState<LinkStatus>('기획 중');
  const [url, setUrl] = useState('');
  const [platform] = useState('');
  const [preview, setPreview] = useState<OgData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const toggleTarget = (t: LinkTarget) => {
    setTargets((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);
  };

  const fetchPreview = async (targetUrl: string) => {
    if (!targetUrl.startsWith('http')) return;
    setPreviewLoading(true);
    setPreview(null);
    try {
      const screenshotUrl = `https://api.microlink.io/?url=${encodeURIComponent(targetUrl)}&screenshot=true&meta=false&embed=screenshot.url`;
      const res = await fetch('/api/og-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setPreview({ ...data, image: screenshotUrl });
        if (!title.trim()) setTitle(data.title || '');
      }
    } finally { setPreviewLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || loading) return;
    if (category === '배포' && !url.trim()) { setError('배포 링크를 입력해주세요.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          url: category === '배포' ? url.trim() : null,
          memo: memo.trim() || null,
          usage_url: usageUrl.trim() || null,
          category,
          status,
          target: targets.length > 0 ? targets : null,
          platform: platform.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '오류가 발생했습니다.'); return; }
      onAdd(data);
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-gray-900 font-bold">AX 기록하기</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* 카테고리 */}
          <div className="flex gap-2">
            {CATEGORIES.map((c) => (
              <button key={c.value} type="button" onClick={() => setCategory(c.value)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  category === c.value ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>
                {c.label}
              </button>
            ))}
          </div>

          {/* 공통: 제목 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">제목 <span className="text-red-400">*</span></label>
            <input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목 입력"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400" />
          </div>

          {/* 배포 전용: 링크 + 미리보기 */}
          {category === '배포' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">링크 <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400" />
                <button type="button" onClick={() => url.trim() && fetchPreview(url.trim())}
                  disabled={!url.trim() || previewLoading}
                  className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-600 text-sm rounded-xl shrink-0">
                  미리보기
                </button>
              </div>
              {(previewLoading || preview) && (
                <div className="mt-2 rounded-xl border border-gray-200 overflow-hidden">
                  {previewLoading ? (
                    <div className="h-16 flex items-center justify-center text-gray-400 text-sm bg-gray-50">불러오는 중...</div>
                  ) : preview && (
                    <>
                      {preview.image && (
                        <div className="relative w-full h-28 bg-gray-100">
                          <Image src={preview.image} alt="" fill className="object-cover" unoptimized
                            onError={() => setPreview((p) => p ? { ...p, image: '' } : p)} />
                        </div>
                      )}
                      <div className="px-3 py-2 bg-gray-50">
                        <p className="text-sm text-gray-700 font-medium line-clamp-1">{preview.title}</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}


          {/* 공통: 설명 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">설명 <span className="text-gray-400">(선택)</span></label>
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="간단한 설명" rows={2}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 resize-none" />
          </div>

          {/* 공통: 대상 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">대상 <span className="text-gray-400">(복수 선택 가능)</span></label>
            <div className="flex flex-wrap gap-2">
              {TARGETS.map((t) => (
                <button key={t} type="button" onClick={() => toggleTarget(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    targets.includes(t) ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 공통: 사용법 링크 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">사용법 링크 <span className="text-gray-400">(선택)</span></label>
            <input value={usageUrl} onChange={(e) => setUsageUrl(e.target.value)} placeholder="https://..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400" />
          </div>

          {/* 공통: 상태 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">상태</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button key={s.value} type="button" onClick={() => setStatus(s.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    status === s.value ? 'text-white' : 'bg-white text-gray-500 border-gray-200'
                  }`}
                  style={status === s.value ? { background: s.color, borderColor: s.color } : undefined}>
                  {s.value}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm">취소</button>
          <button onClick={handleSubmit} disabled={loading || !title.trim()}
            className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-medium">
            {loading ? '기록 중...' : '기록하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
