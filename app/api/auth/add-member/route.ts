import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { names } = await request.json();
  if (!Array.isArray(names) || names.length === 0) {
    return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 });
  }

  const trimmed = names.map((n: string) => n.trim()).filter(Boolean);
  if (trimmed.length === 0) return NextResponse.json({ error: '유효한 이름이 없습니다.' }, { status: 400 });

  const passwordHash = await bcrypt.hash('b2b2', 10);

  const added: string[] = [];
  const skipped: string[] = [];

  for (const name of trimmed) {
    const { error } = await supabaseAdmin
      .from('members')
      .insert({ name, password_hash: passwordHash });

    if (error) skipped.push(name);
    else added.push(name);
  }

  return NextResponse.json({ added, skipped });
}
