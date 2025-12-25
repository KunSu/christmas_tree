import { create } from 'zustand';

export type AppMode = 'CHAOS' | 'AGGREGATED';
export type PhotoStatus = 'IDLE' | 'ZOOMED' | 'FLIPPED';

interface AppState {
    mode: AppMode;
    selectedPhotoIndex: number | null;
    photoStatus: PhotoStatus;
    
    // Tree Manipulation
    treePosition: [number, number, number];
    treeRotation: [number, number, number];

    setMode: (mode: AppMode) => void;
    toggleMode: () => void;
    setSelectedPhotoIndex: (index: number | null) => void;
    setPhotoStatus: (status: PhotoStatus) => void;
    setTreeTransform: (position: [number, number, number], rotation: [number, number, number]) => void;
    
    nextPhoto: () => void;
    prevPhoto: () => void;
}

export const useStore = create<AppState>((set) => ({
    mode: 'AGGREGATED',
    selectedPhotoIndex: null,
    photoStatus: 'IDLE',
    treePosition: [0, 0, 0],
    treeRotation: [0, 0, 0],

    setMode: (mode) => set({ mode }),
    toggleMode: () => set((state) => ({ mode: state.mode === 'CHAOS' ? 'AGGREGATED' : 'CHAOS' })),
    
    setSelectedPhotoIndex: (index) => set({ 
        selectedPhotoIndex: index,
        photoStatus: index !== null ? 'ZOOMED' : 'IDLE'
    }),
    
    setPhotoStatus: (status) => set({ photoStatus: status }),
    
    setTreeTransform: (position, rotation) => set({ treePosition: position, treeRotation: rotation }),

    nextPhoto: () => set((state) => {
        if (state.selectedPhotoIndex === null) return { selectedPhotoIndex: 0, photoStatus: 'ZOOMED' };
        // We don't know the total count here easily without importing data, 
        // but we can handle it in the component or pass it in.
        // For now, just increment and we'll wrap it in the component.
        return { selectedPhotoIndex: state.selectedPhotoIndex + 1 };
    }),

    prevPhoto: () => set((state) => {
        if (state.selectedPhotoIndex === null) return { selectedPhotoIndex: 0, photoStatus: 'ZOOMED' };
        return { selectedPhotoIndex: Math.max(0, state.selectedPhotoIndex - 1) };
    }),
}));
