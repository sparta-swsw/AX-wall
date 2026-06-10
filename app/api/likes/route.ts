import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { link_id } = await request.json();
  if (!link_id) return NextResponse.json({ error: 'link_id가 필요합니다.' }, { status: 400 });

  const { data: existing } = await supabaseAdmin
    .from('likes')
    .select('id')
    .eq('link_id', link_id)
    .eq('author_id', user.id)
    .single();

  if (existing) {
    await supabaseAdmin.from('likes').delete().eq('id', existing.id);
    return NextResponse.json({ liked: false });
  } else {
    await supabaseAdmin.from('likes').insert({ link_id, author_id: user.id });

    const { data: link } = await supabaseAdmin
      .from('links')
      .select('author_id, author_name, title')
      .eq('id', link_id)
      .single();

    if (link && link.author_id && link.author_id !== user.id) {
      await supabaseAdmin.from('notifications').insert({
        recipient_id: link.author_id,
        recipient_name: link.author_name,
        sender_name: user.name,
        type: 'like',
        link_id,
        link_title: link.title,
      });
    }

    return NextResponse.json({ liked: true });
  }
}
