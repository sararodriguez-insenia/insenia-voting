import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { videos } from '@/lib/videos';

// Helper to get a stable user fingerprint (IP + UA, hashed simply)
function getUserFingerprint(req: NextRequest): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const ua = req.headers.get('user-agent') || 'unknown';
  // Simple hash: combine ip + first 50 chars of UA
  return `${ip}::${ua.slice(0, 50)}`;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
}

export async function POST(req: NextRequest) {
  try {
    const { videoId } = await req.json();

    // Validate that the video exists
    const video = videos.find((v) => v.id === videoId);
    if (!video) {
      return NextResponse.json({ error: 'Vídeo no encontrado' }, { status: 404 });
    }

    const fingerprint = getUserFingerprint(req);
    const today = getTodayString();
    const supabase = createServiceClient();

    // Check if this user already voted today
    const { data: existing } = await supabase
      .from('votes')
      .select('id')
      .eq('fingerprint', fingerprint)
      .eq('vote_date', today)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Ya has votado hoy. ¡Vuelve mañana para votar de nuevo!' },
        { status: 429 }
      );
    }

    // Insert the vote
    const { error: insertError } = await supabase.from('votes').insert({
      video_id: videoId,
      fingerprint,
      vote_date: today,
    });

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Error al registrar el voto' }, { status: 500 });
    }

    // Get updated vote count
    const { count } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('video_id', videoId);

    return NextResponse.json({ success: true, votes: count ?? 0 });
  } catch (err) {
    console.error('Vote error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Get all vote counts grouped by video_id
    const { data, error } = await supabase.from('votes').select('video_id');

    if (error) {
      return NextResponse.json({ error: 'Error fetching votes' }, { status: 500 });
    }

    // Count votes per video
    const counts: Record<string, number> = {};
    for (const row of data || []) {
      counts[row.video_id] = (counts[row.video_id] || 0) + 1;
    }

    // Check if current user has voted today
    const fingerprint = getUserFingerprint(req);
    const today = getTodayString();
    const { data: myVote } = await supabase
      .from('votes')
      .select('video_id')
      .eq('fingerprint', fingerprint)
      .eq('vote_date', today)
      .single();

    return NextResponse.json({
      counts,
      hasVotedToday: !!myVote,
      votedForVideoId: myVote?.video_id ?? null,
    });
  } catch (err) {
    console.error('Get votes error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
