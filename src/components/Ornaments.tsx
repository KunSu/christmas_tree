import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Image, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { generateChaosPositions, generateTreePositions } from '../utils/positions';

// Helper for instanced ornaments
const InstancedOrnaments = ({ count, color, scale, speedFactor, geometry }: any) => {
    const mode = useStore((state) => state.mode);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const chaosPositions = useMemo(() => generateChaosPositions(count, 25), [count]);
    const treePositions = useMemo(() => generateTreePositions(count, 9, 3.5), [count]);

    // Store current positions to interpolate
    const currentPositions = useMemo(() => {
        const arr = new Float32Array(count * 3);
        // Initialize with chaos
        chaosPositions.forEach((v, i) => arr[i] = v);
        return arr;
    }, [count, chaosPositions]);

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
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]} geometry={geometry}>
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
        </instancedMesh>
    );
};

// Photo Component
const PhotoItem = ({ url, position, rotation, scale, index }: any) => {
    const mode = useStore((state) => state.mode);
    const ref = useRef<THREE.Group>(null);
    const [hovered, setHover] = useState(false);
    const [active, setActive] = useState(false);
    useCursor(hovered);

    // Chaos position
    const chaosPos = useMemo(() => {
        const p = generateChaosPositions(1, 20);
        return new THREE.Vector3(p[0], p[1], p[2]);
    }, []);

    // Target position (on tree)
    const treePos = useMemo(() => new THREE.Vector3(...position), [position]);

    useFrame((state, delta) => {
        if (!ref.current) return;

        const target = mode === 'CHAOS' ? chaosPos : treePos;

        // Smooth movement
        ref.current.position.lerp(target, delta * 2);

        // Look at camera if active, otherwise normal rotation
        if (active) {
            ref.current.lookAt(state.camera.position);
        } else {
            // ref.current.rotation.set(rotation[0], rotation[1], rotation[2]);
            // Simple billboard or fixed rotation
            ref.current.lookAt(0, ref.current.position.y, 0); // Look at center trunk
            ref.current.rotateY(Math.PI); // Face outward

            // Add gentle floating/swaying
            ref.current.rotation.z = Math.sin(state.clock.elapsedTime + index) * 0.1;
        }

        // Scale animation
        const targetScale = active ? 2.5 : (hovered ? 1.2 : 1);
        ref.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 5);
    });

    const handleClick = (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        setActive(!active);
        // Here we should probably trigger a camera zoom or move
        // For now, just scale up the photo
    };

    // Reset active if mode changes to Chaos
    useEffect(() => {
        if (mode === 'CHAOS') setActive(false);
    }, [mode]);

    return (
        <group ref={ref} onClick={handleClick} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
            {/* Polaroid Frame */}
            <mesh position={[0, -0.1, -0.02]}>
                <boxGeometry args={[1.2, 1.4, 0.05]} />
                <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} side={THREE.DoubleSide} />
            </mesh>

            {/* Photo */}
            <mesh position={[0, 0, 0.01]}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial side={THREE.DoubleSide}>
                    <Image url={url} transparent />
                </meshBasicMaterial>
            </mesh>

            {/* Back of photo (optional, or just use DoubleSide on frame) */}
        </group>
    );
};

const Ornaments: React.FC = () => {
    const [photos, setPhotos] = useState<string[]>([]);

    useEffect(() => {
        fetch('/assets/photos/photos.json')
            .then(res => res.json())
            .then(data => setPhotos(data))
            .catch(err => console.error("Failed to load photos", err));
    }, []);

    const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 16, 16), []);
    const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

    // Generate fixed positions for photos on the tree
    const photoPositions = useMemo(() => {
        // Manually place them or use generator
        // Let's spiral them
        const pos = [];
        for (let i = 0; i < 10; i++) {
            const y = -4 + i * 1.5;
            const r = 4 * (1 - (y + 5) / 10) + 1; // Taper
            const theta = i * 2;
            const x = r * Math.cos(theta);
            const z = r * Math.sin(theta);
            pos.push([x, y, z]);
        }
        return pos;
    }, []);

    return (
        <group>
            {/* Red Balls - Heavy */}
            <InstancedOrnaments count={40} color="#ff3333" scale={0.3} speedFactor={0.5} geometry={sphereGeo} />

            {/* Gold Balls - Medium */}
            <InstancedOrnaments count={60} color="#FFD700" scale={0.25} speedFactor={0.8} geometry={sphereGeo} />

            {/* Lights - Light/Fast - Twinkling handled in shader/animation if possible, or just fast movement */}
            <InstancedOrnaments count={200} color="#ffffcc" scale={0.08} speedFactor={1.5} geometry={sphereGeo} />

            {/* Gifts - Cubes */}
            <InstancedOrnaments count={20} color="#0033cc" scale={0.4} speedFactor={0.3} geometry={boxGeo} />

            {/* Candy - Capsules (using Cylinder for now as Capsule is newer in Three/R3F types sometimes) */}
            <InstancedOrnaments count={30} color="#ff00ff" scale={0.2} speedFactor={0.6} geometry={new THREE.CylinderGeometry(0.5, 0.5, 2, 8)} />

            {/* Photos */}
            {photos.map((photo, i) => (
                <PhotoItem
                    key={`${photo}-${i}`}
                    url={`/assets/photos/${photo}`}
                    index={i}
                    position={photoPositions[i % photoPositions.length]}
                    rotation={[0, 0, 0]}
                    scale={1}
                />
            ))}
        </group>
    );
};

export default Ornaments;
