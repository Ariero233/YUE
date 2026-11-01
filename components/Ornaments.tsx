import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMode } from '../types';

interface OrnamentsProps {
  mode: TreeMode;
  count: number;
}

type OrnamentType = 'ball' | 'gift' | 'light';

interface InstanceData {
  chaosPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  type: OrnamentType;
  color: THREE.Color;
  scale: number;
  speed: number;
  rotationOffset: THREE.Euler;
}

export const Ornaments: React.FC<OrnamentsProps> = ({ mode, count }) => {
  // We use 3 separate InstancedMeshes for different geometries/materials to reduce draw calls
  // but allow unique shapes.
  const ballsRef = useRef<THREE.InstancedMesh>(null);
  const giftsRef = useRef<THREE.InstancedMesh>(null);
  const lightsRef = useRef<THREE.InstancedMesh>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate data once
  const { ballsData, giftsData, lightsData } = useMemo(() => {
    const _balls: InstanceData[] = [];
    const _gifts: InstanceData[] = [];
    const _lights: InstanceData[] = [];

    const height = 8; // Cake height
    const maxRadius = 5; // Max cake radius
    const layerCount = 3; // Number of cake layers
    
    // Cake Decorating Colors - Realistic and appetizing color palette
    
    // Base Frosting Colors (Cream and Frosting)
    const vanillaCream = new THREE.Color("#FFF8DC"); // Warm vanilla cream
    const whiteFrosting = new THREE.Color("#FFFFFF"); // Classic white frosting
    const creamCheese = new THREE.Color("#FDF5E6"); // Cream cheese frosting
    
    // Chocolate Family (Cake and Ganache)
    const darkChocolate = new THREE.Color("#3C1810"); // Dark chocolate ganache
    const milkChocolate = new THREE.Color("#8B4513"); // Milk chocolate
    const lightChocolate = new THREE.Color("#D2691E"); // Light chocolate
    const cocoaBrown = new THREE.Color("#4A3728"); // Natural cocoa color
    
    // Fresh Fruit Colors (For Toppings and Decorations)
    const strawberryRed = new THREE.Color("#FF3B30"); // Fresh strawberry
    const raspberryPink = new THREE.Color("#E91E63"); // Raspberry
    const blueberryPurple = new THREE.Color("#4A148C"); // Blueberry
    const lemonYellow = new THREE.Color("#FFEB3B"); // Lemon
    const orangeCitrus = new THREE.Color("#FF9800"); // Orange
    const limeGreen = new THREE.Color("#CDDC39"); // Lime
    
    // Candy and Sprinkle Colors (For Fun Decorations)
    const candyRed = new THREE.Color("#FF0000"); // Red candy
    const candyBlue = new THREE.Color("#2196F3"); // Blue candy
    const candyGreen = new THREE.Color("#4CAF50"); // Green candy
    const candyYellow = new THREE.Color("#FFC107"); // Yellow candy
    const candyPink = new THREE.Color("#FF69B4"); // Pink candy
    const candyPurple = new THREE.Color("#9C27B0"); // Purple candy
    
    // Metallic Decorations (For Elegance)
    const gold = new THREE.Color("#FFD700"); // Gold leaf
    const silver = new THREE.Color("#C0C0C0"); // Silver dragées
    const bronze = new THREE.Color("#CD7F32"); // Bronze decorations
    
    // Pastel Colors (For Buttercream Flowers)
    const pastelPink = new THREE.Color("#FFB6C1"); // Pastel pink
    const pastelBlue = new THREE.Color("#87CEFA"); // Pastel blue
    const pastelGreen = new THREE.Color("#98FB98"); // Pastel green
    const pastelYellow = new THREE.Color("#FFFFE0"); // Pastel yellow
    const pastelLavender = new THREE.Color("#E6E6FA"); // Pastel lavender
    
    // Organized palette - Base colors first, then decorative colors
    const palette = [
      // Base Frosting Colors
      vanillaCream, whiteFrosting, creamCheese,
      
      // Chocolate Family
      darkChocolate, milkChocolate, lightChocolate, cocoaBrown,
      
      // Fresh Fruit Colors
      strawberryRed, raspberryPink, blueberryPurple, lemonYellow, orangeCitrus, limeGreen,
      
      // Candy and Sprinkle Colors
      candyRed, candyBlue, candyGreen, candyYellow, candyPink, candyPurple,
      
      // Metallic Decorations
      gold, silver, bronze,
      
      // Pastel Colors
      pastelPink, pastelBlue, pastelGreen, pastelYellow, pastelLavender
    ];

    // Layer heights and radii (matching Foliage exactly)
    const layerHeights = [0, 2.8, 5.6];
    const layerRadii = [maxRadius, maxRadius * 0.75, maxRadius * 0.5];
    const layerThickness = [2.8, 2.8, 2.4];
    
    // Adjust decorations per layer - more at the bottom
    // Bottom layer gets more decorations for denser appearance
    const bottomLayerWeight = 1.5; // Bottom layer gets 50% more decorations
    const totalWeight = bottomLayerWeight + 1 + 1; // Bottom + middle + top layers
    const bottomLayerDecorations = Math.floor(count * (bottomLayerWeight / totalWeight));
    const middleLayerDecorations = Math.floor(count * (1 / totalWeight));
    const topLayerDecorations = count - bottomLayerDecorations - middleLayerDecorations;
    
    const layerDecorations = [bottomLayerDecorations, middleLayerDecorations, topLayerDecorations];
    
    // Calculate cumulative decorations per layer
    const cumulativeDecorations = [0, bottomLayerDecorations, bottomLayerDecorations + middleLayerDecorations];

    for (let i = 0; i < count; i++) {
      const rnd = Math.random();
      let type: OrnamentType = 'ball';
      if (rnd > 0.8) type = 'gift';
      if (rnd > 0.9) type = 'light';

      // Determine which layer this decoration belongs to
      let layerIndex = 0;
      if (i >= cumulativeDecorations[2]) layerIndex = 2;
      else if (i >= cumulativeDecorations[1]) layerIndex = 1;
      
      const currentLayer = layerIndex;
      const layerStartIndex = cumulativeDecorations[currentLayer];
      const indexInLayer = i - layerStartIndex;
      const totalInLayer = layerDecorations[currentLayer];
      
      // Layer properties
      const layerHeight = layerHeights[currentLayer];
      const layerTop = layerHeight + layerThickness[currentLayer];
      const layerRadius = layerRadii[currentLayer];
      
      // Decide decoration position: top surface or side edge
      const isTopDecoration = indexInLayer < totalInLayer * 0.6; // 60% on top
      
      let y, r, theta;
      
      if (isTopDecoration) {
        // Decorations on top surface - arranged in concentric circles
        const topIndex = indexInLayer;
        const rings = 3; // Number of concentric rings
        const ringIndex = Math.floor(topIndex / (totalInLayer * 0.6 / rings));
        const itemsInRing = Math.ceil((totalInLayer * 0.6) / rings);
        const indexInRing = topIndex % itemsInRing;
        
        // Calculate radius for this ring (from center to edge)
        const ringRadius = (ringIndex + 1) / rings * layerRadius * 0.85; // 85% of layer radius
        
        // Evenly distribute around the ring
        theta = (indexInRing / itemsInRing) * Math.PI * 2;
        r = ringRadius;
        y = layerTop - 0.1; // Slightly above top surface
      } else {
        // Decorations on side edge - evenly distributed around the perimeter
        const edgeIndex = indexInLayer - Math.floor(totalInLayer * 0.6);
        const edgeCount = totalInLayer - Math.floor(totalInLayer * 0.6);
        
        // Evenly spaced around the circle
        theta = (edgeIndex / edgeCount) * Math.PI * 2;
        r = layerRadius + 0.05; // On the edge
        // Distribute vertically along the side - increased to 5 rows for denser appearance
        const verticalPos = (edgeIndex % 5) / 5; // 5 rows on the side for more density
        y = layerHeight + verticalPos * layerThickness[currentLayer];
      }
      
      const targetPos = new THREE.Vector3(
        r * Math.cos(theta),
        y,
        r * Math.sin(theta)
      );

      // 2. Chaos Position
      const cR = 15 + Math.random() * 15;
      const cTheta = Math.random() * Math.PI * 2;
      const cPhi = Math.acos(2 * Math.random() - 1);
      const chaosPos = new THREE.Vector3(
        cR * Math.sin(cPhi) * Math.cos(cTheta),
        cR * Math.sin(cPhi) * Math.sin(cTheta) + 5,
        cR * Math.cos(cPhi)
      );

      const scale = type === 'light' ? 0.15 : (0.2 + Math.random() * 0.25);
      const color = type === 'light' ? new THREE.Color("#FFFFFF") : palette[Math.floor(Math.random() * palette.length)];

      const data: InstanceData = {
        chaosPos,
        targetPos,
        type,
        color,
        scale,
        speed: 1.5 + Math.random() * 1.5, // Increased base speed for faster transitions (was 0.5-2.0, now 1.5-3.0)
        rotationOffset: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      };

      if (type === 'ball') _balls.push(data);
      else if (type === 'gift') _gifts.push(data);
      else _lights.push(data);
    }

    return { ballsData: _balls, giftsData: _gifts, lightsData: _lights };
  }, [count]);

  useLayoutEffect(() => {
    // Set initial colors
    [
      { ref: ballsRef, data: ballsData },
      { ref: giftsRef, data: giftsData },
      { ref: lightsRef, data: lightsData }
    ].forEach(({ ref, data }) => {
      if (ref.current) {
        data.forEach((d, i) => {
          ref.current!.setColorAt(i, d.color);
        });
        ref.current.instanceColor!.needsUpdate = true;
      }
    });
  }, [ballsData, giftsData, lightsData]);

  useFrame((state, delta) => {
    const isFormed = mode === TreeMode.FORMED;
    const time = state.clock.elapsedTime;

    // Helper to update a mesh ref
    const updateMesh = (ref: React.RefObject<THREE.InstancedMesh>, data: InstanceData[]) => {
      if (!ref.current) return;

      let needsUpdate = false;

      data.forEach((d, i) => {
        // Interpolation Factor based on individual speed and global delta
        // We use a simple approach: if formed, target is targetPos, else chaosPos
        const dest = isFormed ? d.targetPos : d.chaosPos;
        
        // We actually want to lerp the CURRENT position to the DESTINATION
        // But extracting current position from matrix is expensive every frame for all.
        // Instead, we calculate "current" based on a virtual progress 0-1 driven by state.
        
        // To simulate "physics" (heavy/light), we don't store state per particle here (too complex for this snippet).
        // Instead, we calculate position based on a time-dependent lerp factor.
        
        // However, a simple way to make it feel organic is:
        // Position = Mix(Chaos, Target, SmoothStep(GlobalProgress * speed))
        
        // Let's use a sin wave derived from time for hover, but the main transition is driven by a hidden 'progress' value
        // Since we don't have a global store for animation progress per particle, we approximate using the mode switch time.
        // For a robust system, we'd use a spring library, but here we do manual lerping.

        // Get current matrix position to lerp from? Too expensive.
        // Let's assume a global transition variable `t` that goes 0->1 or 1->0.
        // We will misuse the object's userdata or just calculate purely functional.
        
        // Functional approach:
        // We need an accumulated value. Let's create a visual wobble.
        
        // NOTE: For true interactive physics, we'd use useSprings from react-spring/three, 
        // but for 1000 instances, manual matrix manipulation is better.
        // Here we will simply interpolate between the two static positions based on a "progress" variable
        // that we track manually or approximate.
        
        // Let's read a custom progress from the dataset. 
        // We'll augment the data object with a mutable `currentProgress` property in a closure if possible,
        // but `data` is static.
        
        // Let's just use the `MathUtils.lerp` on the vectors directly inside the loop 
        // by reading the matrix, lerping, writing back.
        ref.current!.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
        
        const step = delta * d.speed;
        dummy.position.lerp(dest, step);

        // Remove wobble effect to prevent flickering
        // if (isFormed && dummy.position.distanceTo(d.targetPos) < 0.5) {
        //   dummy.position.y += Math.sin(time * 2 + d.chaosPos.x) * 0.002;
        // }

        // Rotation
        if (d.type === 'gift') {
           dummy.rotation.x += delta * 0.5;
           dummy.rotation.y += delta * 0.2;
        } else {
           // Balls face out - use fixed rotation instead of lookAt to prevent flickering
           const angle = Math.atan2(dummy.position.x, dummy.position.z);
           dummy.rotation.y = angle;
        }

        dummy.scale.setScalar(d.scale);
        // Remove pulsate effect to prevent flickering
        // if (d.type === 'light') {
        //    const pulse = 1 + Math.sin(time * 5 + d.chaosPos.y) * 0.3;
        //    dummy.scale.multiplyScalar(pulse);
        // }

        dummy.updateMatrix();
        ref.current!.setMatrixAt(i, dummy.matrix);
        needsUpdate = true;
      });

      if (needsUpdate) ref.current.instanceMatrix.needsUpdate = true;
    };

    updateMesh(ballsRef, ballsData);
    updateMesh(giftsRef, giftsData);
    updateMesh(lightsRef, lightsData);
  });

  return (
    <>
      {/* Balls - Super glossy metallic finish */}
      <instancedMesh ref={ballsRef} args={[undefined, undefined, ballsData.length]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial roughness={0.1} metalness={0.95} envMapIntensity={1.8} />
      </instancedMesh>

      {/* Gifts - Super glossy metallic finish */}
      <instancedMesh ref={giftsRef} args={[undefined, undefined, giftsData.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.15} metalness={0.85} envMapIntensity={1.5} />
      </instancedMesh>

      {/* Lights - Extra bright with glossy metallic finish */}
      <instancedMesh ref={lightsRef} args={[undefined, undefined, lightsData.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial 
          emissive="#FFD700"
          emissiveIntensity={1.2}
          toneMapped={true}
          roughness={0.1}
          metalness={0.8}
        />
      </instancedMesh>
    </>
  );
};