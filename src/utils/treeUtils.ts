import * as THREE from 'three';
import * as random from 'maath/random/dist/maath-random.cjs';

// --- Constants ---
const LAYERS = 16;
const TREE_HEIGHT = 12;
const MAX_RADIUS = 4;

/**
 * Generates particles for the main tree body.
 * Creates a layered, "skirted" structure with drooping branches.
 */
export const generateTreeParticles = (count: number): Float32Array => {
    const positions = new Float32Array(count * 3);
    const particlesPerLayer = Math.floor(count / LAYERS);

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;

        // Randomly pick a layer, but favor bottom layers (lower indices) strongly
        // Using power > 1 pushes values towards 0 (bottom)
        const layerIndex = Math.min(Math.floor(Math.pow(Math.random(), 2.5) * LAYERS), LAYERS - 1);

        // Normalized progress (0 = bottom, 1 = top)
        const layerProgress = layerIndex / (LAYERS - 1);

        // Calculate base Y for this layer
        // We want the tree to be centered around Y=0 or slightly above
        const layerY = (layerProgress * TREE_HEIGHT) - (TREE_HEIGHT / 2);

        // Calculate Radius for this layer (Cone shape)
        // Bottom is wide, top is narrow.
        // Use a power function for a slightly curved cone profile
        const layerRadius = MAX_RADIUS * Math.pow(1 - layerProgress, 0.8);

        // --- Particle Distribution within Layer ---
        // We want a "volume" but concentrated at the edges (branches)
        // r = radius from center
        const rRandom = Math.random();
        // Square root distribution pushes points outwards (uniform area), 
        // but we want even more edge density, so maybe just rRandom?
        // Let's use sqrt(random) for uniform disk, then mix with edge bias.
        const r = layerRadius * Math.sqrt(rRandom);

        const theta = Math.random() * Math.PI * 2;

        // --- Droop Calculation ---
        // Particles further out should droop more.
        // Droop factor increases with radius.
        // Droop factor increases with radius.
        const droopFactor = layerRadius > 0.001 ? (r / layerRadius) : 0; // 0 at center, 1 at edge
        const droop = droopFactor * droopFactor * 1.5; // Quadratic droop, max 1.5 units

        // --- Volume/Thickness ---
        // Add some random thickness to the layer so it's not a flat sheet
        const thickness = (Math.random() - 0.5) * 0.8;

        const x = r * Math.cos(theta);
        const y = layerY - droop + thickness;
        const z = r * Math.sin(theta);

        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;
    }

    return positions;
};

/**
 * Generates positions using a Fibonacci spiral on a cone surface.
 * This ensures extremely even distribution with no clustering.
 * @param count Number of positions to generate
 * @param options Distribution options
 */
export const generateFibonacciSpiralPositions = (count: number, options: { radiusMin?: number, radiusMax?: number, yOffset?: number } = {}): Float32Array => {
    const { radiusMin = 0.9, radiusMax = 1.1, yOffset = 0 } = options;
    const positions = new Float32Array(count * 3);

    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;

        // Cumulative area distribution for a curved cone profile
        // Radius r(p) = R * (1-p)^0.8
        // Density is constant if progress p follows: p = 1 - (1 - i/count)^(1/(0.8 + 1))
        // We use i + 0.5 to avoid absolute top/bottom
        const t = (i + 0.5) / count;
        let layerProgress = 1 - Math.pow(1 - t, 1 / 1.8);

        // Avoid absolute tip
        if (layerProgress > 0.95) layerProgress = 0.95;

        const layerY = (layerProgress * TREE_HEIGHT) - (TREE_HEIGHT / 2) + yOffset;
        const baseRadius = MAX_RADIUS * Math.pow(1 - layerProgress, 0.8);

        // Radius with slight variation
        const r = baseRadius * (radiusMin + Math.random() * (radiusMax - radiusMin));

        const theta = i * goldenAngle;

        // Droop for hanging look
        const droop = 1.3 + (Math.random() - 0.5) * 0.4;

        positions[i3] = r * Math.cos(theta);
        positions[i3 + 1] = layerY - droop;
        positions[i3 + 2] = r * Math.sin(theta);
    }

    return positions;
};

/**
 * Generates positions for ornaments at the tips of the branches.
 * Ornaments are distributed in increasing quantities from top to bottom.
 */
export const generateOrnamentPositions = (count: number, options: { radiusMin?: number, radiusMax?: number } = {}): Float32Array => {
    // For large counts (balls, lights), the layered approach is fine and provides a specific density profile.
    // For smaller counts or when even distribution is critical (like photos), 
    // we could use Fibonacci, but here we'll stick to the layered logic for consistency
    // unless specifically requested to change all ornaments.

    const { radiusMin = 0.9, radiusMax = 1.1 } = options;
    const positions = new Float32Array(count * 3);

    // Calculate ornament count per layer (increasing from bottom to top)
    const MAX_TOP_LAYER_ORNAMENTS = 10;
    const topLayerCount = Math.min(MAX_TOP_LAYER_ORNAMENTS, Math.max(1, Math.floor(count * 0.01)));

    const remainingOrnaments = count - topLayerCount;
    const totalUnits = (LAYERS * (LAYERS + 1) / 2) - 1;
    const unitsPerOrnament = remainingOrnaments > 0 ? totalUnits / remainingOrnaments : 1;

    let currentOrnament = 0;

    for (let layerIndex = 0; layerIndex < LAYERS && currentOrnament < count; layerIndex++) {
        let layerProgress = layerIndex / (LAYERS - 1);
        if (layerProgress > 0.96) layerProgress = 0.96;

        let ornamentsInLayer: number;
        if (layerIndex === LAYERS - 1) {
            ornamentsInLayer = topLayerCount;
        } else {
            const layerUnits = LAYERS - layerIndex;
            ornamentsInLayer = Math.round(layerUnits / unitsPerOrnament);
        }

        const layerY = (layerProgress * TREE_HEIGHT) - (TREE_HEIGHT / 2);
        const layerRadius = MAX_RADIUS * Math.pow(1 - layerProgress, 0.8);

        for (let j = 0; j < ornamentsInLayer && currentOrnament < count; j++) {
            const i3 = currentOrnament * 3;
            const r = layerRadius * (radiusMin + Math.random() * (radiusMax - radiusMin));
            const angleStep = (Math.PI * 2) / ornamentsInLayer;
            const theta = j * angleStep + (Math.random() - 0.5) * angleStep * 0.5;
            const droop = 1.5;

            positions[i3] = r * Math.cos(theta);
            positions[i3 + 1] = layerY - droop + (Math.random() - 0.5) * 0.5;
            positions[i3 + 2] = r * Math.sin(theta);

            currentOrnament++;
        }
    }

    return positions;
};

/**
 * Generates spiral paths for garlands.
 */
export const generateGarlandParticles = (count: number): Float32Array => {
    const positions = new Float32Array(count * 3);
    const spirals = 4; // Number of spiral wraps

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;

        const t = i / count; // 0 to 1

        // Height goes from bottom to top
        const y = (t * TREE_HEIGHT) - (TREE_HEIGHT / 2) - 1.0; // Start slightly lower

        // Radius decreases as we go up
        const radius = (MAX_RADIUS + 0.5) * Math.pow(1 - t, 0.8);

        // Angle rotates
        const theta = t * Math.PI * 2 * spirals;

        const x = radius * Math.cos(theta);
        const z = radius * Math.sin(theta);

        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;
    }

    return positions;
};
