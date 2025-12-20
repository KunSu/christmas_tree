import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { generateChaosPositions } from '../utils/positions';
import { generateOrnamentPositions } from '../utils/treeUtils';

interface InstancedGiftsProps {
    count: number;
    boxColor?: string;
    ribbonColor?: string;
    scale: number;
    speedFactor: number;
    radiusMin?: number;
    radiusMax?: number;
}

/**
 * InstancedGifts - Renders multiple gift boxes with ribbons and bows efficiently
 * Uses instanced rendering for the box and ribbon parts separately
 */
const InstancedGifts: React.FC<InstancedGiftsProps> = ({
    count,
    boxColor = '#3bf73eff',  // Dark green
    ribbonColor = '#dc143c', // Crimson red
    scale,
    speedFactor,
    radiusMin,
    radiusMax
}) => {
    const mode = useStore((state) => state.mode);

    // Refs for each part
    const boxRef = useRef<THREE.InstancedMesh>(null);
    const hRibbonRef = useRef<THREE.InstancedMesh>(null);
    const vRibbonRef = useRef<THREE.InstancedMesh>(null);
    const bowLeftRef = useRef<THREE.InstancedMesh>(null);
    const bowRightRef = useRef<THREE.InstancedMesh>(null);
    const bowKnotRef = useRef<THREE.InstancedMesh>(null);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    const chaosPositions = useMemo(() => generateChaosPositions(count, 25), [count]);
    const treePositions = useMemo(() => generateOrnamentPositions(count, { radiusMin, radiusMax }), [count, radiusMin, radiusMax]);

    // Store current positions to interpolate
    const currentPositions = useMemo(() => {
        const arr = new Float32Array(count * 3);
        treePositions.forEach((v, i) => arr[i] = v);
        return arr;
    }, [count, treePositions]);

    useFrame((state, delta) => {
        const target = mode === 'CHAOS' ? chaosPositions : treePositions;
        const lerpSpeed = 2.0 * speedFactor * delta;

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            currentPositions[i3] = THREE.MathUtils.lerp(currentPositions[i3], target[i3], lerpSpeed);
            currentPositions[i3 + 1] = THREE.MathUtils.lerp(currentPositions[i3 + 1], target[i3 + 1], lerpSpeed);
            currentPositions[i3 + 2] = THREE.MathUtils.lerp(currentPositions[i3 + 2], target[i3 + 2], lerpSpeed);

            const pos = new THREE.Vector3(
                currentPositions[i3],
                currentPositions[i3 + 1],
                currentPositions[i3 + 2]
            );

            // Rotation
            const rotation = new THREE.Euler(
                Math.sin(state.clock.elapsedTime + i) * 0.3,
                Math.cos(state.clock.elapsedTime + i) * 0.3,
                0
            );

            // Update box
            if (boxRef.current) {
                dummy.position.copy(pos);
                dummy.rotation.copy(rotation);
                dummy.scale.setScalar(scale);
                dummy.updateMatrix();
                boxRef.current.setMatrixAt(i, dummy.matrix);
            }

            // Update horizontal ribbon
            if (hRibbonRef.current) {
                dummy.position.copy(pos);
                dummy.rotation.copy(rotation);
                dummy.scale.setScalar(scale);
                dummy.updateMatrix();
                hRibbonRef.current.setMatrixAt(i, dummy.matrix);
            }

            // Update vertical ribbon
            if (vRibbonRef.current) {
                dummy.position.copy(pos);
                dummy.rotation.copy(rotation);
                dummy.scale.setScalar(scale);
                dummy.updateMatrix();
                vRibbonRef.current.setMatrixAt(i, dummy.matrix);
            }

            // Update bow left loop
            if (bowLeftRef.current) {
                dummy.position.copy(pos);
                dummy.rotation.copy(rotation);
                dummy.scale.setScalar(scale);
                dummy.updateMatrix();
                bowLeftRef.current.setMatrixAt(i, dummy.matrix);
            }

            // Update bow right loop
            if (bowRightRef.current) {
                dummy.position.copy(pos);
                dummy.rotation.copy(rotation);
                dummy.scale.setScalar(scale);
                dummy.updateMatrix();
                bowRightRef.current.setMatrixAt(i, dummy.matrix);
            }

            // Update bow knot
            if (bowKnotRef.current) {
                dummy.position.copy(pos);
                dummy.rotation.copy(rotation);
                dummy.scale.setScalar(scale);
                dummy.updateMatrix();
                bowKnotRef.current.setMatrixAt(i, dummy.matrix);
            }
        }

        // Update all instance matrices
        if (boxRef.current) boxRef.current.instanceMatrix.needsUpdate = true;
        if (hRibbonRef.current) hRibbonRef.current.instanceMatrix.needsUpdate = true;
        if (vRibbonRef.current) vRibbonRef.current.instanceMatrix.needsUpdate = true;
        if (bowLeftRef.current) bowLeftRef.current.instanceMatrix.needsUpdate = true;
        if (bowRightRef.current) bowRightRef.current.instanceMatrix.needsUpdate = true;
        if (bowKnotRef.current) bowKnotRef.current.instanceMatrix.needsUpdate = true;
    });

    // Geometries
    const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
    const hRibbonGeo = useMemo(() => new THREE.BoxGeometry(1.05, 0.15, 0.15), []);
    const vRibbonGeo = useMemo(() => new THREE.BoxGeometry(0.15, 1.05, 0.15), []);
    const bowLoopGeo = useMemo(() => {
        const geo = new THREE.TorusGeometry(0.15, 0.05, 8, 12);
        geo.rotateZ(Math.PI / 2);
        return geo;
    }, []);
    const bowKnotGeo = useMemo(() => new THREE.SphereGeometry(0.08, 8, 8), []);

    return (
        <group>
            {/* Main Gift Boxes (Green) */}
            <instancedMesh ref={boxRef} args={[boxGeo, undefined, count]} raycast={() => { }}>
                <meshStandardMaterial color={boxColor} roughness={0.4} metalness={0.1} />
            </instancedMesh>

            {/* Horizontal Ribbons (Red) */}
            <instancedMesh ref={hRibbonRef} args={[hRibbonGeo, undefined, count]} raycast={() => { }}>
                <meshStandardMaterial color={ribbonColor} roughness={0.3} metalness={0.6} />
            </instancedMesh>

            {/* Vertical Ribbons (Red) */}
            <instancedMesh ref={vRibbonRef} args={[vRibbonGeo, undefined, count]} raycast={() => { }}>
                <meshStandardMaterial color={ribbonColor} roughness={0.3} metalness={0.6} />
            </instancedMesh>

            {/* Bow Left Loop (Red) */}
            <instancedMesh ref={bowLeftRef} args={[bowLoopGeo, undefined, count]} position={[-0.25, 0.55, 0]} raycast={() => { }}>
                <meshStandardMaterial color={ribbonColor} roughness={0.3} metalness={0.6} />
            </instancedMesh>

            {/* Bow Right Loop (Red) */}
            <instancedMesh ref={bowRightRef} args={[bowLoopGeo, undefined, count]} position={[0.25, 0.55, 0]} raycast={() => { }}>
                <meshStandardMaterial color={ribbonColor} roughness={0.3} metalness={0.6} />
            </instancedMesh>

            {/* Bow Knot (Red) */}
            <instancedMesh ref={bowKnotRef} args={[bowKnotGeo, undefined, count]} position={[0, 0.55, 0]} raycast={() => { }}>
                <meshStandardMaterial color={ribbonColor} roughness={0.3} metalness={0.6} />
            </instancedMesh>
        </group>
    );
};

export default InstancedGifts;
