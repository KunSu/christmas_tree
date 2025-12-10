import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Star: React.FC = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);

    // Create an 8-pointed star shape
    const starShape = React.useMemo(() => {
        const shape = new THREE.Shape();
        const outerRadius = 0.4;
        const innerRadius = 0.2;
        const points = 8; // 8-pointed star

        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points - Math.PI / 2; // Start from top
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
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.2; // Rotate around vertical axis
        }
        if (glowRef.current) {
            glowRef.current.rotation.y += delta * 0.2; // Rotate around vertical axis
            // Pulse effect
            const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.3 + 1;
            glowRef.current.scale.setScalar(1.5 + pulse * 0.2);
        }
    });

    return (
        <group position={[0, 6.0, 0]}>
            {/* Outer glow layers */}
            <mesh ref={glowRef}>
                <extrudeGeometry args={[starShape, { ...extrudeSettings, depth: 0.01 }]} />
                <meshBasicMaterial
                    color="#FFE680"
                    transparent
                    opacity={0.4}
                />
            </mesh>

            {/* Main star body */}
            <mesh ref={meshRef}>
                <extrudeGeometry args={[starShape, extrudeSettings]} />
                <meshStandardMaterial
                    color="#FFFACD"
                    emissive="#FFD700"
                    emissiveIntensity={3}
                    roughness={0.1}
                    metalness={0.8}
                />
            </mesh>

            {/* Center golden circle */}
            <mesh position={[0, 0, 0.1]}>
                <circleGeometry args={[0.25, 32]} />
                <meshStandardMaterial
                    color="#FFD700"
                    emissive="#FFA500"
                    emissiveIntensity={2}
                    roughness={0.2}
                    metalness={1}
                />
            </mesh>

            {/* Point light for glow effect */}
            <pointLight
                position={[0, 0, 0]}
                color="#FFE680"
                intensity={2}
                distance={15}
                decay={2}
            />

            {/* Additional ambient glow */}
            <pointLight
                position={[0, 0, 0.5]}
                color="#FFFACD"
                intensity={1}
                distance={8}
                decay={2}
            />
        </group>
    );
};

export default Star;
