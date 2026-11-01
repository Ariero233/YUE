import React from 'react';
import { TreeMode } from '../types';

interface UIOverlayProps {
  mode: TreeMode;
  name: string;
  isRecording: boolean;
  recordingTime: number;
  videoUrl: string;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ 
  mode, 
  name, 
  isRecording, 
  recordingTime,
  videoUrl 
}) => {
  // Format recording time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-8 z-10">
      
      {/* Header */}
      <header className="flex flex-col items-center">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F5E6BF] to-[#D4AF37] font-serif drop-shadow-lg tracking-wider text-center leading-tight md:leading-snug">
          Happy Birthday
        </h1>
        {name && (
          <h2 className="text-2xl md:text-3xl font-bold text-[#D4AF37] font-serif mt-4 drop-shadow-lg">
            {name}
          </h2>
        )}
      </header>

      <div className="absolute left-5 top-1/2 hidden -translate-y-1/2 rounded-2xl border border-white/10 bg-black/45 p-4 text-xs text-white/55 backdrop-blur-md md:block">
        <p className="mb-3 tracking-[0.2em] text-[#D4AF37]">手势指南</p>
        <p>☝ 食指靠近：打开第一张回忆</p>
        <p className="mt-2">↔ 单食指滑动：下一段回忆</p>
        <p className="mt-2">✌ 右手比耶：自动环绕旋转蛋糕</p>
        <p className="mt-2">✊ 握拳：退出回忆浏览</p>
        <p className="mt-2">✋ 张手：粒子绽放</p>
        <p className="mt-2">✌✌ 双手比耶：打开生日信</p>
      </div>

      {/* Recording Status */}
      <div className="flex flex-col items-center space-y-4 pointer-events-auto">
        {isRecording ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-white font-serif text-lg">录制中</span>
              <span className="text-white font-serif text-lg">{formatTime(recordingTime)}</span>
            </div>
            <p className="text-gray-400 font-serif text-sm">双击结束录制</p>
          </div>
        ) : videoUrl ? (
          <div className="flex flex-col items-center space-y-3">
            <span className="text-white font-serif text-lg">录制完成！</span>
            <a
              href={videoUrl}
              download={`生日祝福-${name}.mp4`}
              className="px-8 py-3 bg-gradient-to-r from-[#D4AF37] to-[#F5E6BF] text-black font-serif text-lg font-bold hover:shadow-[0_0_30px_#D4AF37] transition-all duration-300"
            >
              下载视频
            </a>
            <p className="text-gray-400 font-serif text-sm">保存后可发送给好友</p>
          </div>
        ) : null}
      </div>

    </div>
  );
};
