import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Experience } from './components/Experience';
import { BirthdayLetter } from './components/BirthdayLetter';
import { GestureController } from './components/GestureController';
import { MediaGallery } from './components/MediaGallery';
import { StartMenu } from './components/StartMenu';
import { UIOverlay } from './components/UIOverlay';
import { MediaItem, TreeMode } from './types';

const embeddedMediaModules = import.meta.glob('./picture/*.{jpg,jpeg,png,webp,gif,mp4,webm,mov}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const EMBEDDED_MEDIA: MediaItem[] = Object.entries(embeddedMediaModules)
  .sort(([pathA], [pathB]) => pathA.localeCompare(pathB, 'zh-CN', { numeric: true }))
  .map(([path, url], index) => ({
    id: `memory-${index + 1}`,
    name: path.split('/').pop() ?? `memory-${index + 1}`,
    url,
    type: /\.(mp4|webm|mov)$/i.test(path) ? 'video' : 'image',
  }));

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('3D scene failed to render:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-8 text-center text-[#D4AF37]">
          <div>
            <h2 className="font-serif text-2xl">场景加载遇到问题</h2>
            <p className="mt-2 text-sm text-white/55">请刷新页面后重试。</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="mt-5 rounded-full border border-[#D4AF37] px-5 py-2"
            >
              重新加载场景
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [showMenu, setShowMenu] = useState(true);
  const [page, setPage] = useState<'scene' | 'letter'>('scene');
  const [name, setName] = useState('');
  const [age, setAge] = useState(24);
  const [mode, setMode] = useState<TreeMode>(TreeMode.CHAOS);
  const [handPosition, setHandPosition] = useState({ x: 0.5, y: 0.5, detected: false });
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);
  const appRootRef = useRef<HTMLDivElement>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const imageCount = useMemo(
    () => EMBEDDED_MEDIA.filter((item) => item.type === 'image').length,
    [],
  );
  const videoCount = EMBEDDED_MEDIA.length - imageCount;

  const enterFullscreen = useCallback(async () => {
    const element = appRootRef.current ?? document.documentElement;
    if (document.fullscreenElement || !element.requestFullscreen) return;
    try {
      await element.requestFullscreen();
    } catch {
      // Fullscreen is optional and browsers may require a stricter gesture context.
    }
  }, []);

  const handleStart = useCallback((userName: string, userAge: number, audioElement?: HTMLAudioElement) => {
    setName(userName);
    setAge(userAge);
    audioElementRef.current = audioElement ?? null;
    setShowMenu(false);
    setPage('scene');
    setMode(TreeMode.FORMED);
    void enterFullscreen();
  }, [enterFullscreen]);

  const openGallery = useCallback(() => {
    setAutoRotate(false);
    setGalleryIndex(0);
    setGalleryOpen(true);
  }, []);

  const closeGallery = useCallback(() => {
    setGalleryOpen(false);
  }, []);

  const advanceMedia = useCallback(() => {
    setGalleryIndex((index) => (index + 1) % EMBEDDED_MEDIA.length);
  }, []);

  const openLetter = useCallback(() => {
    setAutoRotate(false);
    setGalleryOpen(false);
    setPage('letter');
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeGallery();
      if (!galleryOpen) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') advanceMedia();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [advanceMedia, closeGallery, galleryOpen]);

  return (
    <div
      ref={appRootRef}
      className="relative h-screen w-full overflow-hidden bg-gradient-to-b from-black via-[#1a0a1a] to-[#2f0a2f]"
    >
      {showMenu ? (
        <StartMenu
          mediaCount={EMBEDDED_MEDIA.length}
          imageCount={imageCount}
          videoCount={videoCount}
          onStart={handleStart}
        />
      ) : page === 'letter' ? (
        <BirthdayLetter onBack={() => setPage('scene')} />
      ) : (
        <>
          <ErrorBoundary>
            <Canvas
              dpr={[1, 2]}
              camera={{ position: [0, 2, 15], fov: 50 }}
              gl={{ antialias: false, stencil: false, alpha: false, powerPreference: 'high-performance' }}
              shadows
              frameloop="always"
              resize={{ debounce: 0 }}
            >
              <Suspense fallback={null}>
                <Experience
                  mode={mode}
                  handPosition={handPosition}
                  mediaItems={EMBEDDED_MEDIA}
                  autoRotate={autoRotate}
                  galleryOpen={galleryOpen}
                  age={age}
                  name={name}
                  audioElement={audioElementRef.current}
                />
              </Suspense>
            </Canvas>
          </ErrorBoundary>

          <Loader
            containerStyles={{ background: '#000' }}
            innerStyles={{ width: '300px', height: '10px', background: '#333' }}
            barStyles={{ background: '#D4AF37', height: '10px' }}
            dataStyles={{ color: '#D4AF37', fontFamily: 'Cinzel' }}
          />

          <UIOverlay
            mode={mode}
            name={name}
            isRecording={false}
            recordingTime={0}
            videoUrl=""
          />

          <MediaGallery
            items={EMBEDDED_MEDIA}
            activeIndex={galleryIndex}
            isOpen={galleryOpen}
            onAdvance={advanceMedia}
            onClose={closeGallery}
          />

          <GestureController
            currentMode={mode}
            onModeChange={setMode}
            isGalleryOpen={galleryOpen}
            onGalleryOpen={openGallery}
            onGalleryClose={closeGallery}
            onMediaAdvance={advanceMedia}
            onAutoRotateChange={setAutoRotate}
            onLetterOpen={openLetter}
            onHandPosition={(x, y, detected) => setHandPosition({ x, y, detected })}
          />
        </>
      )}
    </div>
  );
}
