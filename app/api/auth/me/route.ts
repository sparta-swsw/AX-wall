import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabaseAdmin
    .from('members')
    .select('avatar_url')
    .eq('id', user.id)
    .single();

  return NextResponse.json({ ...user, avatar_url: data?.avatar_url ?? null });
}
