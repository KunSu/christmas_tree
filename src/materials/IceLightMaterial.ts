import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { currentTheme } from '../config/theme';

export const IceLightMaterial = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color(currentTheme.tree.iceLight), // Ice Blue
    },
    // Vertex Shader
    `
    uniform float uTime;
    varying float vAlpha;
    void main() {
        vec3 pos = position;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Increase size significantly to look like a surrounding orb/glow
        // Increased from 300.0 to 600.0 for larger "crystal" look
        gl_PointSize = 600.0 * (1.0 / -mvPosition.z);
        
        // Animation: Move from bottom to top (Spiral)
        // Map y from approx -7 to +5 to 0..1
        float h = (pos.y + 7.0) / 12.0;
        
        // Upward moving wave
        // Cycle speed - Slowed down from 0.3 to 0.15
        float t = uTime * 0.15;
        
        // Create a concentrated "orb" effect
        // The wave moves up as t increases
        float phase = fract(t - h); 
        
        // Make the trail much shorter and sharper (0.15 instead of 0.25)
        // This concentrates the light into a "ball" shape
        float brightness = smoothstep(0.15, 0.0, phase);
        
        // Add a secondary pulse for shimmering
        float shimmer = 0.8 + 0.2 * sin(uTime * 10.0 + pos.x * 5.0);
        
        vAlpha = brightness * shimmer;
    }
    `,
    // Fragment Shader
    `
    uniform vec3 uColor;
    varying float vAlpha;
    void main() {
        // Distance from center of the point
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        
        // Creating a "Sphere" / "Crystal" look
        
        // 1. Hot white core (sharp)
        float core1 = smoothstep(0.1, 0.05, r);
        
        // 2. Inner bright glow (soft)
        float core2 = smoothstep(0.3, 0.0, r);
        
        // 3. Outer halo (very soft)
        float halo = 1.0 - (r * 2.0);
        halo = pow(halo, 2.0); // Fixed typo from .0 to 2.0 for proper soft glow
        
        // Mix colors: Center is white, edges are Ice Blue
        vec3 finalColor = mix(uColor, vec3(1.0), core1 * 0.8 + core2 * 0.4);
        
        // Combine alpha
        // If vAlpha (from vertex shader) is low, the whole thing fades
        float finalAlpha = vAlpha * (halo + core2);
        
        gl_FragColor = vec4(finalColor, finalAlpha);
    }
    `
);
