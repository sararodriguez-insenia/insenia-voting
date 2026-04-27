import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { videos, Video } from '@/lib/videos';

interface VoteState {
  counts: Record<string, number>;
  hasVotedToday: boolean;
  votedForVideoId: string | null;
}
interface VideoWithVotes extends Video {
  votes: number;
  rank?: number;
}

function extractYoutubeId(id: string) {
  const match = id.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/);
  return match ? match[1] : id;
}
function getYoutubeThumbnail(ytId: string) {
  return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
}

function ConfettiPop({ active }: { active: boolean }) {
  if (!active) return null;
  const pieces = Array.from({ length: 18 });
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 12 }}>
      {pieces.map((_, i) => {
        const angle = (i / pieces.length) * 360;
        const cols = ['#f5bf07', '#1a1a1a', '#ff6b35', '#00d4aa'];
        return (
          <motion.div key={i}
            initial={{ opacity: 1, x: '50%', y: '50%', scale: 0 }}
            animate={{
              opacity: 0,
              x: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * 60}px)`,
              y: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * 60}px)`,
              scale: 1,
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ position: 'absolute', width: 8, height: 8, borderRadius: 2, background: cols[i % cols.length], top: 0, left: 0 }}
          />
        );
      })}
    </div>
  );
}

function VideoModal({ video, onClose }: { video: Video | null; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  if (!video) return null;
  const ytId = extractYoutubeId(video.youtubeId);
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', backdropFilter: 'blur(6px)',
        }}
      >
        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 900, background: '#fff',
            borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.2)',
            border: '2px solid #f5bf07',
          }}
        >
          <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#111' }}>
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </div>
          <div style={{ padding: '1.1rem 1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a' }}>{video.title}</div>
              <div style={{ color: '#f5bf07', fontSize: '0.85rem', marginTop: 2, fontWeight: 600 }}>
                {video.participant}
                {video.instagramHandle && <span style={{ color: '#999', marginLeft: 8, fontWeight: 400 }}>{video.instagramHandle}</span>}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: '#f5f5f5', color: '#1a1a1a', border: '1.5px solid #e8e8e8',
              borderRadius: 8, padding: '0.4rem 1rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            }}>✕ Cerrar</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function VideoCard({ video, votes, rank, hasVotedToday, votedForThisVideo, onVote, onPlay }: {
  video: Video; votes: number; rank: number;
  hasVotedToday: boolean; votedForThisVideo: boolean;
  onVote: (id: string) => void; onPlay: (v: Video) => void;
}) {
  const [voting, setVoting] = useState(false);
  const [justVoted, setJustVoted] = useState(false);
  const [error, setError] = useState('');
  const [hovered, setHovered] = useState(false);
  const ytId = extractYoutubeId(video.youtubeId);
  const isTop3 = rank <= 3;
  const medals = ['🥇', '🥈', '🥉'];

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVotedToday || voting) return;
    setVoting(true); setError('');
    try {
      await onVote(video.id);
      setJustVoted(true);
      setTimeout(() => setJustVoted(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al votar');
      setTimeout(() => setError(''), 3000);
    } finally { setVoting(false); }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.22 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onPlay(video)}
      style={{
        background: '#fff',
        borderRadius: 14,
        overflow: 'hidden',
        border: isTop3 ? '2px solid #f5bf07' : '1.5px solid #ebebeb',
        boxShadow: isTop3
          ? '0 4px 20px rgba(245,191,7,0.15)'
          : hovered ? '0 8px 28px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex', flexDirection: 'column',
        cursor: 'pointer', position: 'relative',
        transition: 'box-shadow 0.2s',
      }}
    >
      {rank <= 15 && (
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 2,
          background: isTop3 ? '#f5bf07' : 'rgba(0,0,0,0.55)',
          color: isTop3 ? '#1a1a1a' : '#fff',
          fontFamily: 'var(--font-display)', fontSize: '0.95rem',
          padding: '2px 9px', borderRadius: 5, fontWeight: 700,
          backdropFilter: 'blur(4px)',
        }}>
          {medals[rank - 1] ? `${medals[rank - 1]} ${rank}` : `#${rank}`}
        </div>
      )}

      <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#f0f0f0', overflow: 'hidden' }}>
        <img
          src={getYoutubeThumbnail(ytId)}
          alt={video.title}
          loading="lazy"
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover',
            transform: hovered ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 0.35s ease',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hovered ? 1 : 0, transition: 'opacity 0.22s',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', background: '#f5bf07',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(245,191,7,0.5)',
          }}>
            <span style={{ fontSize: 17, marginLeft: 3, color: '#1a1a1a' }}>▶</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '0.85rem 1rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1a1a', lineHeight: 1.3, marginBottom: 3 }}>
            {video.title}
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f5bf07' }}>
            {video.participant}
            {video.instagramHandle && (
              <span style={{ color: '#bbb', fontWeight: 400, marginLeft: 6 }}>{video.instagramHandle}</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>❤️</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#1a1a1a', letterSpacing: 0.5 }}>
              {votes.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#bbb' }}>votos</span>
          </div>

          <div style={{ position: 'relative' }}>
            <ConfettiPop active={justVoted} />
            <motion.button
              whileTap={!hasVotedToday ? { scale: 0.92 } : {}}
              onClick={handleVote}
              disabled={hasVotedToday || voting}
              style={{
                background: votedForThisVideo
                  ? 'rgba(245,191,7,0.12)'
                  : hasVotedToday ? '#f5f5f5' : '#f5bf07',
                color: votedForThisVideo ? '#c49500' : hasVotedToday ? '#ccc' : '#1a1a1a',
                border: votedForThisVideo ? '1.5px solid #f5bf07' : hasVotedToday ? '1.5px solid #ebebeb' : 'none',
                borderRadius: 8, padding: '0.45rem 1rem',
                fontWeight: 700, fontSize: '0.82rem',
                cursor: hasVotedToday ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap', transition: 'all 0.18s',
                boxShadow: (!hasVotedToday && !votedForThisVideo) ? '0 2px 8px rgba(245,191,7,0.35)' : 'none',
              }}
            >
              {voting ? '...' : votedForThisVideo ? '✓ Votado' : hasVotedToday ? 'Ya votaste' : '❤️ Votar'}
            </motion.button>
          </div>
        </div>

        {error && <div style={{ fontSize: '0.7rem', color: '#e53e3e', textAlign: 'center' }}>{error}</div>}
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [voteState, setVoteState] = useState<VoteState>({ counts: {}, hasVotedToday: false, votedForVideoId: null });
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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchVotes();
    const iv = setInterval(fetchVotes, 30000);
    return () => clearInterval(iv);
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
      hasVotedToday: true, votedForVideoId: videoId,
    }));
    showToast('¡Voto registrado! 🎉');
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'Concurso INSENIA', text: '¡Vota por tu favorito!', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('¡Enlace copiado! 🔗');
    }
  };

  const videosWithVotes: VideoWithVotes[] = videos
    .map((v) => ({ ...v, votes: voteState.counts[v.id] || 0 }))
    .sort((a, b) => b.votes - a.votes)
    .map((v, i) => ({ ...v, rank: i + 1 }));

  const top15 = videosWithVotes.slice(0, 15);
  const totalVotes = Object.values(voteState.counts).reduce((a, b) => a + b, 0);

  const filteredVideos = videosWithVotes
    .filter((v) =>
      search === '' ||
      v.participant.toLowerCase().includes(search.toLowerCase()) ||
      v.title.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => sortBy === 'votes' ? b.votes - a.votes : a.participant.localeCompare(b.participant));

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
        background: '#fff',
        borderBottom: '2px solid #f5bf07',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '0.7rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src="/logo_recortado.jpg" alt="INSENIA" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
            <div style={{
              background: '#f5bf07', color: '#1a1a1a',
              fontFamily: 'var(--font-display)', fontSize: '0.78rem',
              letterSpacing: 1.5, padding: '3px 10px', borderRadius: 4, fontWeight: 700,
            }}>CONCURSO</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{
              background: '#fafafa', borderRadius: 8, padding: '0.35rem 0.9rem',
              fontSize: '0.83rem', color: '#888', border: '1.5px solid #ebebeb',
            }}>
              <span style={{ color: '#1a1a1a', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
                {totalVotes.toLocaleString()}
              </span>{' '}votos · <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{videos.length}</span> participantes
            </div>
            <button onClick={handleShare} style={{
              background: '#1a1a1a', color: '#fff',
              border: 'none', borderRadius: 8,
              padding: '0.35rem 1rem', fontSize: '0.83rem', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              ↗ Compartir
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '4rem 1.5rem 3rem',
        textAlign: 'center',
      }}>
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Accent line */}
          <div style={{ width: 48, height: 4, background: '#f5bf07', borderRadius: 2, margin: '0 auto 1.5rem' }} />

          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.8rem, 8vw, 5.5rem)',
            letterSpacing: 2, lineHeight: 0.95, color: '#1a1a1a', marginBottom: '1.2rem',
          }}>
            VOTA POR TU<br />
            <span style={{ color: '#f5bf07', WebkitTextStroke: '1px #e0a800' }}>VÍDEO FAVORITO</span>
          </div>

          <p style={{ color: '#555', fontSize: '1rem', maxWidth: 480, margin: '0 auto 0.5rem', lineHeight: 1.7 }}>
            Ayúdanos a preseleccionar los 15 candidatos a las Becas del 100%.
          </p>
          <p style={{ color: '#555', fontSize: '1rem', maxWidth: 480, margin: '0 auto 2rem', lineHeight: 1.7 }}>
            ⚠️ Sólo podrás votar <strong style={{ color: '#1a1a1a' }}>UNA VEZ AL DÍA</strong>, así que ¡elige bien!{' '}
            En el Ranking Top 15 podrás ver los más votados.
          </p>

          {voteState.hasVotedToday && (
            <motion.div initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#fffdf0', border: '2px solid #f5bf07',
              borderRadius: 30, padding: '0.55rem 1.4rem',
              color: '#1a1a1a', fontSize: '0.88rem', fontWeight: 600,
              marginBottom: '1.5rem',
            }}>
              ✓ Ya has votado hoy — vuelve mañana para votar de nuevo
            </motion.div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setActiveTab('all'); galleryRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              style={{
                background: '#1a1a1a', color: '#fff', border: 'none',
                borderRadius: 30, padding: '0.8rem 2.2rem',
                fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)', transition: 'opacity 0.15s',
              }}
            >
              Ver todos los vídeos ↓
            </button>
            <button
              onClick={() => { setActiveTab('top'); galleryRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              style={{
                background: '#f5bf07', color: '#1a1a1a', border: 'none',
                borderRadius: 30, padding: '0.8rem 2.2rem',
                fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(245,191,7,0.3)',
              }}
            >
              🏆 Top 15
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── MAIN ── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem 5rem', background: '#fafafa' }} ref={galleryRef}>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {(['all', 'top'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: activeTab === tab ? '#1a1a1a' : '#fff',
              color: activeTab === tab ? '#fff' : '#888',
              border: `1.5px solid ${activeTab === tab ? '#1a1a1a' : '#e0e0e0'}`,
              borderRadius: 30, padding: '0.45rem 1.3rem',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.18s',
            }}>
              {tab === 'all' ? `Todos (${videos.length})` : '🏆 Top 15'}
            </button>
          ))}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="text" placeholder="🔍 Buscar participante..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{
                background: '#fff', color: '#1a1a1a',
                border: '1.5px solid #e0e0e0', borderRadius: 30,
                padding: '0.45rem 1.2rem', fontSize: '0.85rem', outline: 'none', width: 210,
              }}
            />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'votes' | 'name')} style={{
              background: '#fff', color: '#888',
              border: '1.5px solid #e0e0e0', borderRadius: 30,
              padding: '0.45rem 1.2rem', fontSize: '0.85rem', outline: 'none', cursor: 'pointer',
            }}>
              <option value="votes">Más votados primero</option>
              <option value="name">Por nombre</option>
            </select>
          </div>
        </div>

        {/* TOP 15 */}
        {activeTab === 'top' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{
              background: '#1a1a1a', borderRadius: 16,
              padding: '1.4rem 1.6rem', marginBottom: '1.25rem',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: '1.8rem' }}>🏆</span>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', color: '#f5bf07', letterSpacing: 2, lineHeight: 1 }}>
                  RANKING TOP 15
                </div>
                <div style={{ color: '#777', fontSize: '0.82rem', marginTop: 3 }}>
                  Actualizado en tiempo real · Haz clic para ver el vídeo
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {top15.map((v, i) => {
                const maxVotes = top15[0]?.votes || 1;
                const pct = maxVotes > 0 ? (v.votes / maxVotes) * 100 : 0;
                const medals = ['🥇', '🥈', '🥉'];
                const isTop3 = i < 3;
                return (
                  <motion.div key={v.id}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ x: 3 }}
                    onClick={() => setActiveVideo(v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: isTop3 ? '#fffdf0' : '#fff',
                      borderRadius: 10, padding: '0.75rem 1rem',
                      border: isTop3 ? '1.5px solid #f5bf07' : '1.5px solid #ebebeb',
                      cursor: 'pointer', transition: 'all 0.18s',
                    }}
                  >
                    <div style={{
                      fontFamily: 'var(--font-display)', fontSize: '1.2rem', minWidth: 38,
                      color: isTop3 ? '#f5bf07' : '#ccc', textAlign: 'center',
                    }}>
                      {medals[i] || `#${i + 1}`}
                    </div>
                    <img
                      src={getYoutubeThumbnail(extractYoutubeId(v.youtubeId))}
                      alt={v.title}
                      style={{ width: 62, height: 35, objectFit: 'cover', borderRadius: 6 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {v.participant}
                      </div>
                      <div style={{ fontSize: '0.73rem', color: '#999', marginTop: 1 }}>{v.title}</div>
                      <div style={{ height: 3, background: '#ebebeb', borderRadius: 2, marginTop: 5, overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.3 + i * 0.04, duration: 0.7, ease: 'easeOut' }}
                          style={{ height: '100%', background: '#f5bf07', borderRadius: 2 }}
                        />
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#1a1a1a', minWidth: 52, textAlign: 'right' }}>
                      {v.votes.toLocaleString()}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ALL VIDEOS */}
        {activeTab === 'all' && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#bbb' }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>⏳</div>Cargando vídeos...
              </div>
            ) : filteredVideos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#bbb' }}>
                No se encontraron participantes con ese nombre.
              </div>
            ) : (
              <motion.div layout style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(272px, 1fr))',
                gap: '1.1rem',
              }}>
                {filteredVideos.map((v) => (
                  <VideoCard
                    key={v.id} video={v} votes={v.votes} rank={v.rank!}
                    hasVotedToday={voteState.hasVotedToday}
                    votedForThisVideo={voteState.votedForVideoId === v.id}
                    onVote={handleVote} onPlay={setActiveVideo}
                  />
                ))}
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#1a1a1a', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <img src="/logo_blanco.png" alt="INSENIA" style={{ height: 32, marginBottom: '0.8rem', opacity: 0.85 }} />
        <p style={{ color: '#666', fontSize: '0.82rem' }}>© INSENIA Design School Madrid · Concurso de Vídeos</p>
        <p style={{ color: '#444', fontSize: '0.73rem', marginTop: 4 }}>1 voto por usuario al día · Votos en tiempo real</p>
      </footer>

      <AnimatePresence>
        {activeVideo && <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
              background: '#f5bf07', color: '#1a1a1a',
              borderRadius: 30, padding: '0.7rem 1.6rem',
              fontWeight: 700, fontSize: '0.95rem',
              boxShadow: '0 4px 20px rgba(245,191,7,0.4)',
              zIndex: 2000, whiteSpace: 'nowrap',
            }}
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        body { background: #fafafa !important; }
        input::placeholder { color: #bbb; }
        @media (max-width: 640px) {
          header > div { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </>
  );
}
