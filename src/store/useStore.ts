import { create } from 'zustand';

export type AppMode = 'CHAOS' | 'FORMED';

interface AppState {
    mode: AppMode;
    setMode: (mode: AppMode) => void;
    toggleMode: () => void;
}

export const useStore = create<AppState>((set) => ({
    mode: 'FORMED',
    setMode: (mode) => set({ mode }),
    toggleMode: () => set((state) => ({ mode: state.mode === 'CHAOS' ? 'FORMED' : 'CHAOS' })),
}));
