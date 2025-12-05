import React, { useRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { useStore } from '../store/useStore';
import Foliage from './Foliage';
import Ornaments from './Ornaments';
import GoldDust from './GoldDust';
import Star from './Star';
import * as THREE from 'three';

const ChristmasTree: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null);
    const mode = useStore((state) => state.mode);

    // Swipe to Spin Logic
    const isDragging = useRef(false);
    const previousPointerX = useRef(0);
    const angularVelocity = useRef(0);
    const friction = 0.95; // Damping factor

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // Apply rotation based on velocity
        groupRef.current.rotation.y += angularVelocity.current * delta * 60; // Normalize to 60fps

        // Apply friction
        if (!isDragging.current) {
            angularVelocity.current *= friction;
        }

        // Stop completely if very slow
        if (Math.abs(angularVelocity.current) < 0.001) {
            angularVelocity.current = 0;
        }
    });

    const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
        // Only interact if hitting the tree area roughly (or global?)
        // For now, let's make it global on the group, but we might need a hit plane.
        // Actually, the user said "Swipe to Spin", implying anywhere or on the tree.
        // Let's attach events to a invisible mesh or the group if it has content.
        isDragging.current = true;
        previousPointerX.current = e.pointer.x;
        e.stopPropagation();
    };

    const handlePointerUp = () => {
        isDragging.current = false;
    };

    const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (isDragging.current) {
            const deltaX = e.pointer.x - previousPointerX.current;
            angularVelocity.current += deltaX * 0.05; // Sensitivity
            previousPointerX.current = e.pointer.x;
        }
    };

    // We need a hit area for the swipe. A simple cylinder or box invisible.
    return (
        <group
            ref={groupRef}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerMove={handlePointerMove}
        >
            {/* Hit area for interaction */}
            <mesh visible={false}>
                <cylinderGeometry args={[6, 6, 12, 16]} />
                <meshBasicMaterial />
            </mesh>

            <Foliage />
            <Ornaments />
            <GoldDust />
            <Star />
        </group>
    );
};

export default ChristmasTree;
