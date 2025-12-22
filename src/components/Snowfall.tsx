import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { currentTheme } from '../config/theme';

interface SnowfallProps {
  isMobile?: boolean;
}

/**
 * Get optimized particle count based on device capabilities
 */
function getOptimizedParticleCount(isMobile: boolean): number {
  // Default counts
  const BASE_DESKTOP = 10000;
  const BASE_MOBILE = 6000;

  if (typeof window === 'undefined') {
    return isMobile ? BASE_MOBILE : BASE_DESKTOP;
  }

  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 4;

  // Check device memory (Chrome only)
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;

  // Check for connection quality
  const connection = (navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean }
  }).connection;
  const isSlowConnection = connection?.effectiveType === '2g' ||
    connection?.effectiveType === 'slow-2g' ||
    connection?.saveData === true;

  // Calculate performance factor
  let factor = 1.0;

  if (cores < 4) factor *= 0.5;
  else if (cores < 8) factor *= 0.75;

  if (deviceMemory < 4) factor *= 0.5;
  else if (deviceMemory < 8) factor *= 0.75;

  if (isSlowConnection) factor *= 0.5;

  // Apply mobile reduction
  const base = isMobile ? BASE_MOBILE : BASE_DESKTOP;
  const optimized = Math.floor(base * factor);

  // Ensure minimum count for visual effect
  return Math.max(optimized, 1000);
}

const GoldDust: React.FC<SnowfallProps> = ({ isMobile = false }) => {
  // Use state to handle SSR and dynamic count
  const [count, setCount] = useState(isMobile ? 3000 : 5000);

  useEffect(() => {
    // Update count on client side with optimized value
    setCount(getOptimizedParticleCount(isMobile));
  }, [isMobile]);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initial random positions
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = (0.05 + Math.random() * 0.1) * 0.1; // Falling speed (Slower)
      // Cover a larger area
      const x = Math.random() * 60 - 30;
      const y = Math.random() * 60 - 20;
      const z = Math.random() * 60 - 30;
      // White color for snow
      const isGold = Math.random() > 0.5;
      const color = isGold ? new THREE.Color(currentTheme.snow.color1) : new THREE.Color(currentTheme.snow.color2);

      temp.push({ t, factor, speed, x, y, z, color });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const targetX = (state.pointer.x * state.viewport.width) / 2;
    const targetY = (state.pointer.y * state.viewport.height) / 2;

    particles.forEach((particle, i) => {
      // Update time
      particle.t += 0.01;

      // Falling movement
      particle.y -= particle.speed;

      // Reset if too low
      if (particle.y < -30) {
        particle.y = 30;
        particle.x = Math.random() * 60 - 30;
        particle.z = Math.random() * 60 - 30;
      }

      // Horizontal sway
      particle.x += Math.sin(particle.t) * 0.002;
      particle.z += Math.cos(particle.t) * 0.002;

      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.scale.setScalar(0.05 + Math.random() * 0.05); // Twinkle size
      dummy.rotation.set(Math.sin(particle.t), Math.cos(particle.t), 0);
      dummy.updateMatrix();

      if (meshRef.current) {
        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(i, particle.color);
      }
    });

    if (meshRef.current) {
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} raycast={() => { }}>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshStandardMaterial emissive={currentTheme.snow.emissive} emissiveIntensity={0.8} toneMapped={false} vertexColors />
    </instancedMesh >
  );
};

export default GoldDust;
