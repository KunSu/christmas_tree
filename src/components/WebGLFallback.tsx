'use client';

import React from 'react';

interface WebGLFallbackProps {
    onRetry?: () => void;
}

/**
 * Fallback UI shown when WebGL is not supported
 */
const WebGLFallback: React.FC<WebGLFallbackProps> = ({ onRetry }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-[#0a0a1a] to-[#1a0a2a] z-50">
            <div className="max-w-md mx-auto px-6 py-8 text-center">
                {/* Christmas Tree Emoji Fallback */}
                <div className="text-8xl mb-6 animate-pulse">🎄</div>

                <h1
                    className="text-3xl font-bold mb-4"
                    style={{
                        background: 'linear-gradient(135deg, #FFD700, #FFA500, #FF6B6B)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    Merry Christmas!
                </h1>

                <p className="text-white/70 mb-6 leading-relaxed">
                    您的浏览器不支持 WebGL 3D 渲染。
                    <br />
                    <span className="text-white/50 text-sm">
                        Your browser doesn&apos;t support WebGL 3D rendering.
                    </span>
                </p>

                <div className="space-y-3">
                    <p className="text-white/50 text-sm">
                        请尝试使用 Chrome 或 Safari 浏览器
                    </p>
                </div>

                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="mt-8 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
                    >
                        重试 / Retry
                    </button>
                )}

                {/* Decorative snowflakes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute text-white/20 animate-fall"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                fontSize: `${Math.random() * 16 + 8}px`,
                                animationDelay: `${Math.random() * 5}s`,
                                animationDuration: `${Math.random() * 3 + 5}s`,
                            }}
                        >
                            ❄
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
        </div>
    );
};

export default WebGLFallback;
