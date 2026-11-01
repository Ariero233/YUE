import React, { useEffect, useRef } from 'react';
import { MediaItem } from '../types';

interface MediaGalleryProps {
  items: MediaItem[];
  activeIndex: number;
  isOpen: boolean;
  onAdvance: () => void;
  onClose: () => void;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  items,
  activeIndex,
  isOpen,
  onAdvance,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeItem = items[activeIndex];

  useEffect(() => {
    if (!isOpen || activeItem?.type !== 'video') return;
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play().catch(() => undefined);
    return () => video.pause();
  }, [activeIndex, activeItem?.type, isOpen]);

  if (!isOpen || !activeItem) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl md:p-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,.13),transparent_58%)]" />

      <div className="relative flex h-full w-full max-w-6xl flex-col items-center justify-center">
        <div className="absolute left-0 top-0 flex items-center gap-3 text-[#F5E6BF]">
          <span className="h-px w-10 bg-[#D4AF37]" />
          <span className="text-xs tracking-[0.32em]">回忆浏览</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto absolute right-0 top-0 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm text-white/75 transition hover:border-[#D4AF37] hover:text-[#F5E6BF]"
        >
          握拳退出 · ESC
        </button>

        <div className="relative flex max-h-[76vh] max-w-[88vw] items-center justify-center overflow-hidden rounded-3xl border border-[#D4AF37]/50 bg-black shadow-[0_28px_100px_rgba(0,0,0,.65),0_0_50px_rgba(212,175,55,.12)]">
          {activeItem.type === 'video' ? (
            <video
              ref={videoRef}
              key={activeItem.url}
              src={activeItem.url}
              autoPlay
              loop
              muted
              playsInline
              className="max-h-[76vh] max-w-[88vw] object-contain"
            />
          ) : (
            <img
              key={activeItem.url}
              src={activeItem.url}
              alt={`回忆 ${activeIndex + 1}`}
              className="max-h-[76vh] max-w-[88vw] object-contain"
            />
          )}

          {activeItem.type === 'video' && (
            <span className="absolute bottom-4 right-4 rounded-full border border-white/20 bg-black/65 px-3 py-1 text-xs tracking-[0.2em] text-white/65">
              MUTED VIDEO
            </span>
          )}
        </div>

        <div className="mt-6 flex items-center gap-5">
          <div className="min-w-36 text-center">
            <p className="font-serif text-lg text-white">胡悦的回忆</p>
            <p className="mt-1 text-xs tracking-[0.24em] text-[#D4AF37]">
              {String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
            </p>
          </div>
          <button
            type="button"
            onClick={onAdvance}
            className="pointer-events-auto rounded-full border border-[#D4AF37]/40 px-5 py-2 text-sm tracking-[0.16em] text-[#F5E6BF] transition hover:bg-[#D4AF37]/15"
            aria-label="下一项"
          >
            下一段回忆 →
          </button>
        </div>

        <p className="mt-4 text-center text-xs tracking-[0.16em] text-white/45">
          单食指向左或向右滑动，都会前往下一段回忆 · 握拳返回蛋糕
        </p>
      </div>
    </div>
  );
};
