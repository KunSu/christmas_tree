import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { generateChaosPositions } from '../utils/positions';
import { generateOrnamentPositions, generateFibonacciSpiralPositions } from '../utils/treeUtils';
import { currentTheme } from '../config/theme';
import InstancedGifts from './InstancedGifts';
import PhotoItem from './PhotoItem';

interface PhotoData {
    id: string;
    url: string;
    description: string;
    date: string;
}

// Helper for instanced ornaments
interface InstancedOrnamentsProps {
    count: number;
    color: string;
    scale: number;
    speedFactor: number;
    geometry: THREE.BufferGeometry;
    radiusMin: number;
    radiusMax: number;
}

const InstancedOrnaments = ({ count, color, scale, speedFactor, geometry, radiusMin, radiusMax }: InstancedOrnamentsProps) => {
    const mode = useStore((state) => state.mode);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const chaosPositions = useMemo(() => generateChaosPositions(count, 20), [count]);
    const treePositions = useMemo(() => generateOrnamentPositions(count, { radiusMin, radiusMax }), [count, radiusMin, radiusMax]);

    // Store current positions to interpolate
    const currentPositions = useMemo(() => {
        const arr = new Float32Array(count * 3);
        // Initialize with tree positions (Formed state)
        treePositions.forEach((v, i) => arr[i] = v);
        return arr;
    }, [count, treePositions]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        const target = mode === 'CHAOS' ? chaosPositions : treePositions;
        const lerpSpeed = 2.0 * speedFactor * delta; // Different weights

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            currentPositions[i3] = THREE.MathUtils.lerp(currentPositions[i3], target[i3], lerpSpeed);
            currentPositions[i3 + 1] = THREE.MathUtils.lerp(currentPositions[i3 + 1], target[i3 + 1], lerpSpeed);
            currentPositions[i3 + 2] = THREE.MathUtils.lerp(currentPositions[i3 + 2], target[i3 + 2], lerpSpeed);

            dummy.position.set(
                currentPositions[i3],
                currentPositions[i3 + 1],
                currentPositions[i3 + 2]
            );

            // Rotate ornaments slightly
            dummy.rotation.set(
                Math.sin(state.clock.elapsedTime + i) * 0.5,
                Math.cos(state.clock.elapsedTime + i) * 0.5,
                0
            );

            dummy.scale.setScalar(scale);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        if (meshRef.current) {
            meshRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]} geometry={geometry} raycast={() => { }}>
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
        </instancedMesh >
    );
};

interface OrnamentsProps {
    isMobile?: boolean;
}

const Ornaments: React.FC<OrnamentsProps> = ({ isMobile = false }) => {
    const [photos, setPhotos] = useState<PhotoData[]>([]);

    useEffect(() => {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        fetch(`${basePath}/assets/photos/photos.json`)
            .then(res => res.json())
            .then((data: PhotoData[]) => {
                // Prefix URLs with basePath for deployment flexibility
                const prefixedPhotos = data.map(photo => ({
                    ...photo,
                    url: `${basePath}${photo.url}`
                }));
                setPhotos(prefixedPhotos);
            })
            .catch(err => console.error("Failed to load photos", err));
    }, []);

    const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 16, 16), []);

    // Generate hanging positions for photos
    const photoPositions = useMemo(() => {
        const count = Math.max(photos.length, 1);
        // Use Fibonacci spiral for photos to ensure even distribution and prevent overlaps
        const pos = generateFibonacciSpiralPositions(count, { radiusMin: 0.95, radiusMax: 1.05 });
        const arr = [];
        for (let i = 0; i < count; i++) {
            arr.push([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]);
        }
        return arr;
    }, [photos.length]);

    return (
        <group>
            {/* Primary Balls - Deeper Layer (0.5 - 0.8) */}
            <InstancedOrnaments count={isMobile ? 250 : 300} color={currentTheme.colors.primaryBall} scale={0.3} speedFactor={0.5} geometry={sphereGeo} radiusMin={0.5} radiusMax={0.8} />

            {/* Secondary Balls - Middle Layer (0.7 - 1.0) */}
            <InstancedOrnaments count={isMobile ? 400 : 500} color={currentTheme.colors.secondaryBall} scale={0.25} speedFactor={0.8} geometry={sphereGeo} radiusMin={0.7} radiusMax={1.0} />

            {/* Lights - Scattered (0.6 - 1.05) */}
            <InstancedOrnaments count={isMobile ? 1200 : 1200} color={currentTheme.colors.lights} scale={0.08} speedFactor={1.5} geometry={sphereGeo} radiusMin={0.6} radiusMax={1.05} />

            {/* Gifts - Outer Layer (0.9 - 1.1) */}
            <InstancedGifts count={isMobile ? 100 : 200} boxColor={currentTheme.gift.box} ribbonColor={currentTheme.gift.ribbon} scale={0.35} speedFactor={0.3} radiusMin={0.8} radiusMax={1.0} />

            {/* Candy - Progressive Distribution */}
            {/* <InstancedOrnaments count={1800} color={currentTheme.colors.candy} scale={0.2} speedFactor={0.6} geometry={new THREE.CylinderGeometry(0.5, 0.5, 2, 8)} /> */}

            {/* Photos */}
            <Suspense fallback={null}>
                {photos.map((photo, i) => (
                    <PhotoItem
                        key={photo.id}
                        url={photo.url}
                        description={photo.description}
                        date={photo.date}
                        index={i}
                        position={photoPositions[i % photoPositions.length] as [number, number, number]}
                        rotation={[0, 0, 0]}
                        scale={0.8}
                    />
                ))}
            </Suspense>
        </group>
    );
};

import { Suspense } from 'react';
export default Ornaments;
