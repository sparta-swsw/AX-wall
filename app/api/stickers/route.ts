import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabaseAdmin.from('stickers').select('*').order('created_at');
  return NextResponse.json(data ?? []);
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await supabaseAdmin.from('stickers').delete().neq('id', '');
  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { emoji, x, y } = await request.json();
  const { data, error } = await supabaseAdmin
    .from('stickers')
    .insert({ emoji, x, y, author_id: user.id, author_name: user.name })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
