import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { color } = await request.json();
  await supabaseAdmin.from('members').update({ color: color ?? null }).eq('id', user.id);
  return NextResponse.json({ success: true });
}
