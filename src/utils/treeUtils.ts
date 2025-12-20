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
 * Generates positions for ornaments at the tips of the branches.
 * Ornaments are distributed in increasing quantities from top to bottom.
 */
export const generateOrnamentPositions = (count: number, options: { radiusMin?: number, radiusMax?: number } = {}): Float32Array => {
    const { radiusMin = 0.9, radiusMax = 1.1 } = options;
    const positions = new Float32Array(count * 3);

    // Calculate ornament count per layer (increasing from bottom to top)
    // Note: layerIndex 0 = bottom, layerIndex (LAYERS-1) = top
    // Top layer is limited to max ornaments
    const MAX_TOP_LAYER_ORNAMENTS = 10;
    const topLayerCount = Math.min(MAX_TOP_LAYER_ORNAMENTS, Math.max(1, Math.floor(count * 0.01))); // At least 1, at most defined

    // Remaining ornaments to distribute across other layers
    const remainingOrnaments = count - topLayerCount;

    // Calculate distribution for remaining layers (bottom to near-top)
    // Using triangular distribution: bottom layers get more, top gets less
    const remainingLayers = LAYERS - 1;
    // Sum of units for layers 0 to LAYERS-2: (LAYERS) + (LAYERS-1) + ... + 2
    // This is sum from 2 to LAYERS, which is (LAYERS * (LAYERS + 1) / 2) - 1
    const totalUnits = (LAYERS * (LAYERS + 1) / 2) - 1;
    const unitsPerOrnament = remainingOrnaments > 0 ? totalUnits / remainingOrnaments : 1;

    let currentOrnament = 0;

    // Distribute ornaments across layers
    // Bottom (layerIndex=0) should have more, Top (layerIndex=LAYERS-1) should have less
    for (let layerIndex = 0; layerIndex < LAYERS && currentOrnament < count; layerIndex++) {
        let layerProgress = layerIndex / (LAYERS - 1);

        // Avoid zero radius at the absolute tip for ornaments (prevent z-fighting with star)
        if (layerProgress > 0.96) layerProgress = 0.96;

        // Number of ornaments in this layer
        let ornamentsInLayer: number;
        if (layerIndex === LAYERS - 1) {
            // Top layer: limited count
            ornamentsInLayer = topLayerCount;
        } else {
            // Other layers: decreasing distribution from bottom to top
            // Invert: bottom (layerIndex=0) gets LAYERS units, top-1 (layerIndex=LAYERS-2) gets 2 units
            const layerUnits = LAYERS - layerIndex; // LAYERS, LAYERS-1, ..., 2
            ornamentsInLayer = Math.round(layerUnits / unitsPerOrnament);
        }

        const layerY = (layerProgress * TREE_HEIGHT) - (TREE_HEIGHT / 2);
        const layerRadius = MAX_RADIUS * Math.pow(1 - layerProgress, 0.8);

        // Distribute ornaments evenly around this layer
        for (let j = 0; j < ornamentsInLayer && currentOrnament < count; j++) {
            const i3 = currentOrnament * 3;

            // Place at the very edge (tip) with slight variation
            const r = layerRadius * (radiusMin + Math.random() * (radiusMax - radiusMin));

            // Distribute evenly around the circle with some randomness
            const angleStep = (Math.PI * 2) / ornamentsInLayer;
            const theta = j * angleStep + (Math.random() - 0.5) * angleStep * 0.5;

            // Calculate droop for the tip
            const droop = 1.5; // Max droop at edge

            const x = r * Math.cos(theta);
            const y = layerY - droop + (Math.random() - 0.5) * 0.5;
            const z = r * Math.sin(theta);

            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;

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
