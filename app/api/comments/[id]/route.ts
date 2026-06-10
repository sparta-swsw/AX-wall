import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: comment } = await supabaseAdmin
    .from('comments')
    .select('author_id')
    .eq('id', params.id)
    .single();

  if (!comment) return NextResponse.json({ error: '없는 댓글입니다.' }, { status: 404 });
  if (comment.author_id !== user.id) return NextResponse.json({ error: '권한 없음' }, { status: 403 });

  const { error } = await supabaseAdmin.from('comments').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
