import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { videos, Video } from '@/lib/videos';

// ─── TYPES ────────────────────────────────────────────────────
interface VoteState {
  counts: Record<string, number>;
  hasVotedToday: boolean;
  votedForVideoId: string | null;
}

interface VideoWithVotes extends Video {
  votes: number;
  rank?: number;
}

// ─── HELPERS ──────────────────────────────────────────────────
function extractYoutubeId(id: string) {
  // Supports full URL or bare ID
  const match = id.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/);
  return match ? match[1] : id;
}

function getYoutubeThumbnail(ytId: string) {
  return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
}

// ─── COMPONENTS ───────────────────────────────────────────────

// Confetti burst on vote
function ConfettiPop({ active }: { active: boolean }) {
  if (!active) return null;
  const pieces = Array.from({ length: 18 });
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'var(--radius)' }}>
      {pieces.map((_, i) => {
        const angle = (i / pieces.length) * 360;
        const colors = ['#f5bf07', '#ffffff', '#ff6b35', '#00d4aa'];
        const color = colors[i % colors.length];
        return (
          <motion.div
            key={i}
            initial={{ opacity: 1, x: '50%', y: '50%', scale: 0 }}
            animate={{
              opacity: 0,
              x: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * 60}px)`,
              y: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * 60}px)`,
              scale: 1,
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: 8,
              height: 8,
              borderRadius: 2,
              background: color,
              top: 0,
              left: 0,
            }}
          />
        );
      })}
    </div>
  );
}

// Video modal player
function VideoModal({ video, onClose }: { video: Video | null; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!video) return null;
  const ytId = extractYoutubeId(video.youtubeId);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
          backdropFilter: 'blur(8px)',
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 900,
            background: 'var(--dark-card)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
            border: '1px solid var(--dark-border)',
          }}
        >
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </div>
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{video.title}</div>
              <div style={{ color: 'var(--yellow)', fontSize: '0.9rem', marginTop: 2 }}>
                {video.participant}
                {video.instagramHandle && <span style={{ color: 'var(--white-dim)', marginLeft: 8 }}>{video.instagramHandle}</span>}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'var(--white-faint)', color: 'var(--white)',
                border: '1px solid var(--dark-border)', borderRadius: 8,
                padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 500,
              }}
            >
              ✕ Cerrar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Video Card
