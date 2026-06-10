import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { notice, notice_active } = await request.json();

  const { data: link } = await supabaseAdmin
    .from('links')
    .select('author_id')
    .eq('id', params.id)
    .single();

  if (!link) return NextResponse.json({ error: '없는 링크입니다.' }, { status: 404 });
  if (link.author_id !== user.id) return NextResponse.json({ error: '권한 없음' }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from('links')
    .update({ notice, notice_active })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
