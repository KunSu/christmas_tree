import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GoldDust: React.FC = () => {
  const count = 10000; // More snow for full coverage
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
      const color = isGold ? new THREE.Color("#FFD700") : new THREE.Color("#C0C0C0");

      temp.push({ t, factor, speed, x, y, z, color });
    }
    return temp;
  }, []);

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
      <meshStandardMaterial emissive="#ffffff" emissiveIntensity={0.8} toneMapped={false} vertexColors />
    </instancedMesh >
  );
};

export default GoldDust;
