import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { updates } = await request.json() as { updates: { id: string; sort_order: number }[] };
  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
  }

  for (const { id, sort_order } of updates) {
    await supabaseAdmin
      .from('links')
      .update({ sort_order })
      .eq('id', id)
      .eq('author_id', user.id);
  }

  return NextResponse.json({ success: true });
}
