import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';
import { currentTheme } from '../config/theme';

const Star: React.FC = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const auraRef = useRef<THREE.Mesh>(null);
    const raysRef = useRef<THREE.Group>(null);

    // 5-pointed star shape
    const starShape = useMemo(() => {
        const shape = new THREE.Shape();
        const outerRadius = 0.5;
        const innerRadius = 0.2;
        const points = 5;

        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();
        return shape;
    }, []);

    const extrudeSettings = {
        steps: 1,
        depth: 0.15,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.02,
        bevelSegments: 3
    };

    useFrame((state, delta) => {
        const t = state.clock.elapsedTime;

        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.3;
        }

        if (auraRef.current) {
            auraRef.current.rotation.y -= delta * 0.1;
            const pulse = 1.3 + Math.sin(t * 1.5) * 0.1;
            auraRef.current.scale.setScalar(pulse);
        }

        if (raysRef.current) {
            raysRef.current.rotation.z += delta * 0.05;
        }
    });

    return (
        <group position={[0, 6.2, 0]}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                {/* Volumetric Light Rays */}
                <group ref={raysRef}>
                    {[...Array(8)].map((_, i) => (
                        <mesh key={i} rotation={[0, 0, (i * Math.PI) / 4]}>
                            {/* <planeGeometry args={[0.05, 4]} /> */}
                            <meshBasicMaterial
                                color="#FFD700"
                                transparent
                                opacity={0.15}
                                blending={THREE.AdditiveBlending}
                                side={THREE.DoubleSide}
                            />
                        </mesh>
                    ))}
                </group>

                {/* Main Star Body - Polished Gold/Crystal */}
                <mesh ref={meshRef}>
                    <extrudeGeometry args={[starShape, extrudeSettings]} />
                    <meshPhysicalMaterial
                        color={currentTheme.tree.star.main}
                        emissive={currentTheme.tree.star.emissive}
                        emissiveIntensity={1.5}
                        roughness={0.05}
                        metalness={0.8}
                        reflectivity={1}
                        clearcoat={1}
                        clearcoatRoughness={0.1}
                        transmission={0.2}
                        thickness={0.5}
                        attenuationColor={currentTheme.tree.star.main}
                    />
                </mesh>

                {/* Point Lights inside the star */}
                <pointLight
                    intensity={5}
                    distance={10}
                    color="#FFD700"
                    decay={2}
                />
                <pointLight
                    position={[0, 0, 0.5]}
                    intensity={1}
                    distance={5}
                    color="#FFFFFF"
                    decay={1}
                />
            </Float>
        </group>
    );
};

export default Star;
