'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { currentTheme } from '../config/theme';

interface LoadingScreenProps {
    started: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ started }) => {
    return (
        <AnimatePresence>
            {!started && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#001a13]"
                    style={{ background: currentTheme.background }}
                >
                    <motion.div
                        className="relative flex flex-col items-center gap-8"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        {/* Decorative Star/Snowflake */}
                        <motion.div
                            animate={{
                                rotate: 360,
                                scale: [1, 1.1, 1]
                            }}
                            transition={{
                                rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                            }}
                            className="w-16 h-16 flex items-center justify-center"
                        >
                            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-gold-500" style={{ color: currentTheme.tree.star.main }}>
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
                            </svg>
                        </motion.div>

                        <div className="flex flex-col items-center gap-2">
                            <motion.h2
                                className="text-2xl md:text-3xl font-light tracking-widest text-white/90 italic"
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                Preparing for Christmas...
                            </motion.h2>
                            <div className="w-48 h-[2px] bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Background sparkles/glow */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 blur-[120px] rounded-full" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LoadingScreen;
