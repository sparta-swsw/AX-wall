import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30);

  return NextResponse.json(data ?? []);
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  await supabaseAdmin.from('notifications').delete().eq('id', id).eq('recipient_id', user.id);
  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { id?: string } = {};
  try { body = await request.json(); } catch { /* 전체 읽음 처리 */ }

  const query = supabaseAdmin.from('notifications').update({ is_read: true }).eq('recipient_id', user.id);
  if (body.id) await query.eq('id', body.id);
  else await query.eq('is_read', false);

  return NextResponse.json({ success: true });
}
