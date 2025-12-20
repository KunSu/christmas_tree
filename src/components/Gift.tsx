import React, { useMemo } from 'react';
import * as THREE from 'three';

import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

interface GiftProps {
    boxColor?: string;
    ribbonColor?: string;
}

/**
 * Gift component - Creates a 3D present box with cross-shaped ribbon and bow
 * Uses green box and red ribbon by default (as per reference image)
 */
export const Gift: React.FC<GiftProps> = ({
    boxColor = '#2d5f2e', // Dark green
    ribbonColor = '#dc143c'  // Crimson red
}) => {
    return (
        <group>
            {/* Main Gift Box (Green) */}
            <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={boxColor} roughness={0.4} metalness={0.1} />
            </mesh>

            {/* Horizontal Ribbon (Red) */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1.05, 0.15, 0.15]} />
                <meshStandardMaterial color={ribbonColor} roughness={0.3} metalness={0.6} />
            </mesh>

            {/* Vertical Ribbon (Red) */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.15, 1.05, 0.15]} />
                <meshStandardMaterial color={ribbonColor} roughness={0.3} metalness={0.6} />
            </mesh>

            {/* Ribbon crossing on front/back sides */}
            <mesh position={[0, 0, 0.5]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.15, 1.05, 0.05]} />
                <meshStandardMaterial color={ribbonColor} roughness={0.3} metalness={0.6} />
            </mesh>
            <mesh position={[0, 0, -0.5]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.15, 1.05, 0.05]} />
                <meshStandardMaterial color={ribbonColor} roughness={0.3} metalness={0.6} />
            </mesh>

            {/* Bow on Top - Made from torus shapes */}
            {/* Left loop */}
            <mesh position={[-0.25, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.15, 0.05, 8, 12]} />
                <meshStandardMaterial color={ribbonColor} roughness={0.3} metalness={0.6} />
            </mesh>

            {/* Right loop */}
            <mesh position={[0.25, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.15, 0.05, 8, 12]} />
                <meshStandardMaterial color={ribbonColor} roughness={0.3} metalness={0.6} />
            </mesh>

            {/* Center knot */}
            <mesh position={[0, 0.55, 0]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshStandardMaterial color={ribbonColor} roughness={0.3} metalness={0.6} />
            </mesh>

            {/* Ribbon tails (optional, hanging down) */}
            <mesh position={[-0.15, 0.4, 0.15]} rotation={[0.3, 0, -0.3]}>
                <boxGeometry args={[0.08, 0.3, 0.03]} />
                <meshStandardMaterial color={ribbonColor} roughness={0.3} metalness={0.6} />
            </mesh>
            <mesh position={[0.15, 0.4, 0.15]} rotation={[0.3, 0, 0.3]}>
                <boxGeometry args={[0.08, 0.3, 0.03]} />
                <meshStandardMaterial color={ribbonColor} roughness={0.3} metalness={0.6} />
            </mesh>
        </group>
    );
};

/**
 * Creates a merged geometry for instancing gifts
 * This is more performant than rendering each gift individually
 */
export const createGiftGeometry = (): THREE.BufferGeometry => {
    const geometries: THREE.BufferGeometry[] = [];

    // Main box
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    geometries.push(boxGeo);

    // Horizontal ribbon
    const hRibbonGeo = new THREE.BoxGeometry(1.05, 0.15, 0.15);
    geometries.push(hRibbonGeo);

    // Vertical ribbon
    const vRibbonGeo = new THREE.BoxGeometry(0.15, 1.05, 0.15);
    geometries.push(vRibbonGeo);

    // Front ribbon
    const fRibbonGeo = new THREE.BoxGeometry(0.15, 1.05, 0.05);
    fRibbonGeo.translate(0, 0, 0.5);
    geometries.push(fRibbonGeo);

    // Back ribbon
    const bRibbonGeo = new THREE.BoxGeometry(0.15, 1.05, 0.05);
    bRibbonGeo.translate(0, 0, -0.5);
    geometries.push(bRibbonGeo);

    // Bow - left loop
    const leftLoopGeo = new THREE.TorusGeometry(0.15, 0.05, 8, 12);
    leftLoopGeo.rotateZ(Math.PI / 2);
    leftLoopGeo.translate(-0.25, 0.55, 0);
    geometries.push(leftLoopGeo);

    // Bow - right loop
    const rightLoopGeo = new THREE.TorusGeometry(0.15, 0.05, 8, 12);
    rightLoopGeo.rotateZ(Math.PI / 2);
    rightLoopGeo.translate(0.25, 0.55, 0);
    geometries.push(rightLoopGeo);

    // Bow - center knot
    const knotGeo = new THREE.SphereGeometry(0.08, 8, 8);
    knotGeo.translate(0, 0.55, 0);
    geometries.push(knotGeo);

    // Ribbon tails
    const leftTailGeo = new THREE.BoxGeometry(0.08, 0.3, 0.03);
    leftTailGeo.rotateY(0);
    leftTailGeo.rotateZ(-0.3);
    leftTailGeo.rotateX(0.3);
    leftTailGeo.translate(-0.15, 0.4, 0.15);
    geometries.push(leftTailGeo);

    const rightTailGeo = new THREE.BoxGeometry(0.08, 0.3, 0.03);
    rightTailGeo.rotateZ(0.3);
    rightTailGeo.rotateX(0.3);
    rightTailGeo.translate(0.15, 0.4, 0.15);
    geometries.push(rightTailGeo);

    // Merge all geometries
    // Note: We'll create a custom material setup in the component
    return BufferGeometryUtils.mergeGeometries(geometries);
};

export default Gift;
