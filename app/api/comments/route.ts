import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { link_id, content, parent_id } = await request.json();
  if (!link_id || !content?.trim()) {
    return NextResponse.json({ error: '댓글 내용을 입력해주세요.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('comments')
    .insert({ link_id, author_id: user.id, author_name: user.name, content: content.trim(), parent_id: parent_id ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: link } = await supabaseAdmin
    .from('links')
    .select('author_id, author_name, title')
    .eq('id', link_id)
    .single();

  const notifs = [];

  if (link && link.author_id && link.author_id !== user.id) {
    notifs.push({
      recipient_id: link.author_id,
      recipient_name: link.author_name,
      sender_name: user.name,
      type: 'comment',
      link_id,
      link_title: link.title,
      message: content.trim(),
    });
  }

  if (parent_id) {
    const { data: parent } = await supabaseAdmin
      .from('comments')
      .select('author_id, author_name')
      .eq('id', parent_id)
      .single();

    if (parent && parent.author_id && parent.author_id !== user.id && parent.author_id !== link?.author_id) {
      notifs.push({
        recipient_id: parent.author_id,
        recipient_name: parent.author_name,
        sender_name: user.name,
        type: 'comment',
        link_id,
        link_title: link?.title ?? null,
        message: content.trim(),
      });
    }
  }

  if (notifs.length > 0) await supabaseAdmin.from('notifications').insert(notifs);

  return NextResponse.json(data);
}
