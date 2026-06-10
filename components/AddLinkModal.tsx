'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Link } from '@/types';

interface OgData {
  title: string;
  description: string;
  image: string;
}

interface Props {
  onAdd: (link: Link) => void;
  onClose: () => void;
}

export default function AddLinkModal({ onAdd, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState('');
  const [usageUrl, setUsageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<OgData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const fetchPreview = async (targetUrl: string) => {
    const normalized = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
    setPreviewLoading(true);
    setPreviewError(false);
    setPreview(null);
    try {
      const screenshotUrl = `https://api.microlink.io/?url=${encodeURIComponent(normalized)}&screenshot=true&meta=false&embed=screenshot.url`;
      const res = await fetch('/api/og-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized }),
      });
      if (!res.ok) {
        setPreview({ title: '', description: '', image: screenshotUrl });
        return;
      }
      const data: OgData = await res.json();
      setPreview({ ...data, image: screenshotUrl });
      if (!title.trim()) setTitle(data.title || '');
    } catch {
      setPreviewError(true);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          url: url.trim(),
          memo: memo.trim() || null,
          usage_url: usageUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '오류가 발생했습니다.'); return; }
      onAdd(data);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-white font-semibold">링크 추가</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">링크</label>
            <div className="flex gap-2">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (url.trim()) fetchPreview(url.trim()); } }}
                placeholder="https://..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => { if (url.trim()) fetchPreview(url.trim()); }}
                disabled={!url.trim() || previewLoading}
                className="px-3 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-300 text-sm rounded-lg transition-colors shrink-0"
              >
                미리보기
              </button>
            </div>
            <p className="text-gray-600 text-xs mt-1">URL 입력 후 미리보기 버튼을 누르거나 Enter</p>
          </div>

          {(previewLoading || preview || previewError) && (
            <div className="rounded-lg border border-gray-700 overflow-hidden">
              {previewLoading && (
                <div className="h-20 flex items-center justify-center text-gray-500 text-sm bg-gray-800">
                  불러오는 중...
                </div>
              )}
              {previewError && !previewLoading && (
                <div className="h-16 flex items-center justify-center text-gray-600 text-sm bg-gray-800">
                  미리보기를 불러올 수 없습니다
                </div>
              )}
              {preview && !previewLoading && (
                <>
                  {preview.image && (
                    <div className="relative w-full h-36 bg-gray-800">
                      <Image
                        src={preview.image}
                        alt={preview.title}
                        fill
                        className="object-cover"
                        unoptimized
                        onError={() => setPreview((p) => p ? { ...p, image: '' } : p)}
                      />
                    </div>
                  )}
                  <div className="p-3 bg-gray-800">
                    <p className="text-white text-sm font-medium line-clamp-1">{preview.title || url}</p>
                    {preview.description && (
                      <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{preview.description}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">제목</label>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="링크 제목"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              설명 <span className="text-gray-600">(선택)</span>
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="간단한 설명을 입력하세요"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              사용법 링크 <span className="text-gray-600">(선택)</span>
            </label>
            <input
              value={usageUrl}
              onChange={(e) => setUsageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-700 text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !url.trim()}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? '추가 중...' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
