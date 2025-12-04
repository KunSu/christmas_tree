'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import ChristmasTree from './ChristmasTree';
import { useStore } from '../store/useStore';

const Experience: React.FC = () => {
    const toggleMode = useStore((state) => state.toggleMode);

    return (
        <div className="w-full h-screen relative">
            <Canvas
                camera={{ position: [0, 4, 20], fov: 45 }}
                gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}
                dpr={[1, 2]}
            >
                <color attach="background" args={['#001a13']} />

                <Suspense fallback={null}>
                    <Environment preset="lobby" />
                    <ChristmasTree />
                </Suspense>

                <EffectComposer>
                    <Bloom luminanceThreshold={0.8} mipmapBlur intensity={1.2} radius={0.4} />
                </EffectComposer>

                <OrbitControls enablePan={false} enableZoom={true} minDistance={10} maxDistance={30} />
            </Canvas>

            {/* UI Overlay */}
            <div className="absolute top-8 left-0 w-full flex justify-center pointer-events-none">
                <button
                    onClick={toggleMode}
                    className="pointer-events-auto px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white font-light hover:bg-white/20 transition-all"
                >
                    Toggle Mode
                </button>
            </div>
        </div>
    );
};

import * as THREE from 'three';
export default Experience;
