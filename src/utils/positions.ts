import * as THREE from 'three';
import { maath } from '@react-three/drei'; // Actually maath is separate, imported as 'maath' usually.
import * as random from 'maath/random/dist/maath-random.cjs';

// Helper to generate random positions in a sphere (Chaos)
export const generateChaosPositions = (count: number, radius: number = 15): Float32Array => {
    const positions = new Float32Array(count * 3);
    // @ts-ignore - maath types can be tricky
    random.inSphere(positions, { radius });
    return positions;
};

// Helper to generate positions in a cone shape (Formed Tree)
export const generateTreePositions = (count: number, height: number = 10, radius: number = 4): Float32Array => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;

        // Normalized height (0 at bottom, 1 at top)
        // We want more density at the bottom? Or uniform?
        // Let's try uniform distribution along height first
        const y = Math.random() * height;
        const normalizedY = y / height;

        // Radius at this height (cone tapers to 0 at top)
        const r = radius * (1 - normalizedY);

        // Random angle
        const theta = Math.random() * Math.PI * 2;

        // Random distance from center (volume filling) or surface?
        // "Foliage" implies volume but mostly surface. Let's do volume with bias towards surface.
        const dist = Math.sqrt(Math.random()) * r;

        const x = dist * Math.cos(theta);
        const z = dist * Math.sin(theta);

        // Center the tree vertically? Or base at 0?
        // Let's base at -height/2 to center it, or base at 0.
        // Scene camera is at [0, 4, 20]. Tree height 10.
        // If base is at -5, top is at 5.
        positions[i3] = x;
        positions[i3 + 1] = y - height / 2;
        positions[i3 + 2] = z;
    }
    return positions;
};
