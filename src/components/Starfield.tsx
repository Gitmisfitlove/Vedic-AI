import { useEffect, useRef } from 'react';

export const Starfield = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        // --- Configuration ---
        const STAR_COUNT = 1500;
        const SHOOTING_STAR_CHANCE = 0.01; // Chance per frame

        // --- State ---
        const stars = Array.from({ length: STAR_COUNT }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            z: Math.random() * 2 + 0.5, // Depth factor
            size: Math.random() * 1.5,
            baseX: 0,
            baseY: 0,
            opacity: Math.random() * 0.5 + 0.3,
            twinkleSpeed: Math.random() * 0.05
        })).map(s => ({ ...s, baseX: s.x, baseY: s.y }));

        let shootingStars: { x: number, y: number, length: number, speed: number, angle: number, life: number }[] = [];

        // Solar Flares / Nebula blobs (slow moving background gradients)
        const flares = [
            { x: width * 0.2, y: height * 0.2, radius: 400, color: 'rgba(37, 99, 235, 0.05)', vx: 0.2, vy: 0.1 }, // Blueish
            { x: width * 0.8, y: height * 0.8, radius: 500, color: 'rgba(147, 51, 234, 0.03)', vx: -0.1, vy: -0.2 }, // Purpleish
            { x: width * 0.5, y: height * 0.5, radius: 600, color: 'rgba(56, 189, 248, 0.02)', vx: 0.1, vy: -0.1 }, // Cyanish
        ];

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);

        const animate = () => {
            // Clear with trail effect for shooting stars? 
            // Actually deep space usually needs clear redraw for crisp stars, but trails need accumulation.
            // We'll manage shooting star trails manually or just draw lines.

            ctx.fillStyle = '#020617'; // Base Deep Space
            ctx.fillRect(0, 0, width, height);

            // 1. Draw Flares (Background)
            flares.forEach(flare => {
                flare.x += flare.vx;
                flare.y += flare.vy;
                // Bounce off edges (loose bounds)
                if (flare.x < -200 || flare.x > width + 200) flare.vx *= -1;
                if (flare.y < -200 || flare.y > height + 200) flare.vy *= -1;

                const gradient = ctx.createRadialGradient(flare.x, flare.y, 0, flare.x, flare.y, flare.radius);
                gradient.addColorStop(0, flare.color);
                gradient.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            });

            // 2. Stars Logic
            stars.forEach(star => {
                // Black Hole / Lensing Interaction
                const dx = mouseRef.current.x - star.baseX;
                const dy = mouseRef.current.y - star.baseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const maxDist = 250;

                let x = star.baseX;
                let y = star.baseY;

                // Mouse Repulsion / Warp
                if (dist < maxDist) {
                    const force = (maxDist - dist) / maxDist;
                    const angle = Math.atan2(dy, dx);
                    const moveDist = Math.pow(force, 2) * 60 * star.z; // Depth affects movement
                    x += Math.cos(angle) * moveDist;
                    y += Math.sin(angle) * moveDist;
                }

                // Twinkle
                star.opacity += Math.sin(Date.now() * star.twinkleSpeed) * 0.005;

                ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, Math.min(1, star.opacity))})`;
                ctx.beginPath();
                // Depth affects size
                ctx.arc(x, y, star.size * (0.8 + star.z * 0.2), 0, Math.PI * 2);
                ctx.fill();
            });

            // 3. Shooting Stars Logic
            // Spawn?
            if (Math.random() < SHOOTING_STAR_CHANCE) {
                shootingStars.push({
                    x: Math.random() * width,
                    y: Math.random() * height * 0.5, // Start mostly top half
                    length: Math.random() * 80 + 20,
                    speed: Math.random() * 15 + 10,
                    angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1), // mostly diagonal down-right
                    life: 1.0
                });
            }

            // Update & Draw Shooting Stars
            for (let i = shootingStars.length - 1; i >= 0; i--) {
                const s = shootingStars[i];
                s.x += Math.cos(s.angle) * s.speed;
                s.y += Math.sin(s.angle) * s.speed;
                s.life -= 0.02;

                if (s.life <= 0 || s.x > width || s.y > height) {
                    shootingStars.splice(i, 1);
                    continue;
                }

                // Draw Trail
                const tailX = s.x - Math.cos(s.angle) * s.length;
                const tailY = s.y - Math.sin(s.angle) * s.length;

                const gradient = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${s.life})`);
                gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(tailX, tailY);
                ctx.stroke();

                // Head flare
                ctx.fillStyle = `rgba(255, 255, 255, ${s.life})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }

            requestAnimationFrame(animate);
        };

        const animationId = requestAnimationFrame(animate);

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};
