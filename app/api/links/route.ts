import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchOgData } from '@/lib/og';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: links, error } = await supabaseAdmin
    .from('links')
    .select('*, comments(*), likes(*)')
    .order('sort_order', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const processed = (links ?? []).map((link) => ({
    ...link,
    likes_count: link.likes?.length ?? 0,
    liked_by_me: link.likes?.some((l: { author_id: string }) => l.author_id === user.id) ?? false,
    likers: (link.likes ?? []).map((l: { author_id: string }) => l.author_id),
    comments: (link.comments ?? []).sort(
      (a: { created_at: string }, b: { created_at: string }) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
  }));

  return NextResponse.json(processed);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, url, memo, usage_url, category, status, target } = await request.json();
  if (!title?.trim()) return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 });

  let ogDescription = null;
  let ogImage = null;
  if (url?.trim()) {
    const og = await fetchOgData(url.trim());
    ogDescription = og.description;
    ogImage = og.image;
  }

  const { data: link, error } = await supabaseAdmin
    .from('links')
    .insert({
      url: url?.trim() || null,
      title: title.trim(),
      description: ogDescription,
      image: ogImage,
      memo: memo ?? null,
      usage_url: usage_url ?? null,
      category: category ?? null,
      status: status ?? null,
      target: target ?? null,
      author_id: user.id,
      author_name: user.name,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ...link, comments: [], likes_count: 0, liked_by_me: false, likers: [] });
}
