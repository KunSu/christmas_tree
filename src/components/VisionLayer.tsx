'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { useGestureStore, GestureEvent } from '../store/useGestureStore';
import { useStore } from '../store/useStore';
import * as THREE from 'three';

const VisionLayer: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const requestRef = useRef<number>(null);
    const lastVideoTime = useRef(-1);

    const setHands = useGestureStore((state) => state.setHands);
    const dispatch = useGestureStore((state) => state.dispatch);
    const config = useGestureStore((state) => state.config);
    const debug = useGestureStore((state) => state.debug);
    const photoStatus = useStore((state) => state.photoStatus);

    // Gesture State Tracking for state transitions
    const prevPinchDist = useRef<number>(0);
    const swipeStartX = useRef<number | null>(null);
    const lastSwipeTime = useRef<number>(0);

    // Initialize MediaPipe
    useEffect(() => {
        const initMediaPipe = async () => {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            const handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 2
            });
            setLandmarker(handLandmarker);
        };
        initMediaPipe();

        return () => {
            if (landmarker) landmarker.close();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    // Camera Access
    const startCamera = async () => {
        if (!videoRef.current) return;
        console.log("Starting camera...");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 }
            });
            console.log("Camera stream obtained");
            
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play();
                setIsCameraActive(true);
                console.log("Camera active and playing");
            };
        } catch (err) {
            console.error("Camera access denied or error:", err);
        }
    };

    // Detection Loop
    const detect = useCallback(() => {
        if (videoRef.current && landmarker && videoRef.current.currentTime !== lastVideoTime.current) {
            lastVideoTime.current = videoRef.current.currentTime;
            const startTimeMs = performance.now();
            const results = landmarker.detectForVideo(videoRef.current, startTimeMs);
            processResults(results);
        }
        requestRef.current = requestAnimationFrame(detect);
    }, [landmarker]);

    useEffect(() => {
        if (isCameraActive) {
            requestRef.current = requestAnimationFrame(detect);
        }
    }, [isCameraActive, detect]);

    // Process MediaPipe results into internal HandData and dispatch events
    const processResults = (results: HandLandmarkerResult) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas && videoRef.current) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
        }

        const processedHands = results.landmarks.map((landmarks, index) => {
            const worldLandmarks = results.worldLandmarks[index];
            const handedness = results.handednesses[index][0].categoryName;

            // Draw Skeleton
            if (ctx && debug) {
                ctx.strokeStyle = index === 0 ? '#00ff00' : '#0000ff';
                ctx.lineWidth = 4;
                ctx.beginPath();
                // Wrist to MCPs
                const connections = [
                    [0, 1, 2, 3, 4], // Thumb
                    [0, 5, 6, 7, 8], // Index
                    [0, 9, 10, 11, 12], // Middle
                    [0, 13, 14, 15, 16], // Ring
                    [0, 17, 18, 19, 20], // Pinky
                    [5, 9, 13, 17] // Palm MCPs
                ];
                connections.forEach(conn => {
                    ctx.moveTo(landmarks[conn[0]].x * canvas.width, landmarks[conn[0]].y * canvas.height);
                    for (let i = 1; i < conn.length; i++) {
                        ctx.lineTo(landmarks[conn[i]].x * canvas.width, landmarks[conn[i]].y * canvas.height);
                    }
                });
                ctx.stroke();
            }

            // 1. Calculate Palm Stats
            // Wrist is 0, Index MCP is 5, Middle MCP is 9, Ring MCP is 13, Pinky MCP is 17
            const wrist = landmarks[0];
            const indexMCP = landmarks[5];
            const pinkyMCP = landmarks[17];

            // Palm Center (roughly)
            const palmPos = new THREE.Vector3(
                (wrist.x + indexMCP.x + pinkyMCP.x) / 3,
                (wrist.y + indexMCP.y + pinkyMCP.y) / 3,
                (wrist.z + indexMCP.z + pinkyMCP.z) / 3
            );

            // 2. Pinch Distance (Thumb Tip 4, Index Tip 8)
            const thumbTip = worldLandmarks[4];
            const indexTip = worldLandmarks[8];
            const pinchDist = Math.sqrt(
                Math.pow(thumbTip.x - indexTip.x, 2) +
                Math.pow(thumbTip.y - indexTip.y, 2) +
                Math.pow(thumbTip.z - indexTip.z, 2)
            );

            // 3. Palm Span (Thumb Tip 4 to Pinky Tip 20)
            const pinkyTip = worldLandmarks[20];
            const palmSpan = Math.sqrt(
                Math.pow(thumbTip.x - pinkyTip.x, 2) +
                Math.pow(thumbTip.y - pinkyTip.y, 2) +
                Math.pow(thumbTip.z - pinkyTip.z, 2)
            );

            // 4. Fist Detection (Distance from fingertips to palm base)
            const fingerTips = [8, 12, 16, 20];
            const avgTipDist = fingerTips.reduce((acc, tipIdx) => {
                const tip = worldLandmarks[tipIdx];
                // Middle of the palm (MCP joints)
                const palmCenter = worldLandmarks[9]; 
                return acc + Math.sqrt(
                    Math.pow(tip.x - palmCenter.x, 2) +
                    Math.pow(tip.y - palmCenter.y, 2) +
                    Math.pow(tip.z - palmCenter.z, 2)
                );
            }, 0) / 4;

            const isOpen = palmSpan > config.palmSpanOpenThreshold;
            const isFist = avgTipDist < config.palmSpanFistThreshold;

            if (ctx && debug && index === 0) {
                ctx.fillStyle = 'white';
                ctx.font = '16px monospace';
                ctx.fillText(`Pinch: ${pinchDist.toFixed(3)}`, 10, 20);
                ctx.fillText(`Span: ${palmSpan.toFixed(3)}`, 10, 40);
                ctx.fillText(`FistDist: ${avgTipDist.toFixed(3)}`, 10, 60);
                if (isOpen) ctx.fillText(`STATE: OPEN`, 10, 80);
                if (isFist) ctx.fillText(`STATE: FIST`, 10, 100);
            }

            return {
                landmarks,
                worldLandmarks,
                handedness,
                palmPos,
                palmNormal: new THREE.Vector3(0, 0, 1), // Placeholder
                pinchDist,
                isPinching: pinchDist < config.pinchThreshold,
                palmSpan,
                isFist,
                isOpen
            };
        });

        setHands(processedHands);

        // --- Gesture Event Mapping ---
        if (processedHands.length > 0) {
            const mainHand = processedHands[0];

            // P0: Tree Global State
            if (mainHand.isOpen) {
                dispatch({ type: 'TREE_CHAOS' });
            } else if (mainHand.isFist) {
                dispatch({ type: 'TREE_AGGREGATE' });
            }

            // --- Photo Gestures (Only detected when a photo is ZOOMED or FLIPPED) ---
            if (photoStatus !== 'IDLE') {
                // P1: Photo Zoom (Pinch logic)
                const currentPinch = mainHand.pinchDist;
                const pinchDelta = currentPinch - prevPinchDist.current;
                // Add a cooldown for zoom to prevent accidental camera-like jitter
                const now = performance.now();
                if (Math.abs(pinchDelta) > 0.002) {
                    if (pinchDelta > 0.01 && mainHand.pinchDist > config.pinchThreshold * 2.0) {
                        dispatch({ type: 'PHOTO_ZOOM' });
                    } else if (pinchDelta < -0.01 && mainHand.pinchDist < config.pinchThreshold) {
                        dispatch({ type: 'PHOTO_UNZOOM' });
                    }
                }
                prevPinchDist.current = currentPinch;

                // P2: Photo Navigation (Swipe)
                const indexTipX = mainHand.landmarks[8].x;
                const middleTipX = mainHand.landmarks[12].x;
                const isTwoFinger = Math.abs(indexTipX - middleTipX) < 0.05 && mainHand.landmarks[12].y < mainHand.landmarks[9].y; // Middle finger up

                if (swipeStartX.current === null) {
                    swipeStartX.current = indexTipX;
                } else {
                    const deltaX = indexTipX - swipeStartX.current;
                    const now = performance.now();
                    if (now - lastSwipeTime.current > 1000) { // Debounce swipe
                        if (Math.abs(deltaX) > config.swipeThreshold) {
                            if (isTwoFinger) {
                                // Two fingers: Next/Prev
                                if (deltaX > 0) dispatch({ type: 'PHOTO_PREV' });
                                else dispatch({ type: 'PHOTO_NEXT' });
                            } else {
                                // Single finger: Flip
                                dispatch({ type: 'PHOTO_FLIP' });
                            }
                            lastSwipeTime.current = now;
                            swipeStartX.current = null;
                        }
                    }
                }
            } else {
                // Reset tracking when idle
                swipeStartX.current = null;
                prevPinchDist.current = mainHand.pinchDist;
            }
        } else {
            swipeStartX.current = null;
        }
    };

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col items-end gap-2">
            {!isCameraActive && (
                <button
                    onClick={startCamera}
                    disabled={!landmarker}
                    className={`px-6 py-3 bg-red-600/80 hover:bg-red-500 text-white rounded-full font-bold shadow-lg backdrop-blur-md transition-all border border-white/20 pointer-events-auto ${!landmarker ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {landmarker ? '✨ Activate Hand Magic ✨' : '⌛ Loading Vision...'}
                </button>
            )}
            
            <div className={`relative rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl transition-opacity duration-500 ${isCameraActive && debug ? 'opacity-100' : 'opacity-0 pointer-events-none h-0'}`}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-48 h-36 object-cover scale-x-[-1]"
                />
                <canvas 
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none scale-x-[-1]"
                />
            </div>
        </div>
    );
};

export default VisionLayer;

