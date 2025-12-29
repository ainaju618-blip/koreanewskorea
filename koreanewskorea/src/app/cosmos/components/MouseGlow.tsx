'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

interface MousePosition {
    x: number;
    y: number;
}

export function MouseGlow() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Use motion values for smooth animation
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Spring animation for smooth following
    const springConfig = { damping: 25, stiffness: 150 };
    const x = useSpring(mouseX, springConfig);
    const y = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
            setIsVisible(true);
        };

        const handleMouseLeave = () => {
            setIsVisible(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [mouseX, mouseY]);

    return (
        <div ref={containerRef} className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
            {/* Main glow - purple/pink gradient */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    x,
                    y,
                    width: 400,
                    height: 400,
                    marginLeft: -200,
                    marginTop: -200,
                    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.08) 40%, transparent 70%)',
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                }}
            />

            {/* Inner bright core */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    x,
                    y,
                    width: 150,
                    height: 150,
                    marginLeft: -75,
                    marginTop: -75,
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(168, 85, 247, 0.15) 50%, transparent 70%)',
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                }}
            />

            {/* Outer soft glow */}
            <motion.div
                className="absolute rounded-full blur-xl"
                style={{
                    x,
                    y,
                    width: 600,
                    height: 600,
                    marginLeft: -300,
                    marginTop: -300,
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 60%)',
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.5s ease',
                }}
            />
        </div>
    );
}
