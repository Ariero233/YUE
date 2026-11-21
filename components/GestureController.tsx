import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { TreeMode } from '../types';

interface GestureControllerProps {
  onModeChange: (mode: TreeMode) => void;
  currentMode: TreeMode;
  isGalleryOpen: boolean;
  onGalleryOpen: () => void;
  onGalleryClose: () => void;
  onMediaAdvance: () => void;
  onAutoRotateChange: (active: boolean) => void;
  onLetterOpen: () => void;
  onHandPosition?: (x: number, y: number, detected: boolean) => void;
}

type Landmark = { x: number; y: number; z: number };

interface HandAnalysis {
  landmarks: Landmark[];
  extended: [boolean, boolean, boolean, boolean];
  longFingerCount: number;
  thumbExtended: boolean;
  onlyIndex: boolean;
  openHand: boolean;
  fist: boolean;
  peace: boolean;
  handedness: 'Left' | 'Right' | 'Unknown';
  palmX: number;
  palmY: number;
  indexX: number;
  tipNearScreen: boolean;
}

const distance2D = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y);

const analyzeHand = (
  landmarks: Landmark[],
  handedness: 'Left' | 'Right' | 'Unknown',
): HandAnalysis => {
  const wrist = landmarks[0];
  const fingerPairs: Array<[number, number, number]> = [
    [8, 6, 5],
    [12, 10, 9],
    [16, 14, 13],
    [20, 18, 17],
  ];
  const fingerStates = fingerPairs.map(([tip, pip, base]) => {
    const tipDistance = distance2D(landmarks[tip], wrist);
    const jointDistance = distance2D(landmarks[pip], wrist);
    const baseDistance = distance2D(landmarks[base], wrist);
    return {
      strict: tipDistance > jointDistance * 1.13 && tipDistance > baseDistance * 1.42,
      relaxed: tipDistance > jointDistance * 1.06 && tipDistance > baseDistance * 1.24,
    };
  });
  const extended = fingerStates.map((state) => state.strict) as [boolean, boolean, boolean, boolean];

  const thumbExtended = distance2D(landmarks[4], landmarks[5]) > distance2D(landmarks[3], landmarks[5]) * 1.18;
  const [index, middle, ring, pinky] = extended;
  const strictFingerCount = extended.filter(Boolean).length;
  const longFingerCount = fingerStates.filter((state) => state.relaxed).length;
  const extendedCount = strictFingerCount + (thumbExtended ? 1 : 0);
  const onlyIndex = index && !middle && !ring && !pinky;
  const peace = index && middle && !ring && !pinky;
  // Three of the four long fingers are sufficient. The thumb is deliberately
  // optional because it is the least stable landmark in front-facing cameras.
  const openHand = longFingerCount >= 3 && !onlyIndex && !peace;
  const fist = extendedCount <= 1 && !onlyIndex;

  const palmX = (landmarks[0].x + landmarks[5].x + landmarks[9].x + landmarks[13].x + landmarks[17].x) / 5;
  const palmY = (landmarks[0].y + landmarks[5].y + landmarks[9].y + landmarks[13].y + landmarks[17].y) / 5;
  const xs = landmarks.map((point) => point.x);
  const ys = landmarks.map((point) => point.y);
  const handScale = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));

  return {
    landmarks,
    extended,
    longFingerCount,
    thumbExtended,
    onlyIndex,
    openHand,
    fist,
    peace,
    handedness,
    palmX,
    palmY,
    indexX: 1 - landmarks[8].x,
    tipNearScreen: handScale > 0.31 || landmarks[8].z < -0.085,
  };
};

