import React, { useMemo, useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { useStore } from '../store/useStore';
import { generateChaosPositions, generateTreePositions } from '../utils/positions';

// Custom Shader Material
const FoliageMaterial = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color('#005C45'),
        uProgress: 0, // 0 = Chaos, 1 = Formed
    },
    // Vertex Shader
    `
    uniform float uTime;
    uniform float uProgress;
    attribute vec3 aChaosPosition;
    attribute vec3 aTreePosition;
    varying float vAlpha;
    
    void main() {
      // Cubic ease in-out for smoother transition
      float t = uProgress < 0.5 ? 4.0 * uProgress * uProgress * uProgress : 1.0 - pow(-2.0 * uProgress + 2.0, 3.0) / 2.0;
      
      vec3 pos = mix(aChaosPosition, aTreePosition, t);
      
      // Add some wind/movement
      pos.x += sin(uTime * 2.0 + pos.y) * 0.05 * (1.0 - t); // More chaos movement
      pos.x += sin(uTime * 1.0 + pos.y) * 0.02 * t;       // Gentle tree sway
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = 100.0 * (1.0 / -mvPosition.z); // Size attenuation
      
      // Fade out slightly in chaos mode
      vAlpha = 0.8 + 0.2 * sin(uTime + pos.x);
    }
  `,
    // Fragment Shader
    `
    uniform vec3 uColor;
    varying float vAlpha;
    
    void main() {
      // Circular particle
      vec2 center = gl_PointCoord - 0.5;
      float dist = length(center);
      if (dist > 0.5) discard;
      
      // Gradient from center with glow
      float strength = 1.0 - (dist * 2.0);
      strength = pow(strength, 1.5);
      
      // Add extra glow at center
      strength += 0.5 * pow(1.0 - dist * 2.0, 3.0);
      
      gl_FragColor = vec4(uColor, vAlpha * strength);
    }
  `
);

extend({ FoliageMaterial });

// Add type definition for the custom material
declare global {
    namespace JSX {
        interface IntrinsicElements {
            foliageMaterial: any;
        }
    }
}

const Foliage: React.FC = () => {
    const mode = useStore((state) => state.mode);
    const materialRef = useRef<any>(null);

    const count = 45000; // Increased count for better look
    const chaosPositions = useMemo(() => generateChaosPositions(count, 20), []);
    const treePositions = useMemo(() => generateTreePositions(count, 12, 5), []);

    // Progress state for animation
    const progress = useRef(0);

    useFrame((state, delta) => {
        if (!materialRef.current) return;

        // Animate progress
        const target = mode === 'CHAOS' ? 0 : 1;
        progress.current = THREE.MathUtils.lerp(progress.current, target, delta * 1.5);

        materialRef.current.uTime = state.clock.elapsedTime;
        materialRef.current.uProgress = progress.current;
    });

    return (
        <points>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position" // This is actually ignored by the shader but needed for bounding box?
                    count={count}
                    array={chaosPositions} // Initial positions, doesn't matter much as we use custom attributes
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aChaosPosition"
                    count={count}
                    array={chaosPositions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aTreePosition"
                    count={count}
                    array={treePositions}
                    itemSize={3}
                />
            </bufferGeometry>
            {/* @ts-ignore */}
            <foliageMaterial ref={materialRef} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
    );
};

export default Foliage;
