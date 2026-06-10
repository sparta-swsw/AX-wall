import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { current_password, new_password } = await request.json();
  if (!current_password || !new_password) {
    return NextResponse.json({ error: '현재/새 비밀번호를 모두 입력해주세요.' }, { status: 400 });
  }

  const { data: member } = await supabaseAdmin
    .from('members')
    .select('password_hash')
    .eq('id', user.id)
    .single();

  if (!member) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });

  const valid = await bcrypt.compare(current_password, member.password_hash);
  if (!valid) return NextResponse.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, { status: 400 });

  const newHash = await bcrypt.hash(new_password, 10);
  await supabaseAdmin.from('members').update({ password_hash: newHash }).eq('id', user.id);

  return NextResponse.json({ success: true });
}
