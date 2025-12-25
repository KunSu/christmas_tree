import { create } from 'zustand';
import * as THREE from 'three';

export type GestureEvent = (
  | { type: 'TREE_CHAOS' }
  | { type: 'TREE_AGGREGATE' }
  | { type: 'PHOTO_ZOOM', photoIndex?: number }
  | { type: 'PHOTO_UNZOOM' }
  | { type: 'PHOTO_FLIP' }
  | { type: 'PHOTO_NEXT' }
  | { type: 'PHOTO_PREV' }
  | { type: 'PALM_MOVE', position: THREE.Vector3, rotation: THREE.Euler }
) & { timestamp: number };

interface HandData {
  landmarks: any[];
  worldLandmarks: any[];
  handedness: string;
  palmPos: THREE.Vector3;
  palmNormal: THREE.Vector3;
  pinchDist: number;
  isPinching: boolean;
  palmSpan: number;
  isFist: boolean;
  isOpen: boolean;
}

interface GestureState {
  hands: HandData[];
  debug: boolean;
  lastEvent: GestureEvent | null;
  history: { timestamp: number, event: GestureEvent }[];
  setHands: (hands: HandData[]) => void;
  dispatch: (event: Omit<GestureEvent, 'timestamp'>) => void;
  toggleDebug: () => void;
  config: {
    pinchThreshold: number;
    palmSpanOpenThreshold: number;
    palmSpanFistThreshold: number;
    swipeThreshold: number;
  };
}

export const useGestureStore = create<GestureState>((set, get) => ({
  hands: [],
  debug: true,
  lastEvent: null,
  history: [],
  config: {
    pinchThreshold: 0.05,
    palmSpanOpenThreshold: 0.1, // Relaxed from 0.12
    palmSpanFistThreshold: 0.08, // Increased from 0.04 to make fist easier to trigger
    swipeThreshold: 0.1,
  },
  setHands: (hands) => set({ hands }),
  dispatch: (event) => {
    const eventWithTimestamp = { ...event, timestamp: Date.now() } as GestureEvent;
    console.log('[Gesture Event]', eventWithTimestamp);
    set((state) => ({ 
      lastEvent: eventWithTimestamp,
      history: [...state.history.slice(-99), { timestamp: eventWithTimestamp.timestamp, event: eventWithTimestamp }] 
    }));
  },
  toggleDebug: () => set((state) => ({ debug: !state.debug })),
}));

