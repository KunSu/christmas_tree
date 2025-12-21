import React, { useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

const SnowflakeMaterial = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color('#A5F2F3'), // Ice blue
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    // Fragment Shader
    `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec2 vUv;

    // 2D rotation function
    vec2 rotate2D(vec2 _uv, float _angle){
        _uv -= 0.5;
        _uv =  mat2(cos(_angle),-sin(_angle),
                    sin(_angle),cos(_angle)) * _uv;
        _uv += 0.5;
        return _uv;
    }

    void main() {
        vec2 uv = vUv;
        vec2 center = uv - 0.5;
        float dist = length(center);
        float angle = atan(center.y, center.x);

        // Create a 6-fold symmetry
        float f = cos(angle * 6.0);
        
        // Create the snowflake shape
        // A mix of distance field and angular modulation
        float shape = smoothstep(0.4, 0.41, 0.15 / (dist + 0.1 * sin(angle * 6.0 + uTime)));
        
        // Add internal details
        float detail = smoothstep(0.02, 0.01, abs(dist - 0.2 - 0.1 * f));
        
        // Combine shape and detail
        float alpha = shape + detail;
        
        // Glow falloff
        float glow = 1.0 - smoothstep(0.0, 0.5, dist);
        
        // Final alpha with soft edges
        float finalAlpha = alpha * glow;
        
        // Discard outer edges
        if (dist > 0.5) discard;

        // Dynamic glow pulse
        float pulse = 0.8 + 0.2 * sin(uTime * 2.0);

        gl_FragColor = vec4(uColor * pulse * 2.0, finalAlpha);
    }
    `
);

extend({ SnowflakeMaterial });

declare global {
    namespace JSX {
        interface IntrinsicElements {
            snowflakeMaterial: any;
        }
    }
}

const Snowflake: React.FC = () => {
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state, delta) => {
        if (materialRef.current) {
            (materialRef.current as any).uTime = state.clock.elapsedTime;
        }
        if (meshRef.current) {
            meshRef.current.rotation.z += delta * 0.2; // Slow rotation
        }
    });

    return (
        <mesh ref={meshRef} position={[0, 6.5, 0]} scale={[2, 2, 1]}>
            <planeGeometry args={[1, 1]} />
            {/* @ts-expect-error - custom material */}
            <snowflakeMaterial ref={materialRef} transparent side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
    );
};

export default Snowflake;
