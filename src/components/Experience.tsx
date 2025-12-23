'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, useProgress } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import ChristmasTree from './ChristmasTree';
import { useStore } from '../store/useStore';
import { currentTheme } from '../config/theme';
import { useIsMobile } from '../hooks/useMobile';
import VideoOverlay from './VideoOverlay';
import LoadingScreen from './LoadingScreen';
import WebGLFallback from './WebGLFallback';
import { checkWebGLSupport, WebGLCapabilities } from '../utils/webglDetection';

const Experience: React.FC = () => {
    const toggleMode = useStore((state) => state.toggleMode);
    const isMobile = useIsMobile();
    const { active, progress } = useProgress();
    const [started, setStarted] = useState(false);
    const [webglStatus, setWebglStatus] = useState<'checking' | 'supported' | 'unsupported'>('checking');
    const [webglCapabilities, setWebglCapabilities] = useState<WebGLCapabilities | null>(null);

    // Check WebGL support on mount
    useEffect(() => {
        const capabilities = checkWebGLSupport();
        setWebglCapabilities(capabilities);
        setWebglStatus(capabilities.supported ? 'supported' : 'unsupported');

        // Log capabilities for debugging
        if (capabilities.supported) {
            console.log('WebGL capabilities:', {
                webgl2: capabilities.webgl2,
                renderer: capabilities.renderer,
                isLowEnd: capabilities.isLowEnd,
            });
        } else {
            console.warn('WebGL not supported on this device');
        }
    }, []);

    // Retry WebGL check
    const handleRetry = useCallback(() => {
        setWebglStatus('checking');
        setTimeout(() => {
            const capabilities = checkWebGLSupport();
            setWebglCapabilities(capabilities);
            setWebglStatus(capabilities.supported ? 'supported' : 'unsupported');
        }, 100);
    }, []);

    // Fade out loading screen only after initial assets are loaded
    useEffect(() => {
        if (!active && progress === 100) {
            // Small delay for smooth transition
            const timer = setTimeout(() => {
                setStarted(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [active, progress]);

    // Show fallback UI if WebGL is not supported
    if (webglStatus === 'unsupported') {
        return <WebGLFallback onRetry={handleRetry} />;
    }

    // Show loading while checking WebGL
    if (webglStatus === 'checking') {
        return <LoadingScreen started={false} />;
    }

    return (
        <div className="w-full h-screen relative">
            <LoadingScreen started={started} />

            <Canvas
                camera={{
                    position: isMobile ? [0, 2, 40] : [0, 4, 30],
                    fov: isMobile ? 50 : 45
                }}
                gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}
                dpr={webglCapabilities?.isLowEnd ? [1, 1] : [1, 2]}
            >
                <color attach="background" args={[currentTheme.background]} />

                <Suspense fallback={null}>
                    <Environment files={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/assets/environment/st_fagans_interior_1k.hdr`} />
                    <ChristmasTree isMobile={isMobile} />
                </Suspense>

                <EffectComposer>
                    <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} luminanceSmoothing={0.9} />
                </EffectComposer>

                <OrbitControls
                    enablePan={false}
                    enableZoom={true}
                    minDistance={isMobile ? 10 : 10}
                    maxDistance={isMobile ? 30 : 30}
                />
            </Canvas>

            {/* UI Overlay */}
            <div className={`absolute top-8 left-0 w-full flex flex-col items-center pointer-events-none gap-4 px-4 transition-opacity duration-1000 ${started ? 'opacity-100' : 'opacity-0'}`}>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center pointer-events-none break-words max-w-[90vw]"
                    style={{
                        background: `linear-gradient(135deg, ${currentTheme.heading.gradient.join(', ')})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        textShadow: `0 0 20px ${currentTheme.heading.shadow}`,
                        filter: `drop-shadow(0 2px 10px ${currentTheme.heading.glow})`,
                        animation: 'glow 2s ease-in-out infinite alternate'
                    }}>
                    Merry Christmas
                </h1>
                <button
                    onClick={toggleMode}
                    className="pointer-events-auto px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white font-light hover:bg-white/20 transition-all text-sm sm:text-base"
                >
                    Memories
                </button>
            </div>

            <style jsx>{`
                @keyframes glow {
                    from {
                        filter: drop-shadow(0 2px 10px ${currentTheme.heading.glow});
                    }
                    to {
                        filter: drop-shadow(0 2px 20px ${currentTheme.heading.shadow});
                    }
                }
            `}</style>
            <VideoOverlay />
        </div>
    );
};

import * as THREE from 'three';
export default Experience;
