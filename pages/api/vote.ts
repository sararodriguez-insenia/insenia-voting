import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { videos } from '../../lib/videos';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getFingerprint(req: NextApiRequest): string {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.headers['x-real-ip'] as string ||
    'unknown';
  const ua = (req.headers['user-agent'] || 'unknown').slice(0, 50);
  return `${ip}::${ua}`;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET') {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('votes').select('video_id');

      if (error) {
        console.error('GET error:', error);
        return res.status(500).json({ error: error.message });
      }

      const counts: Record<string, number> = {};
      for (const row of data || []) {
        counts[row.video_id] = (counts[row.video_id] || 0) + 1;
      }

      const fingerprint = getFingerprint(req);
      const today = getToday();
      const { data: myVote } = await supabase
        .from('votes')
        .select('video_id')
        .eq('fingerprint', fingerprint)
        .eq('vote_date', today)
        .maybeSingle();

      return res.status(200).json({
        counts,
        hasVotedToday: !!myVote,
        votedForVideoId: myVote?.video_id ?? null,
      });
    } catch (err) {
      console.error('GET catch:', err);
      return res.status(500).json({ error: String(err) });
    }
  }

  if (req.method === 'POST') {
    try {
      const { videoId } = req.body;

      if (!videoId) {
        return res.status(400).json({ error: 'Falta videoId' });
      }

      const video = videos.find((v) => v.id === videoId);
      if (!video) {
        return res.status(404).json({ error: 'Vídeo no encontrado' });
      }

      const supabase = getSupabase();
      const fingerprint = getFingerprint(req);
      const today = getToday();

      const { data: existing } = await supabase
        .from('votes')
        .select('id')
        .eq('fingerprint', fingerprint)
        .eq('vote_date', today)
        .maybeSingle();

      if (existing) {
        return res.status(429).json({
          error: 'Ya has votado hoy. ¡Vuelve mañana para votar de nuevo!',
        });
      }

      const { error: insertError } = await supabase.from('votes').insert({
        video_id: videoId,
        fingerprint,
        vote_date: today,
      });

      if (insertError) {
        console.error('INSERT error:', insertError);
        return res.status(500).json({ error: insertError.message });
      }

      const { count } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', videoId);

      return res.status(200).json({ success: true, votes: count ?? 0 });
    } catch (err) {
      console.error('POST catch:', err);
      return res.status(500).json({ error: String(err) });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
