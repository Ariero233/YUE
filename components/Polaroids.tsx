
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { MediaItem, TreeMode } from '../types';

interface PolaroidsProps {
  mode: TreeMode;
  mediaItems: MediaItem[];
}

interface PhotoData {
  id: number;
  item: MediaItem;
  chaosPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  speed: number;
}

const PolaroidItem: React.FC<{ data: PhotoData; mode: TreeMode; index: number }> = ({ data, mode, index }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [error, setError] = useState(false);
  const animationProgressRef = useRef(0);
  const lastModeRef = useRef(mode);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let disposed = false;
    let video: HTMLVideoElement | null = null;
    let createdTexture: THREE.Texture | null = null;

    if (data.item.type === 'video') {
      video = document.createElement('video');
      video.src = data.item.url;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      const videoTexture = new THREE.VideoTexture(video);
      videoTexture.colorSpace = THREE.SRGBColorSpace;
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      createdTexture = videoTexture;
      setTexture(videoTexture);
      setError(false);
      void video.play().catch(() => undefined);

      return () => {
        disposed = true;
        video?.pause();
        if (video) {
          video.removeAttribute('src');
          video.load();
        }
        createdTexture?.dispose();
      };
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      data.item.url,
      (loadedTex) => {
        if (disposed) {
          loadedTex.dispose();
          return;
        }
        loadedTex.colorSpace = THREE.SRGBColorSpace;
        createdTexture = loadedTex;
        setTexture(loadedTex);
        setError(false);
      },
      undefined,
      (err) => {
        console.warn(`Failed to load media: ${data.item.url}`, err);
        setError(true);
      }
    );

    return () => {
      disposed = true;
      createdTexture?.dispose();
    };
  }, [data.item.type, data.item.url]);
  
  // Random sway offset
  const swayOffset = useMemo(() => Math.random() * 100, []);
  
  // Reset animation when mode changes
  useEffect(() => {
    if (lastModeRef.current === TreeMode.FORMED && mode === TreeMode.CHAOS) {
      // Start new animation when entering chaos mode
      animationProgressRef.current = 0;
      startTimeRef.current = null; // Will be set in useFrame when animation starts
      
      if (groupRef.current) {
        // 1. Immediately position at left start position when entering chaos mode
        const leftStartPos = new THREE.Vector3(
          -15 + Math.random() * 5, // Start from far left (x=-15 to x=-10)
          data.targetPos.y + (Math.random() - 0.5) * 2, // Slight vertical variation
          data.targetPos.z + Math.random() * 3 // Slight forward/backward variation
        );
        // Set position immediately without transition
        groupRef.current.position.copy(leftStartPos);
        
        // 2. Immediately face camera when entering chaos mode
        const cameraPos = new THREE.Vector3(0, 9, 20);
        const dummy = new THREE.Object3D();
        dummy.position.copy(groupRef.current.position);
        dummy.lookAt(cameraPos);
        // Set rotation immediately without transition
        groupRef.current.quaternion.copy(dummy.quaternion);
      }
    }
    lastModeRef.current = mode;
  }, [mode, data.targetPos]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const isFormed = mode === TreeMode.FORMED;
    const time = state.clock.elapsedTime;
    
    if (isFormed) {
      // Return to tree position
      const targetPos = data.targetPos;
      const step = delta * data.speed;
      groupRef.current.position.lerp(targetPos, step);
    } else {
      // Chaos mode - photos move quickly to camera front with priority
      
      // Initialize start time if not set
      if (startTimeRef.current === null) {
        startTimeRef.current = time;
        // Ensure we're already at left start position when animation begins
        const leftStartPos = new THREE.Vector3(
          -15 + Math.random() * 5, // Start from far left (x=-15 to x=-10)
          data.targetPos.y + (Math.random() - 0.5) * 2, // Slight vertical variation
          data.targetPos.z + Math.random() * 3 // Slight forward/backward variation
        );
        groupRef.current.position.copy(leftStartPos);
      }
      
      // Calculate animation progress with stagger for smoother movement
      const slideDuration = 2.0; // Increased duration for smoother animation
      const stagger = index * 0.1; // Increased stagger for more natural sequence
      const elapsed = time - startTimeRef.current;
      
      // Calculate progress with cubic ease out for smoother overall movement
      let progress = Math.max(0, Math.min(1, (elapsed - stagger) / slideDuration));
      progress = 1 - Math.pow(1 - progress, 3); // Cubic for smoother acceleration and deceleration
      
      // Create a smooth path from start to chaos position
      const startPos = data.targetPos;
      const endPos = data.chaosPos;
      
      // Start from the tree position (formed state) and move to chaos position
      const currentPos = new THREE.Vector3(
        startPos.x + (endPos.x - startPos.x) * progress,
        startPos.y + (endPos.y - startPos.y) * progress,
        startPos.z + (endPos.z - startPos.z) * progress
      );
      
      // Add a subtle arc to the path for more natural movement
      const arcOffset = Math.sin(progress * Math.PI) * 1.5;
      currentPos.y += arcOffset;
      
      // Set the position
      groupRef.current.position.copy(currentPos);
    }
    
    // 2. Rotation & Sway Logic
    if (isFormed) {
        // Look at center but face outward
        const dummy = new THREE.Object3D();
        dummy.position.copy(groupRef.current.position);
        dummy.lookAt(0, groupRef.current.position.y, 0); 
        dummy.rotateY(Math.PI); // Flip to face out
        
        // Base rotation alignment
        const step = delta * data.speed;
        groupRef.current.quaternion.slerp(dummy.quaternion, step);
        
        // Physical Swaying (Wind)
        // Z-axis rotation for side-to-side swing
        const swayAngle = Math.sin(time * 2.0 + swayOffset) * 0.08;
        // X-axis rotation for slight front-back tilt
        const tiltAngle = Math.cos(time * 1.5 + swayOffset) * 0.05;
        
        groupRef.current.rotateZ(swayAngle * delta * 5); // Apply over time or directly? 
        // For stable sway, we add to the base rotation calculated above.
        // But since we slerp quaternion, let's just add manual rotation after slerp?
        // Easier: Set rotation directly based on dummy + sway.
        
        // Calculate the "perfect" rotation
        const currentRot = new THREE.Euler().setFromQuaternion(groupRef.current.quaternion);
        groupRef.current.rotation.z = currentRot.z + swayAngle * 0.05; 
        groupRef.current.rotation.x = currentRot.x + tiltAngle * 0.05;
        
    } else {
        // Chaos mode - smoothly face camera directly
      // Camera position relative to scene group: [0, 9, 20]
      const cameraPos = new THREE.Vector3(0, 9, 20);
      const dummy = new THREE.Object3D();
      dummy.position.copy(groupRef.current.position);
      
      // Make photos face the camera exactly at all times
      dummy.lookAt(cameraPos);
      
      // Smoothly interpolate rotation
      const step = delta * 6.0; // Reasonable rotation speed for smooth transition
      groupRef.current.quaternion.slerp(dummy.quaternion, step);
        
        // Add gentle floating wobble without affecting camera facing
        const wobbleX = Math.sin(time * 0.8 + swayOffset) * 0.02; // Slower and smaller wobble
        const wobbleZ = Math.cos(time * 0.6 + swayOffset) * 0.02;
        
        // Apply wobble while maintaining camera facing
        groupRef.current.rotation.x += wobbleX;
        groupRef.current.rotation.z += wobbleZ;
      }
  });

  return (
    <group ref={groupRef}>
      
      {/* The Hanging String (Visual only) - fades out at top */}
      <mesh position={[0, 1.2, -0.1]}>
        <cylinderGeometry args={[0.005, 0.005, 1.5]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.3} roughness={0.7} transparent opacity={0.6} />
      </mesh>

      {/* Frame Group (Offset slightly so string connects to top center) */}
      <group position={[0, 0, 0]}>
        
        {/* White Paper Backing */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.2, 1.5, 0.02]} />
          <meshStandardMaterial color="#fdfdfd" roughness={0.8} />
        </mesh>

        {/* The Photo Area */}
        <mesh position={[0, 0.15, 0.025]}>
          <planeGeometry args={[1.0, 1.0]} />
          {texture && !error ? (
            <meshBasicMaterial map={texture} />
          ) : (
            // Fallback Material (Red for error, Grey for loading)
            <meshStandardMaterial color={error ? "#550000" : "#cccccc"} />
          )}
        </mesh>
        
        {/* "Tape" or Gold Clip */}
        <mesh position={[0, 0.7, 0.025]} rotation={[0,0,0]}>
           <boxGeometry args={[0.1, 0.05, 0.05]} />
           <meshStandardMaterial color="#D4AF37" metalness={0.3} roughness={0.7} />
        </mesh>

        {/* Text Label */}
        <Text
          position={[0, -0.55, 0.03]}
          fontSize={0.12}
          color="#333"
          anchorX="center"
          anchorY="middle"
        >
          {error ? "Media unavailable" : data.item.type === 'video' ? "Silent Memory" : "Happy Birthday"}
        </Text>
      </group>
    </group>
  );
};

