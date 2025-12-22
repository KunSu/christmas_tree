/**
 * WebGL compatibility detection utilities
 * Provides fallback detection for environments where WebGL may not be available
 */

export interface WebGLCapabilities {
    supported: boolean;
    webgl2: boolean;
    maxTextureSize: number;
    renderer: string;
    vendor: string;
    isLowEnd: boolean;
}

/**
 * Check if WebGL is supported and gather capability info
 */
export function checkWebGLSupport(): WebGLCapabilities {
    const defaultResult: WebGLCapabilities = {
        supported: false,
        webgl2: false,
        maxTextureSize: 0,
        renderer: 'unknown',
        vendor: 'unknown',
        isLowEnd: true,
    };

    if (typeof window === 'undefined') {
        return defaultResult;
    }

    try {
        const canvas = document.createElement('canvas');

        // Try WebGL2 first
        let gl: WebGLRenderingContext | WebGL2RenderingContext | null =
            canvas.getContext('webgl2') as WebGL2RenderingContext;
        const webgl2 = !!gl;

        // Fall back to WebGL1
        if (!gl) {
            gl = canvas.getContext('webgl') as WebGLRenderingContext ||
                canvas.getContext('experimental-webgl') as WebGLRenderingContext;
        }

        if (!gl) {
            return defaultResult;
        }

        // Get debug info
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = debugInfo
            ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
            : 'unknown';
        const vendor = debugInfo
            ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
            : 'unknown';

        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;

        // Detect low-end devices
        const isLowEnd = detectLowEndDevice(renderer, maxTextureSize);

        return {
            supported: true,
            webgl2,
            maxTextureSize,
            renderer,
            vendor,
            isLowEnd,
        };
    } catch (e) {
        console.warn('WebGL detection failed:', e);
        return defaultResult;
    }
}

/**
 * Detect if the device is low-end based on various signals
 */
function detectLowEndDevice(renderer: string, maxTextureSize: number): boolean {
    // Check hardware concurrency (CPU cores)
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 4;
    if (cores && cores < 4) return true;

    // Check device memory (Chrome only)
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (deviceMemory && deviceMemory < 4) return true;

    // Check max texture size - lower values indicate less capable GPUs
    if (maxTextureSize < 8192) return true;

    // Check for known low-end GPU patterns
    const lowEndPatterns = [
        /Mali-4/i,
        /Mali-T6/i,
        /Adreno\s*(3|4)/i,
        /PowerVR\s*SGX/i,
        /Intel.*HD\s*Graphics\s*(3|4|5)00/i,
        /SwiftShader/i, // Software renderer
    ];

    for (const pattern of lowEndPatterns) {
        if (pattern.test(renderer)) return true;
    }

    return false;
}

/**
 * Get recommended particle count based on device capabilities
 */
export function getRecommendedParticleCount(
    baseCount: number,
    capabilities: WebGLCapabilities
): number {
    if (!capabilities.supported) return 0;

    // Mobile detection
    const isMobile = typeof navigator !== 'undefined' &&
        /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (capabilities.isLowEnd) {
        return Math.floor(baseCount * 0.2); // 20% for low-end
    }

    if (isMobile) {
        return Math.floor(baseCount * 0.5); // 50% for mobile
    }

    if (!capabilities.webgl2) {
        return Math.floor(baseCount * 0.7); // 70% for WebGL1 only
    }

    return baseCount; // Full count for capable devices
}
