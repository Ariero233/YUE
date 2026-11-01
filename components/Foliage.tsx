import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMode } from '../types';

interface FoliageProps {
  mode: TreeMode;
  count: number;
}

const vertexShader = `
  uniform float uTime;
  uniform float uProgress;
  
  attribute vec3 aChaosPos;
  attribute vec3 aTargetPos;
  attribute float aRandom;
  
  varying vec3 vColor;
  varying float vAlpha;

  // Cubic Ease In Out
  float cubicInOut(float t) {
    return t < 0.5
      ? 4.0 * t * t * t
      : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    // Add some individual variation to the progress so they don't all move at once
    float localProgress = clamp(uProgress * 1.2 - aRandom * 0.2, 0.0, 1.0);
    float easedProgress = cubicInOut(localProgress);

    // Interpolate position
    vec3 newPos = mix(aChaosPos, aTargetPos, easedProgress);
    
    // Add a slight "breathing" wind effect when formed
    if (easedProgress > 0.9) {
      newPos.x += sin(uTime * 2.0 + newPos.y) * 0.05;
      newPos.z += cos(uTime * 1.5 + newPos.y) * 0.05;
    }

    vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    
    // Size attenuation
    gl_PointSize = (4.0 * aRandom + 2.0) * (20.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    // Color logic: Realistic cake colors (vanilla, cream, frosting)
    vec3 goldColor = vec3(1.0, 0.84, 0.0);
    
    // Realistic cake colors - vanilla cake, cream frosting
    vec3 vanillaCake = vec3(0.98, 0.95, 0.88); // Light vanilla cake color
    vec3 creamFrosting = vec3(1.0, 0.98, 0.94); // Cream frosting
    vec3 pinkFrosting = vec3(1.0, 0.92, 0.95); // Light pink frosting
    vec3 whiteFrosting = vec3(1.0, 1.0, 1.0); // Pure white frosting
    
    // Layer-based color variation (different layers can have slightly different colors)
    float layerColor = mod(newPos.y / 2.8, 1.0);
    vec3 baseCakeColor = mix(vanillaCake, creamFrosting, layerColor * 0.3);
    
    // Add frosting color variation
    vec3 frostingColor = mix(whiteFrosting, pinkFrosting, aRandom * 0.4);
    vec3 finalCakeColor = mix(baseCakeColor, frostingColor, aRandom * 0.2);
    
    // Sparkle effect (sugar sparkle on frosting)
    float sparkle = sin(uTime * 5.0 + aRandom * 100.0);
    vColor = mix(goldColor, finalCakeColor, easedProgress);
    
    // Add sparkle to simulate sugar crystals
    if (sparkle > 0.92) {
      vColor += vec3(0.2);
    }

    vAlpha = 1.0;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Circular particle
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;

    // Soft edge
    float glow = 1.0 - (r * 2.0);
    glow = pow(glow, 1.5);

    gl_FragColor = vec4(vColor, vAlpha * glow);
  }
`;

export const Foliage: React.FC<FoliageProps> = ({ mode, count }) => {
  const meshRef = useRef<THREE.Points>(null);
  
  // Target progress reference for smooth JS-side dampening logic for the uniform
  const progressRef = useRef(0);

  const { chaosPositions, targetPositions, randoms } = useMemo(() => {
    const chaos = new Float32Array(count * 3);
    const target = new Float32Array(count * 3);
    const rnd = new Float32Array(count);

    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const height = 8; // Cake height
    const maxRadius = 5; // Max cake radius
    const layerCount = 3; // Number of cake layers

    for (let i = 0; i < count; i++) {
      // 1. Chaos Positions: Random sphere
      const r = 25 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      chaos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      chaos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 5; // Lift up slightly
      chaos[i * 3 + 2] = r * Math.cos(phi);

      // 2. Target Positions: Multi-layer Cake (solid cylindrical layers)
      // Normalized height 0 to 1 with non-linear distribution for denser bottom layers
      // Use exponential distribution to concentrate more particles at the bottom
      const linearY = i / count;
      const yNorm = 1 - Math.pow(1 - linearY, 2); // Squared distribution for denser bottom
      
      // Determine which layer this particle belongs to
      const layerIndex = Math.floor(yNorm * layerCount);
      const layerProgress = (yNorm * layerCount) % 1;
      
      // Layer heights and radii (each layer is a solid cylinder)
      const layerHeights = [0, 2.8, 5.6]; // Bottom, middle, top layer base heights
      const layerRadii = [maxRadius, maxRadius * 0.75, maxRadius * 0.5]; // Decreasing radii
      const layerThickness = [2.8, 2.8, 2.4]; // Thickness of each layer
      
      const currentLayer = Math.min(layerIndex, layerCount - 1);
      const y = layerHeights[currentLayer] + layerProgress * layerThickness[currentLayer];
      const currentRadius = layerRadii[currentLayer];
      
      // Create solid cylindrical distribution (not just surface)
      // Use random radius within the layer to fill the cylinder
      // Add a slight bias to keep more particles closer to the surface for better visual density
      const radiusBias = 0.8; // 0 = center, 1 = surface
      const radiusVariation = currentRadius * Math.pow(Math.random(), radiusBias);
      const angle = 2 * Math.PI * goldenRatio * i * 1.2; // Adjust angle multiplier for better distribution

      target[i * 3] = Math.cos(angle) * radiusVariation;
      target[i * 3 + 1] = y;
      target[i * 3 + 2] = Math.sin(angle) * radiusVariation;

      // 3. Randoms
      rnd[i] = Math.random();
    }

    return {
      chaosPositions: chaos,
      targetPositions: target,
      randoms: rnd
    };
  }, [count]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
  }), []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      // Update time
      material.uniforms.uTime.value = state.clock.elapsedTime;
      
      // Smoothly interpolate the progress uniform
      const target = mode === TreeMode.FORMED ? 1 : 0;
      // Log the transition progress
      console.log('Foliage: Mode is', mode, 'Target progress:', target, 'Current progress:', progressRef.current.toFixed(4));
      // Faster transition speed for both directions (increased from 1.5 to 3.0)
      progressRef.current = THREE.MathUtils.lerp(progressRef.current, target, delta * 3.0);
      material.uniforms.uProgress.value = progressRef.current;
      console.log('Foliage: Updated progress uniform to', material.uniforms.uProgress.value.toFixed(4));
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position" // Required by three.js, though we override in shader
          count={count}
          array={chaosPositions} // Initial state
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aChaosPos"
          count={count}
          array={chaosPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTargetPos"
          count={count}
          array={targetPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={count}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      {/* @ts-ignore */}
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};