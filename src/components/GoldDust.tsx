import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GoldDust: React.FC = () => {
  const count = 500; // More snow
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initial random positions
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.05 + Math.random() * 0.1; // Falling speed
      const x = Math.random() * 40 - 20;
      const y = Math.random() * 40 - 10; // Start higher
      const z = Math.random() * 40 - 20;
      // Random color: Gold or Silver
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
      if (particle.y < -20) {
        particle.y = 20;
        particle.x = Math.random() * 40 - 20;
        particle.z = Math.random() * 40 - 20;
      }

      // Horizontal sway
      particle.x += Math.sin(particle.t) * 0.02;
      particle.z += Math.cos(particle.t) * 0.02;

      // Attraction to cursor (still keep magic)
      const dx = targetX - particle.x;
      const dy = targetY - particle.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 8) {
        particle.x += dx * 0.03;
        particle.y += dy * 0.03;
      }

      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.scale.setScalar(0.05 + Math.random() * 0.05); // Twinkle size
      dummy.rotation.set(Math.sin(particle.t), Math.cos(particle.t), 0);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, particle.color);
    });

    if (meshRef.current) {
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshStandardMaterial emissive="#ffffff" emissiveIntensity={0.8} toneMapped={false} vertexColors />
    </instancedMesh>
  );
};

export default GoldDust;
