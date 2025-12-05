import * as THREE from 'three';

import * as random from 'maath/random/dist/maath-random.cjs';

// Helper to generate random positions in a sphere (Chaos)
export const generateChaosPositions = (count: number, radius: number = 15): Float32Array => {
    const positions = new Float32Array(count * 3);
    // @ts-ignore - maath types can be tricky
    random.inSphere(positions, { radius });
    return positions;
};

// Helper to generate positions in layers (branches)
export const generateTreePositions = (count: number, height: number = 10, radius: number = 5.5, layers: number = 12): Float32Array => {
    const positions = new Float32Array(count * 3);
    const particlesPerLayer = Math.floor(count / layers);

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;

        // Determine which layer this particle belongs to
        const layerIndex = Math.floor(i / particlesPerLayer);
        // Normalized height of the layer (0 at bottom, 1 at top)
        // Add some randomness so layers aren't perfectly flat plates
        const layerProgress = layerIndex / layers; // 0 to 1

        // Height of this layer
        // Tree goes from -height/2 to height/2
        const layerY = (layerProgress * height) - (height / 2);

        // Radius of this layer (cone shape)
        const layerRadius = radius * (1 - layerProgress);

        // Distribute particles within the layer (disk/cone slice)
        // We want them to droop slightly at the edges for pine branch look
        const r = Math.sqrt(Math.random()) * layerRadius;
        const theta = Math.random() * Math.PI * 2;

        // Droop factor: more droop further out
        const droop = (r / layerRadius) * 0.8;

        // Add some vertical thickness to the layer
        const yVariation = (Math.random() - 0.5) * 1.0;

        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        const y = layerY - droop + yVariation;

        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;
    }
    return positions;
};

// Helper to generate hanging positions for ornaments (under the layers)
export const generateHangingPositions = (count: number, height: number = 10, radius: number = 5.5, layers: number = 12): Float32Array => {
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;

        // Pick a random layer
        const layerIndex = Math.floor(Math.random() * layers);
        const layerProgress = layerIndex / layers;
        const layerY = (layerProgress * height) - (height / 2);
        const layerRadius = radius * (1 - layerProgress);

        // Place near the edge of the layer, but slightly underneath
        // Random radius between 95% and 100% of layer radius (Outer Edge for better visibility)
        const r = layerRadius * (0.95 + Math.random() * 0.05);
        const theta = Math.random() * Math.PI * 2;

        // Droop calculation from tree positions
        const droop = (r / layerRadius) * 0.8;

        // Hang slightly below the droop point
        const hangDrop = 0.3 + Math.random() * 0.6;

        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        const y = layerY - droop - hangDrop;

        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;
    }
    return positions;
};

// Helper to generate progressive hanging positions (more decorations at bottom layers)
export const generateProgressiveHangingPositions = (count: number, height: number = 10, radius: number = 5.5, layers: number = 12): Float32Array => {
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;

        // Progressive distribution: weight towards lower layers
        // Use a quadratic distribution (more at bottom)
        const random = Math.random();
        const weightedRandom = Math.pow(random, 0.9); // Square root makes lower values more common
        const layerIndex = weightedRandom * layers;

        const layerProgress = layerIndex / layers;
        const layerY = (layerProgress * height) - (height / 2);
        const layerRadius = radius * (1 - layerProgress);

        // Place at the outer edge for maximum visibility (95-100% of layer radius)
        const r = layerRadius * (0.95 + Math.random() * 0.05);
        const theta = Math.random() * Math.PI * 2;

        // Droop calculation from tree positions
        const droop = (r / layerRadius) * 0.8;

        // Hang slightly below the droop point
        const hangDrop = 0.3 + Math.random() * 0.6;

        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        const y = layerY - droop - hangDrop;

        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;
    }
    return positions;
};
