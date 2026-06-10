import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  const { name, password } = await request.json();

  if (!name?.trim() || !password) {
    return NextResponse.json({ error: '이름과 비밀번호를 입력해주세요.' }, { status: 400 });
  }

  const { data: member } = await supabaseAdmin
    .from('members')
    .select('*')
    .eq('name', name.trim())
    .single();

  if (!member) {
    return NextResponse.json({ error: '등록되지 않은 이름입니다.' }, { status: 400 });
  }

  const valid = await bcrypt.compare(password, member.password_hash);
  if (!valid) {
    return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 400 });
  }

  const token = await signToken({ id: member.id, name: member.name });
  const response = NextResponse.json({ success: true, name: member.name });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return response;
}