export const Polaroids: React.FC<PolaroidsProps> = ({ mode, mediaItems }) => {
  const photoData = useMemo(() => {
    if (mediaItems.length === 0) {
      return [];
    }

    const data: PhotoData[] = [];
    const height = 8; // Cake height
    const maxRadius = 5.0;
    const layerCount = 3;
    
    const count = mediaItems.length;

    for (let i = 0; i < count; i++) {
      // 1. Target Position
      // Distributed nicely on the cake layers
      const yNorm = 0.1 + (i / count) * 0.7; // Keep between 10% and 80% height
      const layerIndex = Math.floor(yNorm * layerCount);
      const layerProgress = (yNorm * layerCount) % 1;
      
      // Layer heights and radii (matching Foliage)
      const layerHeights = [0, 2.5, 5.5];
      const layerRadii = [maxRadius, maxRadius * 0.75, maxRadius * 0.5];
      const layerThickness = [2.5, 2.5, 2.0];
      
      const currentLayer = Math.min(layerIndex, layerCount - 1);
      const y = layerHeights[currentLayer] + layerProgress * layerThickness[currentLayer];
      const currentRadius = layerRadii[currentLayer];
      
      // Distribute photos on the layer's edge
      const theta = i * 2.39996; // Golden angle in radians
      const r = currentRadius + 0.8; // Slightly outside the layer
      
      const targetPos = new THREE.Vector3(
        r * Math.cos(theta),
        y,
        r * Math.sin(theta)
      );

      // 2. Chaos Position - Ensure rightward movement from left side
      // Camera is at [0, 4, 20], Scene group offset is [0, -5, 0]
      // So relative to scene, camera is at y=9
      const relativeY = 9; // Position around camera height for better visibility
      const relativeZ = 20; // Camera Z
      
      // Create positions that move from left to right in camera view
      const positionIndex = (i / count);
      const xPosition = -5 + positionIndex * 10; // Start from x=-5, move to x=5 (left to right)
      const heightSpread = (Math.random() - 0.5) * 6; // Height variation -3 to +3
      const zVariation = (Math.random() - 0.5) * 2; // Small Z variation for depth
      
      const chaosPos = new THREE.Vector3(
        xPosition, // Left to right movement path
        relativeY + heightSpread, // Vertical variation
        relativeZ - 6 + zVariation // Close to camera with slight depth variation
      );

      data.push({
        id: i,
        item: mediaItems[i],
        chaosPos,
        targetPos,
        speed: 2.0 + Math.random() * 1.5 // Slower, smoother speed for more natural movement (2.0-3.5)
      });
    }
    return data;
  }, [mediaItems]);

  return (
    <group>
      {photoData.map((data, i) => (
        <PolaroidItem key={data.item.id} index={i} data={data} mode={mode} />
      ))}
    </group>
  );
};
