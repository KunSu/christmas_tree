'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

const VideoOverlay: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [readyToPlay, setReadyToPlay] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Handle video load errors gracefully
    const handleVideoError = useCallback(() => {
        console.warn('Video failed to load - music will not be available');
        setHasError(true);
    }, []);

    // Handle video loaded successfully
    const handleVideoLoaded = useCallback(() => {
        setIsLoaded(true);
    }, []);

    const toggleAudio = () => {
        if (!videoRef.current) return;

        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(error => {
                console.error("Audio play failed:", error);
            });
        }
    };

    useEffect(() => {
        const handleInteraction = () => {
            // Start the 3s timer after first interaction
            setTimeout(() => {
                setReadyToPlay(true);
            }, 3000);

            // Remove listeners immediately after first interaction
            cleanup();
        };

        const cleanup = () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('mousedown', handleInteraction);
            window.removeEventListener('pointerdown', handleInteraction);
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);
        window.addEventListener('keydown', handleInteraction);
        window.addEventListener('mousedown', handleInteraction);
        window.addEventListener('pointerdown', handleInteraction);

        return cleanup;
    }, []);

    useEffect(() => {
        if (!readyToPlay || !videoRef.current) return;

        const attemptPlay = () => {
            if (videoRef.current && !isPlaying) {
                videoRef.current.play()
                    .then(() => {
                        setIsPlaying(true);
                    })
                    .catch(() => {
                        console.log("Autoplay blocked, waiting for manual interaction.");
                    });
            }
        };

        // Try initial autoplay once when ready
        attemptPlay();
    }, [readyToPlay]);

    // Don't render audio controls if video failed to load
    if (hasError) {
        return null;
    }

    return (
        <>
            <video
                ref={videoRef}
                src="/christmas_tree/assets/merryChristmasMrLawrence.mp4"
                style={{ display: 'none' }}
                loop
                playsInline
                preload="auto"
                onError={handleVideoError}
                onLoadedData={handleVideoLoaded}
            />

            <div className={`fixed bottom-8 right-8 z-[110] flex items-center gap-4 pointer-events-none transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
                {/* Musical Symbol */}
                <div className="transition-all duration-700 opacity-100 translate-x-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`text-white/60 ${isPlaying ? 'animate-bounce' : ''}`}>
                        <path d="M9 18V5l12-2v13" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                    </svg>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleAudio();
                    }}
                    className="pointer-events-auto w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all active:scale-95 shadow-lg group relative"
                    aria-label={isPlaying ? "Pause music" : "Play music"}
                >
                    {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform translate-x-0.5">
                            <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                    )}

                    {/* Notification pulse if not playing yet and 3s passed */}
                    {readyToPlay && !isPlaying && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                        </span>
                    )}
                </button>
            </div>
        </>
    );
};

export default VideoOverlay;
