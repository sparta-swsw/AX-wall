import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchOgData } from '@/lib/og';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: link } = await supabaseAdmin
    .from('links')
    .select('author_id, url')
    .eq('id', params.id)
    .single();

  if (!link) return NextResponse.json({ error: '없는 링크입니다.' }, { status: 404 });
  if (link.author_id !== user.id) return NextResponse.json({ error: '권한 없음' }, { status: 403 });

  const { title, url, memo, usage_url } = await request.json();

  let image = undefined;
  let description = undefined;
  if (url && url !== link.url) {
    const og = await fetchOgData(url);
    image = og.image;
    description = og.description;
  }

  const { data, error } = await supabaseAdmin
    .from('links')
    .update({
      title,
      url,
      memo: memo ?? null,
      usage_url: usage_url ?? null,
      ...(image !== undefined && { image }),
      ...(description !== undefined && { description }),
    })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: link } = await supabaseAdmin
    .from('links')
    .select('author_id')
    .eq('id', params.id)
    .single();

  if (!link) return NextResponse.json({ error: '없는 링크입니다.' }, { status: 404 });
  if (link.author_id !== user.id) return NextResponse.json({ error: '권한 없음' }, { status: 403 });

  const { error } = await supabaseAdmin.from('links').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
