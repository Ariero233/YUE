import React, { useEffect, useState } from 'react';

interface StartMenuProps {
  mediaCount: number;
  imageCount: number;
  videoCount: number;
  onStart: (name: string, age: number, audioElement?: HTMLAudioElement) => void;
}

const DEFAULT_NAME = '胡悦';
const DEFAULT_AGE = '24';

export const StartMenu: React.FC<StartMenuProps> = ({
  mediaCount,
  imageCount,
  videoCount,
  onStart,
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    let nameIndex = 0;
    let ageIndex = 0;
    let ageTimer: number | undefined;

    const nameTimer = window.setInterval(() => {
      nameIndex += 1;
      setName(DEFAULT_NAME.slice(0, nameIndex));
      if (nameIndex >= DEFAULT_NAME.length) {
        window.clearInterval(nameTimer);
        ageTimer = window.setInterval(() => {
          ageIndex += 1;
          setAge(DEFAULT_AGE.slice(0, ageIndex));
          if (ageIndex >= DEFAULT_AGE.length) {
            if (ageTimer) window.clearInterval(ageTimer);
            window.setTimeout(() => setIsReady(true), 350);
          }
        }, 320);
      }
    }, 420);

    return () => {
      window.clearInterval(nameTimer);
      if (ageTimer) window.clearInterval(ageTimer);
    };
  }, []);

  const handleStart = async () => {
    if (!isReady || isStarting) return;
    setIsStarting(true);

    try {
      const permissionStream = await navigator.mediaDevices?.getUserMedia({
        video: { width: 640, height: 360, facingMode: 'user' },
      });
      permissionStream?.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.warn('摄像头权限未授予，页面仍将继续打开。', error);
    }

    const audioElement = new Audio('/audio/background-music.mp3');
    audioElement.loop = true;
    audioElement.volume = 0.5;
    void audioElement.play().catch(() => undefined);

    onStart(DEFAULT_NAME, Number(DEFAULT_AGE), audioElement);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#411339_0%,#190a1a_38%,#020303_75%)]">
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_center,rgba(255,220,120,.15)_0_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative mx-4 w-full max-w-lg rounded-[2rem] border border-[#D4AF37]/70 bg-black/70 p-7 shadow-[0_0_90px_rgba(212,175,55,.16)] backdrop-blur-xl md:p-10">
        <div className="mb-8 text-center">
          <p className="mb-3 text-xs tracking-[0.45em] text-[#D4AF37]/70">A BIRTHDAY MEMORY</p>
          <h1 className="bg-gradient-to-r from-[#C89B2C] via-[#FFF3C4] to-[#C89B2C] bg-clip-text font-serif text-4xl font-bold text-transparent md:text-5xl">
            Happy Birthday
          </h1>
          <p className="mt-3 text-sm text-white/45">为你自动准备专属庆祝场景</p>
        </div>

        <div className="space-y-4">
          <label className="block rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
            <span className="mb-2 block text-xs tracking-[0.28em] text-[#D4AF37]">姓名</span>
            <span className="flex min-h-8 items-center font-serif text-2xl text-white">
              {name}
              {!isReady && <span className="ml-1 h-7 w-px animate-pulse bg-[#F5E6BF]" />}
            </span>
          </label>

          <label className="block rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
            <span className="mb-2 block text-xs tracking-[0.28em] text-[#D4AF37]">年龄</span>
            <span className="flex min-h-8 items-center font-serif text-2xl text-white">
              {age}
              {name === DEFAULT_NAME && !isReady && <span className="ml-1 h-7 w-px animate-pulse bg-[#F5E6BF]" />}
            </span>
          </label>

          <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.06] px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="block text-xs tracking-[0.28em] text-[#D4AF37]">回忆媒体</span>
                <span className="mt-2 block text-sm text-white/70">
                  {imageCount} 张照片 · {videoCount} 段静音视频
                </span>
              </div>
              <span className="rounded-full border border-[#D4AF37]/40 px-3 py-1 text-xs text-[#F5E6BF]">
                {mediaCount} 项已嵌入
              </span>
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!isReady || isStarting}
            className="mt-2 w-full rounded-2xl bg-gradient-to-r from-[#B98720] via-[#F4D678] to-[#B98720] px-8 py-4 font-serif text-lg font-bold tracking-[0.18em] text-black transition duration-300 hover:scale-[1.01] hover:shadow-[0_0_34px_rgba(212,175,55,.45)] disabled:cursor-wait disabled:opacity-40"
          >
            {isStarting ? '正在开启摄像头…' : isReady ? '进入庆祝场景' : '正在准备…'}
          </button>
        </div>
      </div>
    </div>
  );
};