function VideoCard({
  video, votes, rank, hasVotedToday, votedForThisVideo, onVote, onPlay
}: {
  video: Video;
  votes: number;
  rank: number;
  hasVotedToday: boolean;
  votedForThisVideo: boolean;
  onVote: (id: string) => void;
  onPlay: (v: Video) => void;
}) {
  const [voting, setVoting] = useState(false);
  const [justVoted, setJustVoted] = useState(false);
  const [error, setError] = useState('');
  const ytId = extractYoutubeId(video.youtubeId);

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVotedToday || voting) return;
    setVoting(true);
    setError('');
    try {
      await onVote(video.id);
      setJustVoted(true);
      setTimeout(() => setJustVoted(false), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al votar';
      setError(msg);
      setTimeout(() => setError(''), 3000);
    } finally {
      setVoting(false);
    }
  };

  const isTop3 = rank <= 3;
  const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      style={{
        background: 'var(--dark-card)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: isTop3 ? `var(--shadow-card), 0 0 0 2px var(--yellow)` : 'var(--shadow-card)',
        border: `1px solid ${isTop3 ? 'var(--yellow)' : 'var(--dark-border)'}`,
        display: 'flex', flexDirection: 'column',
        position: 'relative',
        cursor: 'pointer',
      }}
      onClick={() => onPlay(video)}
    >
      {/* Rank badge */}
      {rank <= 10 && (
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 2,
          background: isTop3 ? 'var(--yellow)' : 'rgba(0,0,0,0.7)',
          color: isTop3 ? 'var(--dark)' : 'var(--white)',
          fontFamily: 'var(--font-display)', fontSize: '1.1rem',
          letterSpacing: 1,
          padding: '2px 10px', borderRadius: 6,
          fontWeight: 700,
          backdropFilter: 'blur(6px)',
        }}>
          {medalEmoji ? `${medalEmoji} ${rank}` : `#${rank}`}
        </div>
      )}

      {/* Thumbnail */}
      <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#111' }}>
        <img
          src={getYoutubeThumbnail(ytId)}
          alt={video.title}
          loading="lazy"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Play overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.3)',
          opacity: 0,
          transition: 'opacity 0.2s',
        }}
          className="play-overlay"
        >
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--yellow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
          }}>
            <span style={{ fontSize: 20, marginLeft: 4, color: 'var(--dark)' }}>▶</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.3, marginBottom: 3 }}>
            {video.title}
          </div>
          <div style={{ color: 'var(--yellow)', fontSize: '0.82rem', fontWeight: 500 }}>
            {video.participant}
            {video.instagramHandle && (
              <span style={{ color: 'var(--white-dim)', marginLeft: 6 }}>{video.instagramHandle}</span>
            )}
          </div>
        </div>

        {/* Vote section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', gap: 10 }}>
          {/* Vote count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>❤️</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--yellow)', letterSpacing: 0.5 }}>
              {votes.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--white-dim)' }}>votos</span>
          </div>

          {/* Vote button */}
          <div style={{ position: 'relative' }}>
            <ConfettiPop active={justVoted} />
            <motion.button
              whileTap={!hasVotedToday ? { scale: 0.93 } : {}}
              onClick={handleVote}
              disabled={hasVotedToday || voting}
              style={{
                background: votedForThisVideo
                  ? 'rgba(245,191,7,0.15)'
                  : hasVotedToday
                    ? 'rgba(255,255,255,0.06)'
                    : 'var(--yellow)',
                color: votedForThisVideo ? 'var(--yellow)' : hasVotedToday ? 'var(--white-dim)' : 'var(--dark)',
                border: votedForThisVideo ? '1.5px solid var(--yellow)' : 'none',
                borderRadius: 8,
                padding: '0.5rem 1.1rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: 0.3,
                transition: 'all 0.2s',
                cursor: hasVotedToday ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {voting ? '...' : votedForThisVideo ? '✓ Votado' : hasVotedToday ? 'Ya votaste' : '❤️ Votar'}
            </motion.button>
          </div>
        </div>

        {error && (
          <div style={{ fontSize: '0.75rem', color: '#ff6b6b', textAlign: 'center', marginTop: -4 }}>
            {error}
          </div>
        )}
      </div>

      <style jsx>{`
        div:hover .play-overlay { opacity: 1 !important; }
      `}</style>
    </motion.div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function Home() {
  const [voteState, setVoteState] = useState<VoteState>({
    counts: {}, hasVotedToday: false, votedForVideoId: null,
  });
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'votes' | 'name'>('votes');
  const [activeTab, setActiveTab] = useState<'all' | 'top'>('all');
  const [toastMsg, setToastMsg] = useState('');
  const galleryRef = useRef<HTMLDivElement>(null);

  const fetchVotes = useCallback(async () => {
    try {
      const res = await fetch('/api/vote');
      const data = await res.json();
      setVoteState(data);
    } catch (err) {
      console.error('Error fetching votes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVotes();
    // Refresh every 30s
    const interval = setInterval(fetchVotes, 30000);
    return () => clearInterval(interval);
  }, [fetchVotes]);

  const handleVote = async (videoId: string) => {
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al votar');

    setVoteState((prev) => ({
      counts: { ...prev.counts, [videoId]: (prev.counts[videoId] || 0) + 1 },
      hasVotedToday: true,
      votedForVideoId: videoId,
    }));
    showToast('¡Voto registrado! 🎉');
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Concurso de vídeos – INSENIA Design School Madrid',
        text: '¡Vota por tu favorito en el concurso de INSENIA!',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('¡Enlace copiado! Compártelo con tus amigos 🔗');
    }
  };

  // Sorted videos with ranks
  const videosWithVotes: VideoWithVotes[] = videos
    .map((v) => ({ ...v, votes: voteState.counts[v.id] || 0 }))
    .sort((a, b) => b.votes - a.votes)
    .map((v, i) => ({ ...v, rank: i + 1 }));

  const top15 = videosWithVotes.slice(0, 15);
  
  const filteredVideos = videosWithVotes
    .filter((v) =>
      search === '' ||
      v.participant.toLowerCase().includes(search.toLowerCase()) ||
      v.title.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'votes') return b.votes - a.votes;
      return a.participant.localeCompare(b.participant);
    });

  const totalVotes = Object.values(voteState.counts).reduce((a, b) => a + b, 0);

  return (
    <>
      <Head>
        <title>Concurso de Vídeos – INSENIA Design School Madrid</title>
        <meta name="description" content="Vota por tu vídeo favorito del concurso de INSENIA Design School Madrid" />
        <meta property="og:title" content="Concurso de Vídeos – INSENIA" />
        <meta property="og:description" content="¡Vota por tu favorito!" />
        <meta property="og:image" content="/logo_recortado.jpg" />
      </Head>

      {/* ── HEADER ── */}
      <header style={{
        background: 'var(--dark)',
        borderBottom: '2px solid var(--yellow)',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 20px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '0.8rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img
              src="/logo_blanco.png"
              alt="INSENIA Design School Madrid"
              style={{ height: 40, width: 'auto', objectFit: 'contain' }}
            />
            <div style={{
              background: 'var(--yellow)', color: 'var(--dark)',
              fontFamily: 'var(--font-display)', fontSize: '0.85rem',
              letterSpacing: 1.5, padding: '3px 10px', borderRadius: 4,
              fontWeight: 700,
            }}>
              CONCURSO
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{
              background: 'var(--white-faint)', borderRadius: 8,
              padding: '0.4rem 0.9rem',
              fontSize: '0.85rem', color: 'var(--white-dim)',
              border: '1px solid var(--dark-border)',
            }}>
              <span style={{ color: 'var(--yellow)', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
                {totalVotes.toLocaleString()}
              </span>{' '}votos totales · <span style={{ color: 'var(--yellow)', fontWeight: 700 }}>{videos.length}</span> participantes
            </div>
            <button
              onClick={handleShare}
              style={{
                background: 'transparent', color: 'var(--yellow)',
                border: '1.5px solid var(--yellow)', borderRadius: 8,
                padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 600,
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span>↗</span> Compartir
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{
        background: `linear-gradient(135deg, var(--dark) 0%, var(--dark-2) 40%, #1a1500 100%)`,
        padding: '3rem 1.5rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(245,191,7,0.08) 0%, transparent 70%)',
        }} />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ position: 'relative' }}
        >
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 7vw, 5rem)',
            letterSpacing: 2, lineHeight: 1, marginBottom: '0.5rem',
          }}>
            <span style={{ color: 'var(--yellow)' }}>VOTA</span> POR TU
            <br />
            <span style={{ color: 'var(--white)' }}>VÍDEO FAVORITO</span>
          </div>
          <p style={{
            color: 'var(--white-dim)', fontSize: '1rem', maxWidth: 500, margin: '0.75rem auto 1.5rem',
            lineHeight: 1.6,
          }}>
            Ayúdanos a preseleccionar los 15 candidatos a las Becas del 100% de Insenia Design School Madrid !<br />
            Sólo podrás votar UNA VEZ AL DÍA, así que ¡elige bien! · En en Ranking podrás ver lo más votados.
          </p>

          {voteState.hasVotedToday && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(245,191,7,0.12)', border: '1px solid rgba(245,191,7,0.4)',
                borderRadius: 30, padding: '0.5rem 1.2rem',
                color: 'var(--yellow)', fontSize: '0.9rem', fontWeight: 500,
              }}
            >
              ✓ Ya has votado hoy — vuelve mañana para votar de nuevo
            </motion.div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setActiveTab('all'); galleryRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              style={{
                background: 'var(--yellow)', color: 'var(--dark)',
                borderRadius: 30, padding: '0.75rem 2rem',
                fontWeight: 700, fontSize: '1rem', letterSpacing: 0.5,
                boxShadow: 'var(--shadow-glow)',
                transition: 'transform 0.15s',
              }}
            >
              Ver todos los vídeos ↓
            </button>
            <button
              onClick={() => { setActiveTab('top'); galleryRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              style={{
                background: 'transparent', color: 'var(--white)',
                border: '1.5px solid var(--dark-border)', borderRadius: 30, padding: '0.75rem 2rem',
                fontWeight: 600, fontSize: '1rem',
              }}
            >
              🏆 Top 15
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem 4rem' }} ref={galleryRef}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
          {(['all', 'top'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? 'var(--yellow)' : 'var(--dark-card)',
                color: activeTab === tab ? 'var(--dark)' : 'var(--white-dim)',
                border: `1.5px solid ${activeTab === tab ? 'var(--yellow)' : 'var(--dark-border)'}`,
                borderRadius: 30, padding: '0.5rem 1.5rem',
                fontWeight: 700, fontSize: '0.9rem',
                transition: 'all 0.2s',
              }}
            >
              {tab === 'all' ? `Todos (${videos.length})` : '🏆 Top 10'}
            </button>
          ))}

          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            {/* Search */}
            <input
              type="text"
              placeholder="Buscar participante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'var(--dark-card)', color: 'var(--white)',
                border: '1.5px solid var(--dark-border)', borderRadius: 30,
                padding: '0.5rem 1.2rem', fontSize: '0.9rem', outline: 'none',
                width: 200,
              }}
            />
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'votes' | 'name')}
              style={{
                background: 'var(--dark-card)', color: 'var(--white-dim)',
                border: '1.5px solid var(--dark-border)', borderRadius: 30,
                padding: '0.5rem 1.2rem', fontSize: '0.9rem', outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="votes">Ordenar: más votos</option>
              <option value="name">Ordenar: nombre</option>
            </select>
          </div>
        </div>

        {/* TOP 10 TAB */}
        {activeTab === 'top' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--dark-card), var(--dark-2))',
              borderRadius: 'var(--radius-lg)',
              border: '2px solid var(--yellow)',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                letterSpacing: 2, color: 'var(--yellow)', marginBottom: '1.5rem',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                🏆 RANKING TOP 10
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {top10.map((v, i) => {
                  const maxVotes = top10[0]?.votes || 1;
                  const pct = maxVotes > 0 ? (v.votes / maxVotes) * 100 : 0;
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <motion.div
                      key={v.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        background: i < 3 ? 'rgba(245,191,7,0.06)' : 'var(--white-faint)',
                        borderRadius: 10, padding: '0.75rem 1rem',
                        border: `1px solid ${i < 3 ? 'rgba(245,191,7,0.2)' : 'transparent'}`,
                        cursor: 'pointer',
                      }}
                      onClick={() => setActiveVideo(v)}
                    >
                      <div style={{
                        fontFamily: 'var(--font-display)', fontSize: '1.4rem', minWidth: 36,
                        color: i < 3 ? 'var(--yellow)' : 'var(--white-dim)',
                        textAlign: 'center',
                      }}>
                        {medals[i] || `#${i + 1}`}
                      </div>
                      <img
                        src={getYoutubeThumbnail(extractYoutubeId(v.youtubeId))}
                        alt={v.title}
                        style={{ width: 60, height: 34, objectFit: 'cover', borderRadius: 6 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {v.participant}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--white-dim)', marginTop: 2 }}>{v.title}</div>
                        {/* Progress bar */}
                        <div style={{ height: 4, background: 'var(--dark-border)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }}
                            style={{ height: '100%', background: 'var(--yellow)', borderRadius: 2 }}
                          />
                        </div>
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-display)', fontSize: '1.4rem',
                        color: 'var(--yellow)', textAlign: 'right', minWidth: 60,
                      }}>
                        {v.votes.toLocaleString()}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ALL VIDEOS GRID */}
        {activeTab === 'all' && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--white-dim)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
                Cargando vídeos...
              </div>
            ) : filteredVideos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--white-dim)' }}>
                No se encontraron participantes con ese nombre.
              </div>
            ) : (
              <motion.div
                layout
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '1.25rem',
                }}
              >
                {filteredVideos.map((v) => (
                  <VideoCard
                    key={v.id}
                    video={v}
                    votes={v.votes}
                    rank={v.rank!}
                    hasVotedToday={voteState.hasVotedToday}
                    votedForThisVideo={voteState.votedForVideoId === v.id}
                    onVote={handleVote}
                    onPlay={setActiveVideo}
                  />
                ))}
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        background: 'var(--dark)',
        borderTop: '1px solid var(--dark-border)',
        padding: '2rem 1.5rem',
        textAlign: 'center',
      }}>
        <img src="/logo_blanco.png" alt="INSENIA" style={{ height: 32, marginBottom: '1rem', opacity: 0.8 }} />
        <p style={{ color: 'var(--white-dim)', fontSize: '0.85rem' }}>
          © INSENIA Design School Madrid · Concurso de Vídeos
        </p>
        <p style={{ color: 'var(--dark-border)', fontSize: '0.75rem', marginTop: 6 }}>
          1 voto por usuario al día. Los votos se actualizan en tiempo real.
        </p>
      </footer>

      {/* ── VIDEO MODAL ── */}
      <AnimatePresence>
        {activeVideo && <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />}
      </AnimatePresence>

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
              background: 'var(--yellow)', color: 'var(--dark)',
              borderRadius: 30, padding: '0.75rem 1.75rem',
              fontWeight: 700, fontSize: '1rem',
              boxShadow: 'var(--shadow-glow)',
              zIndex: 2000, whiteSpace: 'nowrap',
            }}
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .play-overlay { opacity: 0; }
        *:hover > .play-overlay { opacity: 1; }
        input::placeholder { color: rgba(255,255,255,0.35); }
        @media (max-width: 640px) {
          header > div { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </>
  );
}
