import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { KundaliData } from '../types';

// Planet data: Relative sizes and colors (simplified)
const PLANET_DATA: Record<string, { size: number; color: string; speed: number; distance: number }> = {
    Sun: { size: 2.5, color: '#FDB813', speed: 0, distance: 0 },
    Moon: { size: 0.8, color: '#F4F6F0', speed: 0.5, distance: 4 },
    Mars: { size: 1.2, color: '#E27B58', speed: 0.3, distance: 7 },
    Mercury: { size: 1, color: '#E5E5E5', speed: 0.8, distance: 5 },
    Jupiter: { size: 2.2, color: '#90614D', speed: 0.1, distance: 10 },
    Venus: { size: 1.4, color: '#E39C46', speed: 0.4, distance: 6 },
    Saturn: { size: 2, color: '#C5AB6E', speed: 0.08, distance: 13 },
    Rahu: { size: 1.1, color: '#333333', speed: 0.05, distance: 15 },
    Ketu: { size: 1.1, color: '#444444', speed: 0.05, distance: 15 },
};

const Planet = ({ name, position, isActive, onClick }: { name: string; position: number; isActive: boolean; onClick: () => void }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const data = PLANET_DATA[name] || { size: 1, color: 'white', speed: 0.1, distance: 5 };

    // Calculate position based on "astrological" distance (simplified for visual) - in reality we'd uses degrees
    // Here we just place them in orbit for the "Planetarium" feel
    // We'll use the 'position' (degree) to set the angle
    const angle = (position * Math.PI) / 180;
    const x = Math.cos(angle) * data.distance;
    const z = Math.sin(angle) * data.distance;

    useFrame((_, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.5; // Spin the planet
        }
    });

    return (
        <group position={[x, 0, z]}>
            <mesh ref={meshRef} onClick={onClick}>
                <sphereGeometry args={[data.size * 0.3, 32, 32]} />
                <meshStandardMaterial
                    color={data.color}
                    emissive={isActive ? data.color : '#000000'}
                    emissiveIntensity={isActive ? 0.5 : 0}
                    roughness={0.7}
                />
            </mesh>
            {/* Orbit Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[data.distance - 0.05, data.distance + 0.05, 64]} />
                <meshBasicMaterial color="#ffffff" opacity={0.1} transparent side={THREE.DoubleSide} />
            </mesh>

            <Html distanceFactor={15}>
                <div className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${isActive ? 'bg-blue-600 text-white scale-110' : 'bg-black/50 text-gray-300'}`}>
                    {name}
                </div>
            </Html>
        </group>
    );
};

const SunMesh = () => {
    return (
        <group>
            <mesh>
                <sphereGeometry args={[1.2, 32, 32]} />
                <meshStandardMaterial color="#FDB813" emissive="#FDB813" emissiveIntensity={2} />
            </mesh>
            <pointLight intensity={2} distance={100} decay={2} color="#FDB813" />
        </group>
    )
}

export const CosmicView = ({ kundali }: { kundali: KundaliData }) => {
    const [activePlanet, setActivePlanet] = React.useState<string | null>(null);

    return (
        <div className="h-[400px] w-full bg-[#050510] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl relative group">
            <div className="absolute top-4 left-4 z-10">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <span className="text-2xl">🪐</span> 3D Cosmic Perspective
                </h3>
                <p className="text-xs text-slate-400">Drag to rotate • Scroll to zoom</p>
            </div>

            <Canvas camera={{ position: [0, 15, 20], fov: 45 }}>
                <ambientLight intensity={0.2} />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                {/* Core Sun */}
                <SunMesh />

                {/* Planets */}
                {kundali.planets.map((planet) => (
                    planet.name !== 'Sun' && (
                        <Planet
                            key={planet.name}
                            name={planet.name}
                            position={planet.degree + (planet.sign * 30)} // Approx absolute degree
                            isActive={activePlanet === planet.name}
                            onClick={() => setActivePlanet(planet.name)}
                        />
                    )
                ))}

                <OrbitControls
                    enablePan={false}
                    minDistance={5}
                    maxDistance={50}
                    autoRotate
                    autoRotateSpeed={0.5}
                />
            </Canvas>

            {/* Overlay Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 to-transparent" />
        </div>
    );
};
