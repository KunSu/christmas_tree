import React, { useMemo, useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { generateTreeParticles, generateOrnamentPositions, generateGarlandParticles } from '../utils/treeUtils';
import { useStore } from '../store/useStore';
import { currentTheme } from '../config/theme';
import Ornaments from './Ornaments';
import Star from './Star';
import { IceLightMaterial } from '../materials/IceLightMaterial';

// --- Shaders ---

const TreeMaterial = shaderMaterial(
    {
        uTime: 0,
        uColor1: new THREE.Color(currentTheme.tree.foliage[0]), // Snow/White
        uColor2: new THREE.Color(currentTheme.tree.foliage[1]), // Ice Blue
        uColor3: new THREE.Color(currentTheme.tree.foliage[2]), // Pink
    },
    // Vertex Shader
    `
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    varying vec3 vColor;
    varying float vAlpha;

    // Pseudo-random function
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
        vec3 pos = position;

        // Wind Effect
        // Sway based on height (y) and time
        float sway = sin(uTime * 1.0 + pos.y * 0.5) * 0.1 * (pos.y + 10.0) * 0.05;
        pos.x += sway;
        pos.z += cos(uTime * 0.8 + pos.y * 0.5) * 0.1 * (pos.y + 10.0) * 0.05;

        // Twinkle / Breathing
        float breathe = sin(uTime * 2.0 + pos.y) * 0.02;
        pos += normal * breathe;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Size attenuation
        gl_PointSize = 80.0 * (1.0 / -mvPosition.z);

        // Color mixing based on position
        // Mix white/blue/pink based on height and random noise
        float noise = random(pos.xy);
        vColor = mix(uColor1, uColor2, pos.y / 20.0 + 0.5); // White to Blue
        if (noise > 0.7) {
             vColor = mix(vColor, uColor3, 0.5); // Add Pink
        }

        vAlpha = 0.6 + 0.4 * sin(uTime * 3.0 + noise * 10.0); // Twinkle alpha
    }
    `,
    // Fragment Shader
    `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
        // Soft circle
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;

        // Glow gradient
        float glow = 1.0 - (r * 2.0);
        glow = pow(glow, 2.0);

        gl_FragColor = vec4(vColor, vAlpha * glow);
    }
    `
);

const OrnamentMaterial = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color(currentTheme.tree.ornamentGlow),
    },
    `
    uniform float uTime;
    varying float vAlpha;
    
    void main() {
        vec3 pos = position;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = 150.0 * (1.0 / -mvPosition.z); // Larger
        vAlpha = 0.8 + 0.2 * sin(uTime * 5.0 + pos.x);
    }
    `,
    `
    uniform vec3 uColor;
    varying float vAlpha;
    void main() {
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        float glow = 1.0 - (r * 2.0);
        glow = pow(glow, 3.0);
        gl_FragColor = vec4(uColor, vAlpha * glow); 
    }
    `
);

const GarlandMaterial = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color(currentTheme.tree.garland),
    },
    `
    uniform float uTime;
    varying float vAlpha;
    void main() {
        vec3 pos = position;
        // Move along the spiral? No, just static points for now
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = 60.0 * (1.0 / -mvPosition.z);
        vAlpha = 0.5 + 0.5 * sin(uTime * 2.0 + pos.y);
    }
    `,
    `
    uniform vec3 uColor;
    varying float vAlpha;
    void main() {
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        float glow = 1.0 - (r * 2.0);
        gl_FragColor = vec4(uColor, vAlpha * glow); // Warm white
    }
    `
);



extend({ TreeMaterial, OrnamentMaterial, GarlandMaterial, IceLightMaterial });

// --- Component ---

interface ParticleTreeProps {
    isMobile?: boolean;
}

const ParticleTree: React.FC<ParticleTreeProps> = ({ isMobile = false }) => {
    const treeMatRef = useRef<THREE.ShaderMaterial>(null);
    const ornMatRef = useRef<THREE.ShaderMaterial>(null);
    const garMatRef = useRef<THREE.ShaderMaterial>(null);
    const iceMatRef = useRef<THREE.ShaderMaterial>(null);

    // Generate Geometries
    const treePositions = useMemo(() => generateTreeParticles(50000), [isMobile]);
    const ornamentPositions = useMemo(() => generateOrnamentPositions(150), [isMobile]);
    const garlandPositions = useMemo(() => generateGarlandParticles(1000), [isMobile]);

    useFrame((state) => {
        if (treeMatRef.current) (treeMatRef.current as any).uTime = state.clock.elapsedTime;
        if (ornMatRef.current) (ornMatRef.current as any).uTime = state.clock.elapsedTime;
        if (garMatRef.current) (garMatRef.current as any).uTime = state.clock.elapsedTime;
        if (iceMatRef.current) (iceMatRef.current as any).uTime = state.clock.elapsedTime;
    });

    return (
        <group>
            {/* Main Tree Foliage */}
            <points raycast={() => { }}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[treePositions, 3]}
                    />
                </bufferGeometry>
                {/* @ts-expect-error - custom material */}
                <treeMaterial ref={treeMatRef} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
            </points>

            {/* Ornaments (Particles) */}
            <points raycast={() => { }}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[ornamentPositions, 3]}
                    />
                </bufferGeometry>
                {/* @ts-expect-error - custom material */}
                <ornamentMaterial ref={ornMatRef} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
            </points>

            {/* Garlands */}
            <points raycast={() => { }}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[garlandPositions, 3]}
                    />
                </bufferGeometry>
                {/* @ts-expect-error - custom material */}
                <garlandMaterial ref={garMatRef} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
            </points>

            {/* Ice Blue Moving Lights Overlay */}
            <points raycast={() => { }}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[garlandPositions, 3]}
                    />
                </bufferGeometry>
                {/* @ts-expect-error - custom material */}
                <iceLightMaterial ref={iceMatRef} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
            </points>

            {/* 3D Ornaments & Photos */}
            <Ornaments isMobile={isMobile} />

            {/* Top Star */}
            <Star />
        </group>
    );
};

export default ParticleTree;
