
import React, { useRef, useEffect } from 'react';
import { Environment, OrbitControls, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useFrame, useThree } from '@react-three/fiber';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { Polaroids } from './Polaroids';
import { TreeStar } from './TreeStar';
import { MediaItem, TreeMode } from '../types';

interface ExperienceProps {
  mode: TreeMode;
  handPosition: { x: number; y: number; detected: boolean };
  mediaItems: MediaItem[];
  autoRotate: boolean;
  galleryOpen: boolean;
  age: number;
  name: string;
  audioElement?: HTMLAudioElement | null;
}

export const Experience: React.FC<ExperienceProps> = ({
  mode,
  mediaItems,
  autoRotate,
  galleryOpen,
  age,
  audioElement,
}) => {
  const controlsRef = useRef<any>(null);
  const treeGroupRef = useRef<any>(null);
  const { camera } = useThree();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset camera to default front view on mount
  useEffect(() => {
    // Use a small timeout to ensure OrbitControls is initialized
    const timer = setTimeout(() => {
      // Set camera to default front view position
      camera.position.set(0, 2, 15);
      camera.lookAt(0, -3, 0); // Look at cake center
      camera.updateMatrixWorld();
      
      // Reset OrbitControls to default state
      if (controlsRef.current) {
        controlsRef.current.target.set(0, -3, 0); // Target cake center
        controlsRef.current.reset();
        controlsRef.current.update();
      }
      
      // Try to enter fullscreen after scene is fully rendered
      const enterFullscreen = async () => {
        const element = document.documentElement;
        console.log('Experience component entering fullscreen...');
        try {
          if (element.requestFullscreen) {
            await element.requestFullscreen();
            console.log('Standard requestFullscreen succeeded in Experience');
          } else if ((element as any).webkitRequestFullscreen) {
            await (element as any).webkitRequestFullscreen();
            console.log('webkitRequestFullscreen succeeded in Experience');
          } else if ((element as any).mozRequestFullScreen) {
            await (element as any).mozRequestFullScreen();
            console.log('mozRequestFullScreen succeeded in Experience');
          } else if ((element as any).msRequestFullscreen) {
            await (element as any).msRequestFullscreen();
            console.log('msRequestFullscreen succeeded in Experience');
          }
        } catch (error) {
          console.error('Error entering fullscreen in Experience:', error);
          // Continue without fullscreen
        }
      };
      
      enterFullscreen();
    }, 200);

    return () => clearTimeout(timer);
  }, []); // Only run once on mount

  // Holding a right-hand V sign rotates the complete cake at a calm,
  // presentation-friendly speed. Releasing the gesture pauses it immediately.
  useFrame((_, delta) => {
    if (autoRotate && treeGroupRef.current && !galleryOpen) {
      treeGroupRef.current.rotation.y += delta * 0.34;
    }
  });

  // Audio setup and playback control
  useEffect(() => {
    // Use the audio element from props if available (created in StartMenu)
    if (audioElement) {
      console.log('Using audio element from StartMenu:', audioElement);
      audioRef.current = audioElement;
      // Ensure volume is set correctly
      audioRef.current.volume = 0.5;
    } else {
      // Create a new audio element only if none was provided
      console.log('Creating new audio element since none was provided');
      // Use public directory path for audio file
      audioRef.current = new Audio(`${import.meta.env.BASE_URL}audio/background-music.mp3`);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
      
      // Try to play immediately (in case props audioElement is not available)
      try {
        audioRef.current.play()
          .then(() => console.log('Music started playing from Experience'))
          .catch(error => console.error('Error playing audio from Experience:', error));
      } catch (error) {
        console.error('Error playing audio from Experience:', error);
      }
    }

    return () => {
      // Cleanup only if we created the audio element ourselves
      if (audioRef.current && !audioElement) {
        console.log('Cleaning up audio element');
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioElement]);

  // Play music when mode changes to FORMED (after clicking "开始庆祝")
  useEffect(() => {
    console.log('Experience: Mode changed to:', mode);
    if (mode === TreeMode.FORMED) {
      console.log('Experience: Mode is now FORMED, attempting to play music...');
      console.log('Experience: Audio element from props:', audioElement);
      console.log('Experience: Audio ref current:', audioRef.current);
      
      // Try to play audio using either the prop or the ref
      const audioToPlay = audioRef.current || audioElement;
      
      if (audioToPlay) {
        console.log('Experience: Playing music from', audioToPlay === audioElement ? 'props' : 'ref');
        console.log('Experience: Audio readyState:', audioToPlay.readyState);
        console.log('Experience: Audio currentTime:', audioToPlay.currentTime);
        
        // Ensure audio is ready and play immediately
        audioToPlay.play()
          .then(() => {
            console.log('Experience: Music started playing successfully when mode changed to FORMED');
          })
          .catch(error => {
            console.error('Experience: Error playing background music:', error);
            // Simple fallback: try again once with a small delay
            setTimeout(() => {
              if (audioToPlay) {
                audioToPlay.play().catch(fallbackError => {
                  console.error('Experience: Fallback audio play also failed:', fallbackError);
                });
              }
            }, 100);
          });
      } else {
        // Fallback if no audio element exists yet
        console.log('Experience: Creating new audio element when mode changes to FORMED');
        audioRef.current = new Audio(`${import.meta.env.BASE_URL}audio/background-music.mp3`);
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;
        
        audioRef.current.play()
          .then(() => {
            console.log('Experience: Fallback audio started playing when mode changed to FORMED');
          })
          .catch(error => {
            console.error('Experience: Error playing fallback audio:', error);
          });
      }
      
      // Log that animation should be starting now
      console.log('Experience: Animation should start now - mode is FORMED');
    }
  }, [mode]);

  return (
    <>
      {/* Audio element is controlled via React refs */}
      <OrbitControls 
        ref={controlsRef}
        target={[0, 0, 0]}
        enablePan={false} 
        minPolarAngle={Math.PI / 6} 
        maxPolarAngle={Math.PI / 1.5}
        minDistance={8}
        maxDistance={25}
        enableDamping
        dampingFactor={0.05}
        enabled={!galleryOpen}
      />

      {/* Lighting Setup for Birthday Cake - Adjusted brightness */}
      <Environment preset="lobby" background={false} blur={0.8} />
      
      <ambientLight intensity={0.27} color="#ffffff" />
      <spotLight 
        position={[0, -12, 0]} 
        angle={0.5} 
        penumbra={1} 
        intensity={2.7} 
        color="#fff5cc" 
        castShadow 
      />
      <pointLight position={[0, -3, 0]} intensity={1.8} color="#ffaa00" />
      <pointLight position={[-10, 5, -10]} intensity={0.9} color="#D4AF37" />

      <group position={[0, -6, 0]} ref={treeGroupRef}>
        <Ornaments mode={mode} count={600} />
        <Foliage mode={mode} count={5000} />
        <Polaroids mode={mode} mediaItems={mediaItems} />
        <TreeStar mode={mode} age={age} />
        
        {/* Floor Reflections */}
        <ContactShadows 
          opacity={0.5} 
          scale={30} 
          blur={2} 
          far={4.5} 
          color="#000000" 
        />
      </group>

      <EffectComposer enableNormalPass={false}>
        <Bloom luminanceThreshold={0.8} mipmapBlur intensity={1.5} radius={0.6} />
        <Vignette eskil={false} offset={0.1} darkness={0.7} />
        <Noise opacity={0.02} blendFunction={BlendFunction.OVERLAY} />
      </EffectComposer>
    </>
  );
};
