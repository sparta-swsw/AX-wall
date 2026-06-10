import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('guestbook')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });

  const { data: entry } = await supabaseAdmin.from('guestbook').select('author_id').eq('id', id).single();
  if (!entry) return NextResponse.json({ error: '없는 메시지입니다.' }, { status: 404 });
  if (entry.author_id !== user.id) return NextResponse.json({ error: '권한 없음' }, { status: 403 });

  await supabaseAdmin.from('guestbook').delete().eq('id', id);
  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { message } = await request.json();
  if (!message?.trim()) return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('guestbook')
    .insert({ author_id: user.id, author_name: user.name, message: message.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // @태그된 구성원에게 알림 발송
  const tagged = [...message.matchAll(/@(\S+)/g)].map((m) => m[1]);
  if (tagged.length > 0) {
    const { data: members } = await supabaseAdmin
      .from('members')
      .select('id, name')
      .in('name', tagged);

    if (members && members.length > 0) {
      const notifs = members
        .filter((m) => m.id !== user.id)
        .map((m) => ({
          recipient_id: m.id,
          recipient_name: m.name,
          sender_name: user.name,
          type: 'tag',
          message: message.trim(),
        }));
      if (notifs.length > 0) await supabaseAdmin.from('notifications').insert(notifs);
    }
  }

  return NextResponse.json(data);
}
