import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface HoloCardProps {
    children: React.ReactNode;
    className?: string;
}

export const HoloCard = ({ children, className = '' }: HoloCardProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const ry = ((x - centerX) / centerX) * 10; // Max rotation deg
        const rx = ((y - centerY) / centerY) * -10;

        setRotateY(ry);
        setRotateX(rx);
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transformStyle: 'preserve-3d',
                perspective: 1000,
            }}
            animate={{
                rotateX,
                rotateY,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`relative group ${className}`}
        >
            <div
                style={{ transform: 'translateZ(20px)' }}
                className="pointer-events-none"
            >
                {children}
            </div>

            {/* Holographic Sheen */}
            <div
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{ transform: 'translateZ(1px)' }}
            />
        </motion.div>
    );
};
