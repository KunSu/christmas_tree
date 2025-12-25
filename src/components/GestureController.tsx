'use client';

import React, { useEffect, useRef } from 'react';
import { useGestureStore } from '../store/useGestureStore';
import { useStore } from '../store/useStore';

const GestureController: React.FC = () => {
    const lastEvent = useGestureStore((state) => state.lastEvent);
    const lastProcessedTimestamp = useRef<number>(0);
    
    const setMode = useStore((state) => state.setMode);
    const setPhotoStatus = useStore((state) => state.setPhotoStatus);
    const nextPhoto = useStore((state) => state.nextPhoto);
    const prevPhoto = useStore((state) => state.prevPhoto);
    const selectedPhotoIndex = useStore((state) => state.selectedPhotoIndex);
    const setSelectedPhotoIndex = useStore((state) => state.setSelectedPhotoIndex);

    useEffect(() => {
        if (!lastEvent || lastEvent.timestamp === lastProcessedTimestamp.current) return;
        lastProcessedTimestamp.current = lastEvent.timestamp;

        switch (lastEvent.type) {
            case 'TREE_CHAOS':
                setMode('CHAOS');
                break;
            case 'TREE_AGGREGATE':
                setMode('AGGREGATED');
                break;
            case 'PHOTO_ZOOM':
                if (selectedPhotoIndex === null) {
                    // We can't easily find the nearest here without access to photo positions
                    // But we can trigger a selection in Ornaments.tsx or just default to 0
                    setSelectedPhotoIndex(0);
                } else {
                    setPhotoStatus('ZOOMED');
                }
                break;
            case 'PHOTO_UNZOOM':
                setPhotoStatus('IDLE');
                setSelectedPhotoIndex(null);
                break;
            case 'PHOTO_FLIP':
                setPhotoStatus('FLIPPED');
                break;
            case 'PHOTO_NEXT':
                nextPhoto();
                break;
            case 'PHOTO_PREV':
                prevPhoto();
                break;
        }
    }, [lastEvent, setMode, setPhotoStatus, nextPhoto, prevPhoto, selectedPhotoIndex, setSelectedPhotoIndex]);

    return null;
};

export default GestureController;

