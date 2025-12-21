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
    boxColor = '#ffb6c1',  // Light Pastel Pink
    ribbonColor = '#ff69b4', // Hot Pink / Satin Pink
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
                dummy.position.copy(pos).add(new THREE.Vector3(-0.25 * scale, 0.55 * scale, 0).applyEuler(rotation));
                dummy.rotation.copy(rotation);
                dummy.scale.setScalar(scale * 1.2); // Slightly larger for better detail
                dummy.updateMatrix();
                bowLeftRef.current.setMatrixAt(i, dummy.matrix);
            }

            // Update bow right loop
            if (bowRightRef.current) {
                dummy.position.copy(pos).add(new THREE.Vector3(0.25 * scale, 0.55 * scale, 0).applyEuler(rotation));
                dummy.rotation.copy(rotation);
                dummy.scale.setScalar(scale * 1.2);
                dummy.updateMatrix();
                bowRightRef.current.setMatrixAt(i, dummy.matrix);
            }

            // Update bow knot
            if (bowKnotRef.current) {
                dummy.position.copy(pos).add(new THREE.Vector3(0, 0.55 * scale, 0).applyEuler(rotation));
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

    // Helper to create a rounded box geometry for instancing
    const boxGeo = useMemo(() => {
        const width = 1, height = 1, depth = 1, radius = 0.1, smoothness = 8;
        const shape = new THREE.Shape();
        const eps = 0.00001;
        const radiusVal = radius - eps;

        shape.absarc(radiusVal, radiusVal, radiusVal, -Math.PI / 2, -Math.PI, true);
        shape.absarc(radiusVal, height - radiusVal, radiusVal, Math.PI, Math.PI / 2, true);
        shape.absarc(width - radiusVal, height - radiusVal, radiusVal, Math.PI / 2, 0, true);
        shape.absarc(width - radiusVal, radiusVal, radiusVal, 0, -Math.PI / 2, true);

        const geo = new THREE.ExtrudeGeometry(shape, {
            depth: depth - radius * 2,
            bevelEnabled: true,
            bevelSegments: smoothness * 2,
            steps: 1,
            bevelSize: radiusVal,
            bevelThickness: radius,
            curveSegments: smoothness
        });

        geo.center();
        return geo;
    }, []);

    const hRibbonGeo = useMemo(() => new THREE.BoxGeometry(1.02, 0.12, 0.14), []);
    const vRibbonGeo = useMemo(() => new THREE.BoxGeometry(0.14, 1.02, 0.12), []);

    const bowLoopGeo = useMemo(() => {
        // TorusKnot gives a more "fabric fold" look than a simple Torus
        const geo = new THREE.TorusKnotGeometry(0.12, 0.04, 64, 8, 2, 3);
        geo.rotateZ(Math.PI / 2);
        return geo;
    }, []);

    const bowKnotGeo = useMemo(() => new THREE.SphereGeometry(0.08, 24, 24), []);

    return (
        <group>
            {/* Main Gift Boxes (Matte Pastel Pink) */}
            <instancedMesh ref={boxRef} args={[boxGeo, undefined, count]} raycast={() => { }}>
                <meshStandardMaterial
                    color={boxColor}
                    roughness={0.85}
                    metalness={0.05}
                />
            </instancedMesh>

            {/* Horizontal Ribbons (Satin Pink) */}
            <instancedMesh ref={hRibbonRef} args={[hRibbonGeo, undefined, count]} raycast={() => { }}>
                <meshPhysicalMaterial
                    color={ribbonColor}
                    roughness={0.2}
                    metalness={0.4}
                    clearcoat={0.5}
                    clearcoatRoughness={0.1}
                    sheen={1}
                    sheenRoughness={0.5}
                    sheenColor={new THREE.Color('#ffffff')}
                />
            </instancedMesh>

            {/* Vertical Ribbons (Satin Pink) */}
            <instancedMesh ref={vRibbonRef} args={[vRibbonGeo, undefined, count]} raycast={() => { }}>
                <meshPhysicalMaterial
                    color={ribbonColor}
                    roughness={0.2}
                    metalness={0.4}
                    clearcoat={0.5}
                    clearcoatRoughness={0.1}
                    sheen={1}
                    sheenRoughness={0.5}
                    sheenColor={new THREE.Color('#ffffff')}
                />
            </instancedMesh>

            {/* Bow Left Loop (Satin Pink) */}
            <instancedMesh ref={bowLeftRef} args={[bowLoopGeo, undefined, count]} raycast={() => { }}>
                <meshPhysicalMaterial
                    color={ribbonColor}
                    roughness={0.2}
                    metalness={0.4}
                    clearcoat={0.5}
                    clearcoatRoughness={0.1}
                    sheen={1}
                    sheenRoughness={0.5}
                    sheenColor={new THREE.Color('#ffffff')}
                />
            </instancedMesh>

            {/* Bow Right Loop (Satin Pink) */}
            <instancedMesh ref={bowRightRef} args={[bowLoopGeo, undefined, count]} raycast={() => { }}>
                <meshPhysicalMaterial
                    color={ribbonColor}
                    roughness={0.2}
                    metalness={0.4}
                    clearcoat={0.5}
                    clearcoatRoughness={0.1}
                    sheen={1}
                    sheenRoughness={0.5}
                    sheenColor={new THREE.Color('#ffffff')}
                />
            </instancedMesh>

            {/* Bow Knot (Satin Pink) */}
            <instancedMesh ref={bowKnotRef} args={[bowKnotGeo, undefined, count]} raycast={() => { }}>
                <meshPhysicalMaterial
                    color={ribbonColor}
                    roughness={0.2}
                    metalness={0.4}
                    clearcoat={0.5}
                    clearcoatRoughness={0.1}
                    sheen={1}
                    sheenRoughness={0.5}
                    sheenColor={new THREE.Color('#ffffff')}
                />
            </instancedMesh>
        </group>
    );
};


export default InstancedGifts;