export const GestureController: React.FC<GestureControllerProps> = ({
  onModeChange,
  currentMode,
  isGalleryOpen,
  onGalleryOpen,
  onGalleryClose,
  onMediaAdvance,
  onAutoRotateChange,
  onLetterOpen,
  onHandPosition,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [gestureStatus, setGestureStatus] = useState('正在初始化双手识别…');
  const [handPos, setHandPos] = useState<{ x: number; y: number } | null>(null);

  const modeRef = useRef(currentMode);
  const galleryOpenRef = useRef(isGalleryOpen);
  const callbacksRef = useRef({
    onModeChange,
    onGalleryOpen,
    onGalleryClose,
    onMediaAdvance,
    onAutoRotateChange,
    onLetterOpen,
    onHandPosition,
  });

  useEffect(() => {
    modeRef.current = currentMode;
  }, [currentMode]);

  useEffect(() => {
    galleryOpenRef.current = isGalleryOpen;
  }, [isGalleryOpen]);

  useEffect(() => {
    callbacksRef.current = {
      onModeChange,
      onGalleryOpen,
      onGalleryClose,
      onMediaAdvance,
      onAutoRotateChange,
      onLetterOpen,
      onHandPosition,
    };
  }, [onModeChange, onGalleryOpen, onGalleryClose, onMediaAdvance, onAutoRotateChange, onLetterOpen, onHandPosition]);

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId = 0;
    let cameraStream: MediaStream | null = null;
    let disposed = false;
    let letterTriggered = false;
    let lastMediaSwipeAt = 0;
    let autoRotateActive = false;

    const counters = {
      point: 0,
      fist: 0,
      open: 0,
      peace: 0,
    };
    const mediaSwipe = { x: 0, time: 0, active: false };

    const setStatus = (status: string) => {
      setGestureStatus((previous) => (previous === status ? previous : status));
    };

    const resetSwipeTracking = () => {
      mediaSwipe.active = false;
    };

    const setAutoRotate = (active: boolean) => {
      if (autoRotateActive === active) return;
      autoRotateActive = active;
      callbacksRef.current.onAutoRotateChange(active);
    };

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    };

    const drawHands = (hands: Landmark[][]) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas?.getContext('2d');
      if (!canvas || !video || !context) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.clearRect(0, 0, canvas.width, canvas.height);

      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [0, 9], [9, 10], [10, 11], [11, 12],
        [0, 13], [13, 14], [14, 15], [15, 16],
        [0, 17], [17, 18], [18, 19], [19, 20],
        [5, 9], [9, 13], [13, 17],
      ];

      hands.forEach((landmarks, handIndex) => {
        context.lineWidth = 3;
        context.strokeStyle = handIndex === 0 ? '#D4AF37' : '#E8A7B5';
        connections.forEach(([start, end]) => {
          context.beginPath();
          context.moveTo(landmarks[start].x * canvas.width, landmarks[start].y * canvas.height);
          context.lineTo(landmarks[end].x * canvas.width, landmarks[end].y * canvas.height);
          context.stroke();
        });

        landmarks.forEach((landmark, index) => {
          const highlighted = index === 8 || index === 12;
          context.beginPath();
          context.arc(landmark.x * canvas.width, landmark.y * canvas.height, highlighted ? 5 : 3, 0, Math.PI * 2);
          context.fillStyle = highlighted ? '#FFF3C4' : handIndex === 0 ? '#26a269' : '#c85a78';
          context.fill();
          context.strokeStyle = '#ffffff';
          context.lineWidth = 0.7;
          context.stroke();
        });
      });
    };

    const handleHands = (
      rawHands: Landmark[][],
      handednesses: Array<'Left' | 'Right' | 'Unknown'>,
    ) => {
      const hands = rawHands.map((landmarks, index) => (
        analyzeHand(landmarks, handednesses[index] ?? 'Unknown')
      ));
      const primary = hands[0];
      if (!primary) return;

      setHandPos({ x: primary.palmX, y: primary.palmY });
      callbacksRef.current.onHandPosition?.(primary.palmX, primary.palmY, true);
      const now = performance.now();

      // Highest-priority command: two simultaneous V signs open the letter page.
      if (hands.length >= 2 && hands[0].peace && hands[1].peace) {
        setAutoRotate(false);
        counters.peace += 1;
        counters.point = 0;
        counters.fist = 0;
        counters.open = 0;
        resetSwipeTracking();
        setStatus(`双手比耶 · 打开生日信 ${Math.min(counters.peace, 10)}/10`);
        if (counters.peace >= 10 && !letterTriggered) {
          letterTriggered = true;
          callbacksRef.current.onLetterOpen();
        }
        return;
      }

      counters.peace = 0;

      // A single right-hand V sign starts a steady automatic cake rotation.
      // Double V remains reserved for opening the birthday letter above.
      if (hands.length === 1 && primary.peace && primary.handedness === 'Right') {
        counters.point = 0;
        counters.fist = 0;
        counters.open = 0;
        resetSwipeTracking();
        if (galleryOpenRef.current) {
          setAutoRotate(false);
          setStatus('右手比耶已识别 · 请先握拳退出回忆');
        } else {
          setAutoRotate(true);
          setStatus('右手比耶 · 蛋糕正在自动环绕旋转');
        }
        return;
      }

      if (hands.some((hand) => hand.peace)) {
        setAutoRotate(false);
        counters.point = 0;
        resetSwipeTracking();
        setStatus(primary.handedness === 'Left'
          ? '已识别左手 V 手势 · 请改用右手旋转蛋糕'
          : '已识别 V 手势 · 右手单独比耶可旋转蛋糕');
        return;
      }

      setAutoRotate(false);

      // One index finger: approach to open, then either swipe direction advances once.
      if (primary.onlyIndex) {
        counters.fist = 0;
        counters.open = 0;
        counters.point = primary.tipNearScreen ? counters.point + 1 : Math.max(0, counters.point - 1);
        setStatus(
          galleryOpenRef.current
            ? '单食指浏览 · 左右划都显示下一项'
            : primary.tipNearScreen
              ? '食指已靠近 · 正在打开回忆'
              : '单食指 · 请靠近屏幕',
        );

        if (counters.point >= 6 && !galleryOpenRef.current) {
          galleryOpenRef.current = true;
          callbacksRef.current.onGalleryOpen();
          mediaSwipe.active = false;
          return;
        }

        if (!galleryOpenRef.current) {
          mediaSwipe.active = false;
          return;
        }

        if (!mediaSwipe.active) {
          mediaSwipe.x = primary.indexX;
          mediaSwipe.time = now;
          mediaSwipe.active = true;
        } else {
          const deltaX = primary.indexX - mediaSwipe.x;
          const elapsed = now - mediaSwipe.time;
          if (Math.abs(deltaX) > 0.12 && elapsed < 900 && now - lastMediaSwipeAt > 560) {
            callbacksRef.current.onMediaAdvance();
            lastMediaSwipeAt = now;
            mediaSwipe.x = primary.indexX;
            mediaSwipe.time = now;
          } else if (elapsed >= 900) {
            mediaSwipe.x = primary.indexX;
            mediaSwipe.time = now;
          }
        }
        return;
      }

      counters.point = 0;
      mediaSwipe.active = false;

      if (primary.fist) {
        counters.fist += 1;
        counters.open = 0;
        setStatus(galleryOpenRef.current ? '握拳 · 退出回忆浏览' : '握拳 · 蛋糕聚合');
        if (counters.fist >= 5) {
          if (galleryOpenRef.current) {
            galleryOpenRef.current = false;
            callbacksRef.current.onGalleryClose();
          }
          if (modeRef.current !== TreeMode.FORMED) {
            modeRef.current = TreeMode.FORMED;
            callbacksRef.current.onModeChange(TreeMode.FORMED);
          }
        }
      } else if (primary.openHand) {
        counters.open += 1;
        counters.fist = 0;
        setStatus(`张开手掌 · 已识别 ${primary.longFingerCount} 根手指 · 粒子绽放`);
        if (!galleryOpenRef.current && counters.open >= 3 && modeRef.current !== TreeMode.CHAOS) {
          modeRef.current = TreeMode.CHAOS;
          callbacksRef.current.onModeChange(TreeMode.CHAOS);
        }
      } else {
        counters.fist = 0;
        counters.open = Math.max(0, counters.open - 1);
        setStatus('手势已识别');
      }
    };

    const resetNoHands = () => {
      setStatus('等待手势…');
      setHandPos(null);
      callbacksRef.current.onHandPosition?.(0.5, 0.5, false);
      counters.point = 0;
      counters.fist = 0;
      counters.open = 0;
      counters.peace = 0;
      setAutoRotate(false);
      resetSwipeTracking();
      clearCanvas();
    };

    const predictWebcam = () => {
      if (disposed || !handLandmarker || !videoRef.current) return;
      if (videoRef.current.videoWidth > 0) {
        const result = handLandmarker.detectForVideo(videoRef.current, performance.now());
        if (result.landmarks?.length) {
          const rawHands = result.landmarks.slice(0, 2) as Landmark[][];
          const handednesses = result.handednesses.slice(0, 2).map((categories) => {
            const categoryName = categories[0]?.categoryName;
            return categoryName === 'Left' || categoryName === 'Right' ? categoryName : 'Unknown';
          });
          drawHands(rawHands);
          handleHands(rawHands, handednesses);
        } else {
          resetNoHands();
        }
      }
      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    const setup = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm',
        );
        if (disposed) return;
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `${import.meta.env.BASE_URL}models/hand_landmarker.task`,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
        });

        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 360, facingMode: 'user' },
        });
        if (disposed || !videoRef.current) return;
        videoRef.current.srcObject = cameraStream;
        videoRef.current.onloadeddata = () => {
          if (disposed) return;
          setIsLoaded(true);
          setStatus('等待手势…');
          predictWebcam();
        };
      } catch (error) {
        console.error('手势识别初始化失败:', error);
        setStatus('摄像头或手势识别不可用');
      }
    };

    void setup();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrameId);
      cameraStream?.getTracks().forEach((track) => track.stop());
      handLandmarker?.close();
    };
  }, []);

  return (
    <div className="pointer-events-none absolute bottom-5 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      <div className="max-w-[92vw] rounded-full border border-[#D4AF37]/35 bg-black/65 px-4 py-1.5 text-center text-[11px] tracking-[0.12em] text-[#F5E6BF] backdrop-blur-md">
        {gestureStatus}
      </div>

      <div className="relative h-[108px] w-[192px] overflow-hidden rounded-2xl border border-[#D4AF37]/70 bg-black shadow-[0_0_28px_rgba(212,175,55,.22)] md:h-[135px] md:w-[240px]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full -scale-x-100 object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        <canvas ref={canvasRef} className="absolute inset-0 z-20 h-full w-full -scale-x-100 object-cover" />
        <div className="absolute inset-2 z-30 rounded-xl border border-white/10" />
        {handPos && (
          <div
            className="absolute z-30 h-2.5 w-2.5 rounded-full border border-white bg-[#D4AF37] shadow-[0_0_12px_#D4AF37]"
            style={{
              left: `${(1 - handPos.x) * 100}%`,
              top: `${handPos.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
      </div>
    </div>
  );
};
