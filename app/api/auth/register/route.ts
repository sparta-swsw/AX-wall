import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  const { name, password } = await request.json();

  if (!name?.trim() || !password) {
    return NextResponse.json({ error: '이름과 비밀번호를 입력해주세요.' }, { status: 400 });
  }

  if (password !== 'b2b2') {
    return NextResponse.json({ error: '공용 비밀번호가 올바르지 않습니다.' }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from('members')
    .select('id')
    .eq('name', name.trim())
    .single();

  if (existing) {
    return NextResponse.json({ error: '이미 등록된 이름입니다.' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { data: member, error } = await supabaseAdmin
    .from('members')
    .insert({ name: name.trim(), password_hash: passwordHash })
    .select()
    .single();

  if (error || !member) {
    return NextResponse.json({ error: '등록에 실패했습니다.' }, { status: 500 });
  }

  const token = await signToken({ id: member.id, name: member.name });
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return response;
}
