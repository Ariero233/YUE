import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { TreeMode } from '../types';

interface TreeStarProps {
  mode: TreeMode;
  age: number;
}

// Single Candle Component
const Candle: React.FC<{
  digit: string;
  index: number;
  totalDigits: number;
  mode: TreeMode;
}> = ({ digit, index, totalDigits, mode }) => {
  const candleRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const particleSystemRef = useRef<THREE.Points>(null);
  const particlesDataRef = useRef<any[]>([]);

  // Calculate position - spread candles horizontally
  // Numbers are wider, so we need more spacing
  const spacing = 0.8; // Space between candles (increased for number shapes)
  const totalWidth = (totalDigits - 1) * spacing;
  const startX = -totalWidth / 2;
  const x = startX + index * spacing;

  // Flame geometry - use multiple cone segments for realistic shape
  const createFlameGeometry = () => {
    const flameGroup = new THREE.Group();
    
    // Create main flame cone
    const mainFlameGeometry = new THREE.ConeGeometry(0.12, 0.4, 8);
    mainFlameGeometry.rotateX(Math.PI / 2);
    mainFlameGeometry.translate(0, 0.2, 0);
    
    // Create inner flame cone
    const innerFlameGeometry = new THREE.ConeGeometry(0.06, 0.35, 6);
    innerFlameGeometry.rotateX(Math.PI / 2);
    innerFlameGeometry.translate(0, 0.25, 0);
    
    // Create top flame tip
    const tipGeometry = new THREE.ConeGeometry(0.03, 0.2, 4);
    tipGeometry.rotateX(Math.PI / 2);
    tipGeometry.translate(0, 0.3, 0);
    
    return { mainFlameGeometry, innerFlameGeometry, tipGeometry };
  };

  useFrame((state, delta) => {
    if (!candleRef.current) return;

    const isFormed = mode === TreeMode.FORMED;
    const time = state.clock.elapsedTime;

    // Update candle material to have candle-like properties (white/cream wax)
    candleRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (material && material.isMeshStandardMaterial) {
          // Main candle body - white/cream candle wax
          material.color.set("#ffffff"); // White candle color
          material.roughness = 0.5;
          material.metalness = 0.0; // No metalness for wax
          material.emissive.set("#fff8e0");
          material.emissiveIntensity = 0.1;
          material.transparent = true;
          material.opacity = 0.98;
        }
      }
    });

    const candleHeight = 1.5;

    // Ultra realistic flame animation
    if (flameRef.current && isFormed) {
      // Very complex flickering with multiple frequencies and randomness
      const randomOffset = index * 0.3;
      const timeWithOffset = time + randomOffset;
      
      // Add some true randomness using noise-like functions
      const randomX = (Math.sin(timeWithOffset * 2.3) * Math.cos(timeWithOffset * 3.7)) * 0.02;
      const randomY = (Math.sin(timeWithOffset * 1.9) * Math.cos(timeWithOffset * 4.1)) * 0.015;
      const randomZ = (Math.sin(timeWithOffset * 2.7) * Math.cos(timeWithOffset * 3.3)) * 0.015;
      
      // More chaotic movement with true randomness
      const flickerX = (
        Math.sin(timeWithOffset * 8.3) * 0.03 +
        Math.sin(timeWithOffset * 12.7) * 0.012 +
        Math.sin(timeWithOffset * 21.4) * 0.008 +
        randomX
      );
      
      const flickerY = (
        Math.sin(timeWithOffset * 6.1) * 0.025 +
        Math.sin(timeWithOffset * 9.8) * 0.015 +
        Math.sin(timeWithOffset * 17.3) * 0.007 +
        randomY
      );
      
      const flickerZ = (
        Math.sin(timeWithOffset * 7.2) * 0.02 +
        Math.sin(timeWithOffset * 14.8) * 0.009 +
        randomZ
      );
      
      // Very irregular scaling (more natural flame shape) with true randomness
      const scaleRandom = Math.sin(timeWithOffset * 3.5) * 0.1;
      const scaleX = 1 + (
        Math.sin(timeWithOffset * 11.2) * 0.15 +
        Math.sin(timeWithOffset * 15.3) * 0.06 +
        Math.sin(timeWithOffset * 23.7) * 0.03 +
        scaleRandom * 0.5
      );
      
      const scaleY = 1 + (
        Math.sin(timeWithOffset * 8.7) * 0.12 +
        Math.sin(timeWithOffset * 13.4) * 0.08 +
        Math.sin(timeWithOffset * 20.1) * 0.04 - // Slightly different pattern for Y scale
        scaleRandom * 0.3
      );
      
      const scaleZ = 1 + (
        Math.sin(timeWithOffset * 9.5) * 0.15 +
        Math.sin(timeWithOffset * 14.2) * 0.06 +
        Math.sin(timeWithOffset * 22.5) * 0.03 +
        scaleRandom * 0.5
      );
      
      // Apply transformations
      flameRef.current.position.x = flickerX;
      flameRef.current.position.y = candleHeight + 0.7 + flickerY;
      flameRef.current.position.z = flickerZ;
      flameRef.current.scale.set(scaleX, scaleY, scaleZ);
      
      // More chaotic rotation in all axes with additional randomness
      flameRef.current.rotation.x = (
        Math.sin(timeWithOffset * 5.1) * 0.12 +
        Math.sin(timeWithOffset * 10.3) * 0.05
      );
      
      flameRef.current.rotation.y = (
        Math.sin(timeWithOffset * 6.3) * 0.1 +
        Math.sin(timeWithOffset * 12.4) * 0.04
      );
      
      flameRef.current.rotation.z = (
        Math.sin(timeWithOffset * 7.4) * 0.15 +
        Math.sin(timeWithOffset * 13.7) * 0.06
      );
    }

    // Particle system animation for sparks
    if (particleSystemRef.current && isFormed) {
      const geometry = particleSystemRef.current.geometry as THREE.BufferGeometry;
      const positions = geometry.attributes.position.array as Float32Array;
      const sizes = geometry.attributes.size.array as Float32Array;
      
      // Initialize particles if needed
      if (particlesDataRef.current.length === 0) {
        particlesDataRef.current = [];
        for (let i = 0; i < 20; i++) {
          particlesDataRef.current.push({
            life: Math.random() * 1,
            lifeSpan: Math.random() * 1.0 + 0.3,
            position: new THREE.Vector3(0, 0, 0),
            velocity: new THREE.Vector3(
              (Math.random() - 0.5) * 0.4,
              Math.random() * 0.7 + 0.3,
              (Math.random() - 0.5) * 0.4
            ),
            size: Math.random() * 0.02 + 0.005,
            type: Math.random() < 0.3 ? 'spark' : 'ember', // Two types of particles
            color: Math.random() < 0.5 ? '#ffaa00' : '#ff6600'
          });
        }
      }
      
      // Update particles
      for (let i = 0; i < 20; i++) {
        const particle = particlesDataRef.current[i];
        particle.life -= delta;
        
        if (particle.life <= 0) {
          // Reset particle with more variation
          particle.life = particle.lifeSpan;
          particle.position.set(
            (Math.random() - 0.5) * 0.15,
            0.15 + Math.random() * 0.15,
            (Math.random() - 0.5) * 0.15
          );
          particle.velocity.set(
            (Math.random() - 0.5) * 0.5,
            Math.random() * 0.8 + 0.4,
            (Math.random() - 0.5) * 0.5
          );
          particle.size = Math.random() * 0.03 + 0.01;
          particle.type = Math.random() < 0.3 ? 'spark' : 'ember';
          particle.color = Math.random() < 0.5 ? '#ffaa00' : '#ff6600';
        }
        
        // Update position with turbulence
        const turbulenceX = Math.sin(time * 5.0 + i) * 0.01;
        const turbulenceY = Math.cos(time * 4.0 + i) * 0.01;
        const turbulenceZ = Math.sin(time * 6.0 + i) * 0.01;
        
        const turbulence = new THREE.Vector3(turbulenceX, turbulenceY, turbulenceZ);
        particle.position.add(particle.velocity.clone().multiplyScalar(delta));
        particle.position.add(turbulence.multiplyScalar(delta * 5));
        
        // Different gravity for different particle types
        if (particle.type === 'spark') {
          particle.velocity.y -= 0.1 * delta; // Less gravity for sparks
        } else {
          particle.velocity.y -= 0.3 * delta; // More gravity for embers
        }
        
        // Apply flame motion to particles with some lag
        const flameX = flameRef.current?.position.x || 0;
        const flameY = flameRef.current?.position.y || 0.5;
        const flameZ = flameRef.current?.position.z || 0;
        
        // Store in buffer
        positions[i * 3] = particle.position.x + flameX;
        positions[i * 3 + 1] = particle.position.y + flameY;
        positions[i * 3 + 2] = particle.position.z + flameZ;
        
        // Fade out particles as they age
        sizes[i] = particle.size * Math.pow(particle.life / particle.lifeSpan, 2);
      }
      
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.size.needsUpdate = true;
    }

      // Pulsating light
    if (lightRef.current) {
      const pulse = 3 + Math.sin(time * 4 + index) * 1.5;
      lightRef.current.intensity = pulse;
    }
  });

  // Candle dimensions
  const candleHeight = 1.5; // Height of the cylindrical candle
  const candleRadius = 0.15; // Radius of the cylindrical candle

  return (
    <group ref={candleRef} position={[x, 0, 0]}>
      {/* Candle Body - Cylindrical shape */}
      <mesh position={[0, candleHeight / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[candleRadius, candleRadius, candleHeight, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.5}
          metalness={0.0}
          emissive="#fff8e0"
          emissiveIntensity={0.1}
          transparent
          opacity={0.98}
        />
      </mesh>

      {/* Digit displayed on the side of the candle */}
      <Text
        position={[candleRadius + 0.01, candleHeight / 2, 0]}
        rotation={[0, 0, 0]}
        fontSize={0.4}
        color="#D4AF37"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
        fontWeight="bold"
      >
        {digit}
      </Text>



      {/* Highly realistic flame with natural distortion */}
        <group ref={flameRef} position={[0, candleHeight + 0.7, 0]} scale={[0.5, 0.5, 0.5]}>
          {/* Base flame - irregular torus shape */}
          <mesh castShadow={true} receiveShadow={false} position={[0, -0.05, 0]}>
            <torusGeometry args={[0.12, 0.05, 6, 12]} />
            <meshStandardMaterial
              color="#ff1100"
              emissive="#ff3300"
              emissiveIntensity={2.0}
              toneMapped={false}
              transparent
              opacity={0.5}
              roughness={0.01}
              metalness={0.0}
            />
          </mesh>
          
          {/* Main flame body - using cylinder with custom scaling */}
          <mesh castShadow={true} receiveShadow={false}>
            <cylinderGeometry args={[0.1, 0.12, 0.4, 8]} />
            <meshStandardMaterial
              color="#ff6600"
              emissive="#ff9900"
              emissiveIntensity={4.5}
              toneMapped={false}
              transparent
              opacity={0.65}
              roughness={0.0}
              metalness={0.0}
            />
          </mesh>
          
          {/* Inner flame - using sphere for softer look */}
          <mesh scale={[0.6, 0.7, 0.6]} position={[0, 0.05, 0]} castShadow={true} receiveShadow={false}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial
              color="#ffee00"
              emissive="#ffcc33"
              emissiveIntensity={6.5}
              toneMapped={false}
              transparent
              opacity={0.75}
              roughness={0.0}
              metalness={0.0}
            />
          </mesh>
          
          {/* Flame tip - stretched cone for more realistic shape */}
          <mesh scale={[0.3, 0.8, 0.3]} position={[0, 0.2, 0]} castShadow={true} receiveShadow={false}>
            <coneGeometry args={[0.08, 0.25, 6]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffaa"
              emissiveIntensity={11}
              toneMapped={false}
              transparent
              opacity={0.9}
              roughness={0.0}
              metalness={0.0}
            />
          </mesh>
          
          {/* Flame glow - subtle outer layer */}
          <mesh scale={[1.2, 1.1, 1.2]} position={[0, 0.1, 0]} castShadow={false} receiveShadow={false}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial
              color="#ffcc00"
              emissive="#ffdd66"
              emissiveIntensity={1.8}
              toneMapped={false}
              transparent
              opacity={0.25}
              roughness={0.0}
              metalness={0.0}
            />
          </mesh>
          
          {/* Additional flame tendrils for natural look */}
          <mesh scale={[0.25, 0.6, 0.25]} position={[-0.1, 0.1, 0]} rotation={[0, 0, -0.3]} castShadow={true} receiveShadow={false}>
            <coneGeometry args={[0.06, 0.2, 5]} />
            <meshStandardMaterial
              color="#ff8800"
              emissive="#ffaa00"
              emissiveIntensity={3.5}
              toneMapped={false}
              transparent
              opacity={0.6}
              roughness={0.0}
              metalness={0.0}
            />
          </mesh>
          
          <mesh scale={[0.2, 0.5, 0.2]} position={[0.08, 0.15, 0.05]} rotation={[0, 0, 0.2]} castShadow={true} receiveShadow={false}>
            <coneGeometry args={[0.05, 0.15, 5]} />
            <meshStandardMaterial
              color="#ff7700"
              emissive="#ff9900"
              emissiveIntensity={3.0}
              toneMapped={false}
              transparent
              opacity={0.55}
              roughness={0.0}
              metalness={0.0}
            />
          </mesh>
          
          {/* Additional flame tendrils for more natural look */}
          <mesh scale={[0.3, 0.6, 0.3]} position={[0.06, 0.1, 0]} rotation={[0, 0, 0.5]} castShadow={true} receiveShadow={false}>
            <coneGeometry args={[0.03, 0.25, 4]} />
            <meshStandardMaterial
              color="#ff6600"
              emissive="#ff8822"
              emissiveIntensity={2.5}
              toneMapped={false}
              transparent
              opacity={0.75}
              roughness={0.1}
              metalness={0.0}
            />
          </mesh>
          
          <mesh scale={[0.25, 0.5, 0.25]} position={[-0.05, 0.12, 0]} rotation={[0, 0, -0.3]} castShadow={true} receiveShadow={false}>
            <coneGeometry args={[0.025, 0.2, 4]} />
            <meshStandardMaterial
              color="#ff5500"
              emissive="#ff7722"
              emissiveIntensity={2}
              toneMapped={false}
              transparent
              opacity={0.65}
              roughness={0.15}
              metalness={0.0}
            />
          </mesh>
        </group>
        
        {/* Particle system for spark effects */}
        <points ref={particleSystemRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={20}
              array={new Float32Array(60).fill(0)}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-size"
              count={20}
              array={new Float32Array(20).fill(0.01)}
              itemSize={1}
            />
          </bufferGeometry>
          <pointsMaterial
            color="#ffdd00"
            emissive="#ffff44"
            emissiveIntensity={3}
            transparent
            opacity={0.8}
            sizeAttenuation={true}
            toneMapped={false}
          />
        </points>

      {/* Point Light */}
      <pointLight
        ref={lightRef}
        color="#ffaa00"
        intensity={3}
        distance={8}
        decay={2}
        position={[0, candleHeight + 0.25, 0]}
      />
    </group>
  );
};

export const TreeStar: React.FC<TreeStarProps> = ({ mode, age }) => {
  const groupRef = useRef<THREE.Group>(null);
  const candleRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const particleSystemRef = useRef<THREE.Points>(null);
  const particlesDataRef = useRef<any[]>([]);

  // Age as string for display
  const ageString = age.toString();
  const candleHeight = 2.0; // Increased height
  const candleRadius = 0.15;

  // Main flame geometry removed - using cone geometry directly in JSX

  // Target positions - closer to cake
  const formedPos = new THREE.Vector3(0, 7.5, 0);
  const chaosPos = new THREE.Vector3(
    Math.random() * 20 - 10,
    15 + Math.random() * 10,
    Math.random() * 20 - 10
  );

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const isFormed = mode === TreeMode.FORMED;
    const time = state.clock.elapsedTime;
    const targetPos = isFormed ? formedPos : chaosPos;
    groupRef.current.position.lerp(targetPos, delta * 1.5);

    // Ultra realistic flame animation for main candle
    if (flameRef.current && isFormed) {
      // Very complex flickering with multiple frequencies
      const timeWithOffset = time + 0.5; // Offset to make main candle different from smaller ones
      
      // More chaotic movement
      const flickerX = (
        Math.sin(timeWithOffset * 8.8) * 0.04 +
        Math.sin(timeWithOffset * 13.2) * 0.018 +
        Math.sin(timeWithOffset * 21.7) * 0.01
      );
      
      const flickerY = (
        Math.sin(timeWithOffset * 6.5) * 0.03 +
        Math.sin(timeWithOffset * 10.3) * 0.015 +
        Math.sin(timeWithOffset * 18.2) * 0.008
      );
      
      const flickerZ = (
        Math.sin(timeWithOffset * 7.7) * 0.025 +
        Math.sin(timeWithOffset * 15.4) * 0.01
      );
      
      // Very irregular scaling (more natural flame shape)
      const scaleX = 1 + (
        Math.sin(timeWithOffset * 11.8) * 0.18 +
        Math.sin(timeWithOffset * 16.4) * 0.07 +
        Math.sin(timeWithOffset * 25.3) * 0.04
      );
      
      const scaleY = 1 + (
        Math.sin(timeWithOffset * 9.2) * 0.15 +
        Math.sin(timeWithOffset * 14.1) * 0.1 +
        Math.sin(timeWithOffset * 21.8) * 0.05
      );
      
      const scaleZ = 1 + (
        Math.sin(timeWithOffset * 10.1) * 0.18 +
        Math.sin(timeWithOffset * 14.8) * 0.07 +
        Math.sin(timeWithOffset * 23.2) * 0.04
      );
      
      // Apply transformations
      flameRef.current.position.x = flickerX;
      flameRef.current.position.y = candleHeight + 0.8 + flickerY;
      flameRef.current.position.z = flickerZ;
      flameRef.current.scale.set(scaleX, scaleY, scaleZ);
      
      // More chaotic rotation in all axes
      flameRef.current.rotation.x = (
        Math.sin(timeWithOffset * 5.6) * 0.15 +
        Math.sin(timeWithOffset * 11.2) * 0.06
      );
      
      flameRef.current.rotation.y = (
        Math.sin(timeWithOffset * 6.8) * 0.12 +
        Math.sin(timeWithOffset * 13.5) * 0.05
      );
      
      flameRef.current.rotation.z = (
        Math.sin(timeWithOffset * 8.1) * 0.18 +
        Math.sin(timeWithOffset * 14.9) * 0.07
      );
    }

    // Particle system animation for sparks
    if (particleSystemRef.current && isFormed) {
      const geometry = particleSystemRef.current.geometry as THREE.BufferGeometry;
      const positions = geometry.attributes.position.array as Float32Array;
      const sizes = geometry.attributes.size.array as Float32Array;
      
      // Initialize particles if needed
      if (particlesDataRef.current.length === 0) {
        particlesDataRef.current = [];
        for (let i = 0; i < 25; i++) {
          particlesDataRef.current.push({
            life: Math.random() * 1,
            lifeSpan: Math.random() * 1.2 + 0.4,
            position: new THREE.Vector3(0, 0, 0),
            velocity: new THREE.Vector3(
              (Math.random() - 0.5) * 0.5,
              Math.random() * 0.8 + 0.4,
              (Math.random() - 0.5) * 0.5
            ),
            size: Math.random() * 0.03 + 0.008,
            type: Math.random() < 0.25 ? 'spark' : (Math.random() < 0.5 ? 'ember' : 'smoke'), // Three types of particles
            color: Math.random() < 0.3 ? '#ffff00' : (Math.random() < 0.6 ? '#ffaa00' : '#ff6600')
          });
        }
      }
      
      // Update particles
      for (let i = 0; i < 25; i++) {
        const particle = particlesDataRef.current[i];
        particle.life -= delta;
        
        if (particle.life <= 0) {
          // Reset particle with more variation
          particle.life = particle.lifeSpan;
          particle.position.set(
            (Math.random() - 0.5) * 0.2,
            0.2 + Math.random() * 0.2,
            (Math.random() - 0.5) * 0.2
          );
          particle.velocity.set(
            (Math.random() - 0.5) * 0.6,
            Math.random() * 1.0 + 0.5,
            (Math.random() - 0.5) * 0.6
          );
          particle.size = Math.random() * 0.04 + 0.01;
          particle.type = Math.random() < 0.25 ? 'spark' : (Math.random() < 0.5 ? 'ember' : 'smoke');
          particle.color = Math.random() < 0.3 ? '#ffff00' : (Math.random() < 0.6 ? '#ffaa00' : '#ff6600');
        }
        
        // Update position with turbulence
        const turbulenceX = Math.sin(time * 6.0 + i) * 0.015;
        const turbulenceY = Math.cos(time * 5.0 + i) * 0.015;
        const turbulenceZ = Math.sin(time * 7.0 + i) * 0.015;
        
        const turbulence = new THREE.Vector3(turbulenceX, turbulenceY, turbulenceZ);
        particle.position.add(particle.velocity.clone().multiplyScalar(delta));
        particle.position.add(turbulence.multiplyScalar(delta * 7));
        
        // Different gravity and behavior for different particle types
        if (particle.type === 'spark') {
          particle.velocity.y -= 0.15 * delta; // Less gravity for sparks
          particle.velocity.x *= 0.99; // Slight drag
          particle.velocity.z *= 0.99;
        } else if (particle.type === 'ember') {
          particle.velocity.y -= 0.4 * delta; // More gravity for embers
          particle.velocity.x *= 0.98; // More drag
          particle.velocity.z *= 0.98;
        } else { // smoke
          particle.velocity.y -= 0.05 * delta; // Very little gravity for smoke
          particle.velocity.x *= 0.97; // More drag
          particle.velocity.z *= 0.97;
        }
        
        // Apply flame motion to particles with some lag
        const flameX = flameRef.current?.position.x || 0;
        const flameY = flameRef.current?.position.y || 0.6;
        const flameZ = flameRef.current?.position.z || 0;
        
        // Store in buffer
        positions[i * 3] = particle.position.x + flameX;
        positions[i * 3 + 1] = particle.position.y + flameY;
        positions[i * 3 + 2] = particle.position.z + flameZ;
        
        // Fade out particles as they age with different curves for different types
        if (particle.type === 'spark') {
          sizes[i] = particle.size * Math.pow(particle.life / particle.lifeSpan, 1.5);
        } else {
          sizes[i] = particle.size * Math.pow(particle.life / particle.lifeSpan, 2.5);
        }
      }
      
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.size.needsUpdate = true;
    }

      // Pulsating light
    if (lightRef.current) {
      const pulse = 3 + Math.sin(time * 4) * 1.5;
      lightRef.current.intensity = pulse;
    }

    // Update candle material
    if (candleRef.current) {
      candleRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (material && material.isMeshStandardMaterial) {
            material.color.set("#ffffff");
            material.roughness = 0.5;
            material.metalness = 0.0;
            material.emissive.set("#fff8e0");
            material.emissiveIntensity = 0.1;
            material.transparent = true;
            material.opacity = 0.98;
          }
        }
      });
    }
  });

  return (
    <group ref={groupRef} position={[0, 7.5, 0]}>
      <group ref={candleRef}>
        {/* Candle Body - Age number as 3D cylindrical text shape (larger) */}
        <Text
          position={[0, candleHeight / 2, 0]}
          rotation={[0, 0, 0]}
          fontSize={1.2}
          color="#ffffff"
          anchorX="center"
          anchorY="bottom"
          depth={0.5}
          curveSegments={32}
          bevelEnabled
          bevelThickness={0.15}
          bevelSize={0.12}
          bevelSegments={16}
          castShadow
          receiveShadow
        >
          {ageString}
        </Text>



        {/* Highly realistic flame with natural distortion */}
        <group ref={flameRef} position={[0, candleHeight + 0.8, 0]} scale={[0.4, 0.4, 0.4]}>
          {/* Base flame - irregular torus shape */}
          <mesh castShadow={true} receiveShadow={false} position={[0, -0.08, 0]}>
            <torusGeometry args={[0.18, 0.07, 8, 16]} />
            <meshStandardMaterial
              color="#ff1100"
              emissive="#ff3300"
              emissiveIntensity={2.5}
              toneMapped={false}
              transparent
              opacity={0.45}
              roughness={0.01}
              metalness={0.0}
            />
          </mesh>
          
          {/* Main flame body - using cylinder with custom scaling */}
          <mesh castShadow={true} receiveShadow={false}>
            <cylinderGeometry args={[0.15, 0.18, 0.6, 10]} />
            <meshStandardMaterial
              color="#ff7700"
              emissive="#ffaa00"
              emissiveIntensity={5.5}
              toneMapped={false}
              transparent
              opacity={0.65}
              roughness={0.0}
              metalness={0.0}
            />
          </mesh>
          
          {/* Inner flame - using sphere for softer look */}
          <mesh scale={[0.5, 0.6, 0.5]} position={[0, 0.1, 0]} castShadow={true} receiveShadow={false}>
            <sphereGeometry args={[0.22, 10, 10]} />
            <meshStandardMaterial
              color="#ffee00"
              emissive="#ffdd33"
              emissiveIntensity={7.5}
              toneMapped={false}
              transparent
              opacity={0.75}
              roughness={0.0}
              metalness={0.0}
            />
          </mesh>
          
          {/* Flame tip - stretched cone for more realistic shape */}
          <mesh scale={[0.3, 0.8, 0.3]} position={[0, 0.3, 0]} castShadow={true} receiveShadow={false}>
            <coneGeometry args={[0.12, 0.35, 8]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffaa"
              emissiveIntensity={15}
              toneMapped={false}
              transparent
              opacity={0.9}
              roughness={0.0}
              metalness={0.0}
            />
          </mesh>
          
          {/* Flame glow - subtle outer layer */}
          <mesh scale={[1.3, 1.2, 1.3]} position={[0, 0.15, 0]} castShadow={false} receiveShadow={false}>
            <sphereGeometry args={[0.28, 10, 10]} />
            <meshStandardMaterial
              color="#ffcc00"
              emissive="#ffdd66"
              emissiveIntensity={2.0}
              toneMapped={false}
              transparent
              opacity={0.25}
              roughness={0.0}
              metalness={0.0}
            />
          </mesh>
          
          {/* Additional flame tendrils for natural look */}
          <mesh scale={[0.3, 0.7, 0.3]} position={[-0.15, 0.15, 0]} rotation={[0, 0, -0.3]} castShadow={true} receiveShadow={false}>
            <coneGeometry args={[0.08, 0.25, 6]} />
            <meshStandardMaterial
              color="#ff9900"
              emissive="#ffbb00"
              emissiveIntensity={4.0}
              toneMapped={false}
              transparent
              opacity={0.6}
              roughness={0.0}
              metalness={0.0}
            />
          </mesh>
          
          <mesh scale={[0.25, 0.6, 0.25]} position={[0.12, 0.2, 0.08]} rotation={[0, 0, 0.25]} castShadow={true} receiveShadow={false}>
            <coneGeometry args={[0.07, 0.2, 6]} />
            <meshStandardMaterial
              color="#ff8800"
              emissive="#ffaa00"
              emissiveIntensity={3.5}
              toneMapped={false}
              transparent
              opacity={0.55}
              roughness={0.0}
              metalness={0.0}
            />
          </mesh>
          
          <mesh scale={[0.2, 0.5, 0.2]} position={[-0.08, 0.25, -0.1]} rotation={[0, 0, -0.2]} castShadow={true} receiveShadow={false}>
            <coneGeometry args={[0.06, 0.18, 5]} />
            <meshStandardMaterial
              color="#ff7700"
              emissive="#ff9900"
              emissiveIntensity={3.0}
              toneMapped={false}
              transparent
              opacity={0.5}
              roughness={0.0}
              metalness={0.0}
            />
          </mesh>
          
          {/* Additional flame tendrils for more natural look */}
          <mesh scale={[0.4, 0.7, 0.4]} position={[0.12, 0.15, 0]} rotation={[0, 0, 0.4]} castShadow={true} receiveShadow={false}>
            <coneGeometry args={[0.05, 0.35, 5]} />
            <meshStandardMaterial
              color="#ff6600"
              emissive="#ff8822"
              emissiveIntensity={3}
              toneMapped={false}
              transparent
              opacity={0.75}
              roughness={0.1}
              metalness={0.0}
            />
          </mesh>
          
          <mesh scale={[0.35, 0.6, 0.35]} position={[-0.1, 0.18, 0]} rotation={[0, 0, -0.3]} castShadow={true} receiveShadow={false}>
            <coneGeometry args={[0.04, 0.3, 5]} />
            <meshStandardMaterial
              color="#ff5500"
              emissive="#ff7722"
              emissiveIntensity={2.5}
              toneMapped={false}
              transparent
              opacity={0.65}
              roughness={0.15}
              metalness={0.0}
            />
          </mesh>
          
          <mesh scale={[0.3, 0.55, 0.3]} position={[0.05, 0.05, 0.1]} rotation={[0.2, 0, 0.2]} castShadow={true} receiveShadow={false}>
            <coneGeometry args={[0.035, 0.28, 4]} />
            <meshStandardMaterial
              color="#ff6611"
              emissive="#ff8833"
              emissiveIntensity={2.2}
              toneMapped={false}
              transparent
              opacity={0.7}
              roughness={0.12}
              metalness={0.0}
            />
          </mesh>
        </group>
        
        {/* Particle system for sparks */}
        <points ref={particleSystemRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={30}
              array={new Float32Array(90).fill(0)}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-size"
              count={30}
              array={new Float32Array(30).fill(0.01)}
              itemSize={1}
            />
          </bufferGeometry>
          <pointsMaterial
            color="#ffdd00"
            emissive="#ffff44"
            emissiveIntensity={4}
            transparent
            opacity={0.8}
            sizeAttenuation={true}
            toneMapped={false}
          />
        </points>

        {/* Point Light */}
        <pointLight
          ref={lightRef}
          color="#ffaa00"
          intensity={3}
          distance={8}
          decay={2}
          position={[0, candleHeight + 0.5, 0]}
        />
      </group>
    </group>
  );
};

