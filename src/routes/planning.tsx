import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { ITINERARY } from '~/data/trip';

type WikiPhoto = { src: string; caption: string; article: string };

function useWikiPhotos(articles: string[]) {
  const key = articles.join('||');
  const [photos, setPhotos] = React.useState<(WikiPhoto | null | 'loading')[]>(() =>
    articles.map(() => 'loading' as const),
  );

  React.useEffect(() => {
    setPhotos(articles.map(() => 'loading' as const));
    const controllers = articles.map(() => new AbortController());

    articles.forEach((article, i) => {
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(article)}`, {
        signal: controllers[i].signal,
      })
        .then((r) => r.json())
        .then((data: { thumbnail?: { source?: string }; description?: string; title?: string }) => {
          setPhotos((prev) => {
            const next = [...prev];
            next[i] = data.thumbnail?.source
              ? { src: data.thumbnail.source, caption: data.description || data.title || article, article }
              : null;
            return next;
          });
        })
        .catch(() => {
          setPhotos((prev) => {
            const next = [...prev];
            next[i] = null;
            return next;
          });
        });
    });

    return () => controllers.forEach((c) => c.abort());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return photos;
}

function PhotoModal({
  photos,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  photos: WikiPhoto[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const photo = photos[index];

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.18 }}
        className="relative max-w-3xl w-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white text-3xl font-light leading-none"
        >
          ×
        </button>

        {/* Image */}
        <div className="relative w-full">
          <img
            src={photo.src}
            alt={photo.article}
            className="w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
          />

          {/* Prev */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={onPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center text-xl transition-colors"
            >
              ‹
            </button>
          )}
          {/* Next */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={onNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center text-xl transition-colors"
            >
              ›
            </button>
          )}
        </div>

        {/* Caption */}
        <div className="mt-3 text-center px-2">
          <p className="font-handwritten font-bold text-white text-lg leading-tight">{photo.article}</p>
          {photo.caption !== photo.article && (
            <p className="text-white/60 text-sm mt-0.5 leading-snug">{photo.caption}</p>
          )}
          <p className="text-white/30 text-xs mt-1">
            {index + 1} / {photos.length}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function PhotoGallery({ articles }: { articles: string[] }) {
  const rawPhotos = useWikiPhotos(articles);
  const [modalIdx, setModalIdx] = React.useState<number | null>(null);

  const loaded = rawPhotos.filter((p): p is WikiPhoto => p !== 'loading' && p !== null);
  const loading = rawPhotos.some((p) => p === 'loading');

  if (!loading && loaded.length === 0) return null;

  return (
    <>
      <div>
        <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest mb-2">Photos</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {rawPhotos.map((p, i) =>
            p === 'loading' ? (
              <div key={i} className="w-28 h-20 shrink-0 rounded-lg bg-kraft/30 animate-pulse" />
            ) : p === null ? null : (
              <button
                key={p.article}
                type="button"
                onClick={() => setModalIdx(loaded.indexOf(p))}
                className="shrink-0 group relative w-28 h-20 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <img src={p.src} alt={p.article} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-[9px] font-handwritten font-bold leading-tight truncate">{p.article}</p>
                </div>
              </button>
            ),
          )}
        </div>
      </div>

      <AnimatePresence>
        {modalIdx !== null && loaded[modalIdx] ? (
          <PhotoModal
            photos={loaded}
            index={modalIdx}
            onClose={() => setModalIdx(null)}
            onPrev={() => setModalIdx((i) => (i! - 1 + loaded.length) % loaded.length)}
            onNext={() => setModalIdx((i) => (i! + 1) % loaded.length)}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

const JapanMap = React.lazy(() => import('~/components/japan-map'));

const PLANNING_STORAGE_KEY = 'monkey-japan-planning-seen';

function useSeenDays() {
  const [seenDays, setSeenDays] = React.useState<Set<number>>(new Set());

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(PLANNING_STORAGE_KEY);
      if (saved) {
        setSeenDays(new Set(JSON.parse(saved) as number[]));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleSeen = React.useCallback((day: number) => {
    setSeenDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      try {
        localStorage.setItem(PLANNING_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { seenDays, toggleSeen };
}

function SidebarOptionPhoto({ article }: { article: string }) {
  const [src, setSrc] = React.useState<string | null | 'loading'>('loading');
  const [caption, setCaption] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(article)}`)
      .then((r) => r.json())
      .then((data: { thumbnail?: { source?: string }; description?: string }) => {
        if (!cancelled) {
          setSrc(data.thumbnail?.source ?? null);
          setCaption(data.description || '');
        }
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [article]);

  if (src === 'loading') return <div className="w-full h-24 rounded-lg bg-kraft/30 animate-pulse mt-2" />;
  if (!src) return null;
  return (
    <div className="mt-2 rounded-lg overflow-hidden">
      <img src={src} alt={article} className="w-full h-24 object-cover rounded-lg" />
      {caption && <p className="text-[10px] text-ink/50 leading-snug mt-1">{caption}</p>}
    </div>
  );
}

function MiniThumb({ article }: { article: string }) {
  const [src, setSrc] = React.useState<string | null | 'loading'>('loading');

  React.useEffect(() => {
    let cancelled = false;
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(article)}`)
      .then((r) => r.json())
      .then((data: { thumbnail?: { source?: string } }) => {
        if (!cancelled) setSrc(data.thumbnail?.source ?? null);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [article]);

  if (src === 'loading') return <div className="w-10 h-10 rounded-lg bg-kraft/30 animate-pulse shrink-0" />;
  if (!src) return <div className="w-10 h-10 rounded-lg bg-kraft/20 shrink-0" />;
  return <img src={src} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />;
}

function MobilePhotoModal({ article, label, onClose }: { article: string; label: string; onClose: () => void }) {
  const [src, setSrc] = React.useState<string | null | 'loading'>('loading');
  const [desc, setDesc] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(article)}`)
      .then((r) => r.json())
      .then((data: { thumbnail?: { source?: string }; description?: string }) => {
        if (!cancelled) {
          setSrc(data.thumbnail?.source ?? null);
          setDesc(data.description || '');
        }
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [article]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-9999 flex items-end justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {src === 'loading' ? (
          <div className="w-full h-56 bg-kraft/30 animate-pulse" />
        ) : src ? (
          <img src={src} alt={label} className="w-full h-56 object-cover" />
        ) : (
          <div className="w-full h-32 bg-kraft/30 flex items-center justify-center">
            <span className="text-ink/30 text-sm font-handwritten">Pas d'image disponible</span>
          </div>
        )}
        <div className="bg-white px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-handwritten font-bold text-ink text-base leading-tight">{label}</p>
              {desc && <p className="text-ink/50 text-xs mt-0.5 leading-snug line-clamp-3">{desc}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-ink/30 hover:text-ink text-2xl leading-none mt-0.5 shrink-0"
            >
              ×
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SidebarDayCard({
  day,
  isActive,
  isSeen,
  onSelect,
  onToggleSeen,
}: {
  day: import('~/data/trip').DayPlan;
  isActive: boolean;
  isSeen: boolean;
  onSelect: () => void;
  onToggleSeen: () => void;
}) {
  const [activeOpt, setActiveOpt] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!isActive) setActiveOpt(null);
  }, [isActive]);
  const optArticle = (i: number) => {
    if (day.optionArticles?.[i]) return day.optionArticles[i];
    const opt = day.options[i];
    return (
      day.wikiArticles.find((a) => a.toLowerCase().includes(opt.label.split(' ')[0].toLowerCase())) ??
      day.wikiArticles[i] ??
      day.wikiArticles[0]
    );
  };

  return (
    <div
      data-day={day.day}
      className={`paper-card rounded-lg border transition-all ${
        isActive ? 'border-torii shadow-md bg-sakura-light/30' : 'border-kraft'
      } ${isSeen ? 'opacity-60' : ''}`}
    >
      {/* Day header row */}
      <div className="px-3 py-2 flex items-start gap-3">
        <span className="text-xl shrink-0 mt-0.5">{day.emoji}</span>
        <button
          type="button"
          onClick={onSelect}
          className="min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="stamp text-[9px] p-[1px_5px]! border-[1.5px]! shrink-0">J{day.day}</span>
            <span className="text-xs font-handwritten text-ink/40 truncate">
              {day.weekday} {day.date}
            </span>
          </div>
          <p className="font-handwritten font-bold text-ink text-sm leading-tight">{day.location}</p>
          {!isActive && <p className="text-ink/50 text-xs leading-snug mt-0.5 line-clamp-2">{day.description}</p>}
        </button>
        <button
          type="button"
          onClick={onToggleSeen}
          className="w-5 h-5 rounded-full border border-kraft/50 flex items-center justify-center text-[10px] hover:border-matcha transition-colors shrink-0 mt-0.5"
        >
          {isSeen ? <span className="text-matcha font-bold">✓</span> : null}
        </button>
      </div>

      {/* Expanded: 3 options */}
      <AnimatePresence>
        {isActive ? (
          <motion.div
            key="opts"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-kraft/40 px-3 pb-3 pt-2 space-y-3">
              <p className="text-[9px] font-bold text-ink/30 uppercase tracking-widest mb-1">À proximité</p>
              {day.options.map((opt, i) => (
                <div key={opt.label} className="rounded-lg border border-kraft/30 overflow-hidden">
                  <SidebarOptionPhoto article={optArticle(i)} />
                  <div className="px-2.5 py-2">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-handwritten font-bold text-ink text-xs">{opt.label}</span>
                      <span className="text-ink/30 text-[9px] shrink-0">{opt.time}</span>
                    </div>
                    <p className="text-ink/50 text-[10px] leading-snug">{opt.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function Planning() {
  const { seenDays, toggleSeen } = useSeenDays();
  const [view, setView] = React.useState<'list' | 'map'>('map');
  const [activeDay, setActiveDay] = React.useState<number | null>(null);
  const [expandedDay, setExpandedDay] = React.useState<number | null>(null);
  const [mobilePhotoArticle, setMobilePhotoArticle] = React.useState<{ article: string; label: string } | null>(null);

  const listRef = React.useRef<HTMLDivElement>(null);

  function scrollToDay(day: number) {
    setActiveDay(day);
    const el = listRef.current?.querySelector(`[data-day="${day}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div
      className={`max-w-7xl mx-auto ${view === 'map' ? 'p-4 flex flex-col overflow-hidden' : 'px-4 py-8 sm:py-12'}`}
      style={view === 'map' ? { height: 'calc(100dvh - 64px)' } : undefined}
    >
      {/* Switch — masqué sur mobile en vue carte (flottant sur la map à la place) */}
      <div
        className={`shrink-0 flex items-center justify-center ${view === 'map' ? 'hidden lg:flex py-3' : 'mb-8 mt-8'}`}
      >
        <div className="paper-card rounded-xl p-1 flex gap-1 border border-kraft">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`px-5 py-2 rounded-lg font-handwritten text-base font-bold transition-all ${
              view === 'list' ? 'bg-torii text-white shadow-sm' : 'text-ink/50 hover:text-ink'
            }`}
          >
            📋 Liste
          </button>
          <button
            type="button"
            onClick={() => setView('map')}
            className={`px-5 py-2 rounded-lg font-handwritten text-base font-bold transition-all ${
              view === 'map' ? 'bg-torii text-white shadow-sm' : 'text-ink/50 hover:text-ink'
            }`}
          >
            🗾 Carte
          </button>
        </div>
      </div>

      {/* MAP VIEW */}
      {view === 'map' ? (
        <motion.div
          key="map"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 pb-4"
        >
          {/* Map — pleine hauteur sur mobile */}
          <div className="flex-1 lg:flex-2 relative min-h-0 h-full">
            <React.Suspense
              fallback={
                <div className="w-full h-full paper-card rounded-xl flex items-center justify-center">
                  <span className="font-handwritten text-xl text-ink/40 animate-pulse">Chargement de la carte…</span>
                </div>
              }
            >
              <JapanMap days={ITINERARY} activeDay={activeDay} onDayClick={scrollToDay} />
            </React.Suspense>

            {/* Switch flottant mobile — en bas de la map */}
            <div className="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
              <div className="paper-card rounded-xl p-1 flex gap-1 border border-kraft shadow-lg">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="px-4 py-1.5 rounded-lg font-handwritten text-sm font-bold text-ink/50 hover:text-ink transition-all"
                >
                  📋 Liste
                </button>
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-lg font-handwritten text-sm font-bold bg-torii text-white shadow-sm"
                  onClick={() => setView('map')}
                >
                  🗾 Carte
                </button>
              </div>
            </div>

            {/* Popup mobile — s'affiche en haut de la map quand un pin est sélectionné */}
            {activeDay !== null
              ? (() => {
                  const day = ITINERARY.find((d) => d.day === activeDay);
                  if (!day) return null;
                  return (
                    <motion.div
                      key={activeDay}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="lg:hidden absolute top-3 left-3 right-3 z-30 paper-card rounded-xl border border-kraft shadow-lg overflow-hidden"
                    >
                      {/* Header */}
                      <div className="flex items-start gap-2 px-3 py-2.5">
                        <span className="text-xl shrink-0 mt-0.5">{day.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="stamp text-[9px] p-[1px_5px]! border-[1.5px]! shrink-0">J{day.day}</span>
                            <span className="text-xs font-handwritten text-ink/40">
                              {day.weekday} {day.date}
                            </span>
                          </div>
                          <p className="font-handwritten font-bold text-ink text-sm leading-tight">{day.location}</p>
                          <p className="text-ink/60 text-xs leading-snug mt-0.5 line-clamp-2">{day.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveDay(null)}
                          className="text-ink/30 hover:text-ink text-xl leading-none shrink-0 mt-0.5"
                        >
                          ×
                        </button>
                      </div>

                      {/* 3 liens de lieux */}
                      {day.options.length > 0 ? (
                        <div className="px-3 pb-2.5 border-t border-kraft/30 pt-2 flex flex-col gap-1.5">
                          {day.options.map((opt, i) => {
                            const article =
                              day.optionArticles?.[i] ??
                              day.wikiArticles.find((a) =>
                                a.toLowerCase().includes(opt.label.split(' ')[0].toLowerCase()),
                              ) ??
                              day.wikiArticles[i] ??
                              day.wikiArticles[0];
                            return (
                              <button
                                key={opt.label}
                                type="button"
                                onClick={() => setMobilePhotoArticle({ article, label: opt.label })}
                                className="text-left flex items-center gap-2 group w-full"
                              >
                                <MiniThumb article={article} />
                                <div className="min-w-0 flex-1">
                                  <span className="font-handwritten font-semibold text-torii text-sm group-hover:underline leading-tight block">
                                    {opt.label}
                                  </span>
                                  <span className="text-ink/40 text-[10px] leading-tight">{opt.time}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </motion.div>
                  );
                })()
              : null}
          </div>

          {/* Sidebar — cachée sur mobile, visible lg+ */}
          <div
            ref={listRef}
            className="hidden lg:flex lg:w-72 xl:w-80 overflow-y-auto flex-col gap-2 pr-1"
            style={{ maxHeight: '100%' }}
          >
            {ITINERARY.map((day) => {
              const isSeen = seenDays.has(day.day);
              const isActive = activeDay === day.day;
              return (
                <SidebarDayCard
                  key={day.day}
                  day={day}
                  isActive={isActive}
                  isSeen={isSeen}
                  onSelect={() => {
                    setActiveDay(isActive ? null : day.day);
                  }}
                  onToggleSeen={() => toggleSeen(day.day)}
                />
              );
            })}
          </div>
        </motion.div>
      ) : null}

      {/* LIST VIEW */}
      {view === 'list' ? (
        <motion.div key="list" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="max-w-4xl mx-auto">
            {/* Timeline - journal entries */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-kraft" />

              <div className="space-y-5">
                {ITINERARY.map((day, index) => {
                  const isSeen = seenDays.has(day.day);
                  const isExpanded = expandedDay === day.day;
                  return (
                    <React.Fragment key={day.day}>
                      {/* Section label */}
                      {day.sectionLabel ? (
                        <div className="ml-16 sm:ml-20 pt-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-torii/10 border border-torii/20 font-handwritten font-bold text-torii text-sm">
                            {day.sectionLabel}
                          </span>
                        </div>
                      ) : null}

                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                      >
                        <div className="relative flex gap-4 sm:gap-6">
                          {/* Timeline dot */}
                          <div className="relative z-10 shrink-0">
                            <div
                              className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg paper-card flex items-center justify-center text-2xl sm:text-3xl transition-opacity ${isSeen ? 'opacity-50' : ''}`}
                              style={{ transform: `rotate(${((index % 3) - 1) * 2}deg)` }}
                            >
                              {day.emoji}
                            </div>
                          </div>

                          {/* Card */}
                          <div
                            className={`flex-1 paper-card rounded-lg overflow-hidden transition-all notebook-lines relative ${isSeen ? 'opacity-60' : ''}`}
                            style={{ transform: `rotate(${index % 2 === 0 ? -0.3 : 0.3}deg)` }}
                          >
                            {/* Seen toggle button */}
                            <button
                              type="button"
                              onClick={() => toggleSeen(day.day)}
                              className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full border border-kraft/60 flex items-center justify-center hover:border-matcha transition-colors text-xs"
                              title={isSeen ? 'Marquer non vu' : 'Marquer vu'}
                            >
                              {isSeen ? (
                                <span className="text-matcha font-bold">✓</span>
                              ) : (
                                <span className="text-ink/20">○</span>
                              )}
                            </button>

                            {/* Header – click to expand */}
                            <button
                              type="button"
                              onClick={() => setExpandedDay(isExpanded ? null : day.day)}
                              className="w-full text-left p-4 sm:p-5 hover:bg-kraft/5 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2 pr-8">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="stamp text-[10px] p-[1px_6px]! border-2!">Jour {day.day}</span>
                                    <span className="text-sm font-handwritten text-ink/40">
                                      {day.weekday} {day.date}
                                    </span>
                                  </div>
                                  <h3 className="text-xl sm:text-2xl font-handwritten font-bold text-ink">
                                    {day.location}
                                  </h3>
                                </div>
                                <span className="text-ink/25 text-xs mt-2 shrink-0 select-none">
                                  {isExpanded ? '▲' : '▼'}
                                </span>
                              </div>
                              <p className="text-ink/70 text-sm sm:text-base leading-relaxed">{day.description}</p>
                            </button>

                            {/* Expanded content */}
                            <AnimatePresence>
                              {isExpanded ? (
                                <motion.div
                                  key="expanded"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.25 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 sm:px-5 pb-5 border-t border-kraft/40 space-y-3 pt-3">
                                    {/* Programme */}
                                    <div>
                                      <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest mb-1">
                                        Programme
                                      </p>
                                      <p className="text-sm text-ink/80 leading-relaxed">{day.program}</p>
                                    </div>

                                    {/* Options de proximité */}
                                    {day.options.length > 0 ? (
                                      <div>
                                        <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest mb-1.5">
                                          Options à proximité
                                        </p>
                                        <ul className="space-y-1.5">
                                          {day.options.map((opt) => (
                                            <li key={opt.label} className="flex items-start gap-1.5 text-xs sm:text-sm">
                                              <span className="text-torii shrink-0 mt-0.5">•</span>
                                              <span>
                                                <span className="font-semibold text-ink">{opt.label}</span>
                                                <span className="text-ink/40"> ({opt.time})</span>
                                                <span className="text-ink/60"> — {opt.description}</span>
                                              </span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    ) : null}

                                    {/* Tip */}
                                    <div className="bg-[#fff9c4]/70 rounded-lg px-3 py-2">
                                      <p className="text-xs sm:text-sm text-ink/70 leading-relaxed">💡 {day.tip}</p>
                                    </div>

                                    {/* Wikipedia images */}
                                    <PhotoGallery articles={day.wikiArticles} />
                                  </div>
                                </motion.div>
                              ) : null}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Sticky note base */}
            <motion.div
              initial={{ opacity: 0, rotate: -2 }}
              animate={{ opacity: 1, rotate: -1 }}
              transition={{ delay: 0.5 }}
              className="mt-10 max-w-xs mx-auto"
            >
              <div className="bg-[#fff9c4] p-5 shadow-md rounded-sm relative" style={{ transform: 'rotate(-1deg)' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-4 bg-washi/80 rounded-sm" />
                <p className="text-2xl text-center mb-1">🏨</p>
                <p className="font-handwritten text-xl font-bold text-center text-ink">Base : Shinjuku</p>
                <p className="text-sm text-ink/60 text-center">Retour chaque soir</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}

      {/* Modal photo lieu — mobile */}
      <AnimatePresence>
        {mobilePhotoArticle ? (
          <MobilePhotoModal
            article={mobilePhotoArticle.article}
            label={mobilePhotoArticle.label}
            onClose={() => setMobilePhotoArticle(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
