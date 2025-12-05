import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Star: React.FC = () => {
    const meshRef = useRef<THREE.Mesh>(null);

    const starShape = React.useMemo(() => {
        const shape = new THREE.Shape();
        const outerRadius = 1.2;
        const innerRadius = 0.6;
        const points = 5;

        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points;
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
        depth: 0.1,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.001,
        bevelSegments: 2
    };

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.2;
        }
    });

    return (
        <group position={[0, 6.0, 0]}> {/* Lowered slightly to connect */}
            <mesh ref={meshRef} rotation={[0, 0, 0]}>
                <extrudeGeometry args={[starShape, extrudeSettings]} />
                <meshStandardMaterial
                    color="#FFD700"
                    emissive="#FFD700"
                    emissiveIntensity={2}
                    roughness={0.1}
                    metalness={1}
                />
            </mesh>
        </group>
    );
};

export default Star;
