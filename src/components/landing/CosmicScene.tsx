'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, Sparkles, ScrollControls, Scroll } from '@react-three/drei';
import * as THREE from 'three';

// Floating Particles Component
function FloatingParticles({ count = 100 }: { count?: number }) {
    const mesh = useRef<THREE.Points>(null);

    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

            // Purple to pink gradient
            const t = Math.random();
            colors[i * 3] = 0.55 + t * 0.37;     // R: 139-236
            colors[i * 3 + 1] = 0.36 - t * 0.08; // G: 92-72
            colors[i * 3 + 2] = 0.96 - t * 0.35; // B: 246-153
        }

        return { positions, colors };
    }, [count]);

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.rotation.y = state.clock.elapsedTime * 0.02;
            mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
        }
    });

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[particles.positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-color"
                    args={[particles.colors, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.05}
                vertexColors
                transparent
                opacity={0.8}
                sizeAttenuation
            />
        </points>
    );
}

// Nebula Cloud Component
function NebulaCloud({ position, color, scale = 1 }: {
    position: [number, number, number];
    color: string;
    scale?: number;
}) {
    const mesh = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.rotation.z = state.clock.elapsedTime * 0.05;
            mesh.current.scale.setScalar(scale + Math.sin(state.clock.elapsedTime * 0.5) * 0.1);
        }
    });

    return (
        <mesh ref={mesh} position={position}>
            <sphereGeometry args={[2, 32, 32]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={0.15}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

// Orbiting Planet Component
function OrbitingPlanet({
    radius,
    speed,
    size,
    color,
    emissive
}: {
    radius: number;
    speed: number;
    size: number;
    color: string;
    emissive?: string;
}) {
    const mesh = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (mesh.current) {
            const t = state.clock.elapsedTime * speed;
            mesh.current.position.x = Math.cos(t) * radius;
            mesh.current.position.z = Math.sin(t) * radius;
            mesh.current.position.y = Math.sin(t * 0.5) * (radius * 0.2);
            mesh.current.rotation.y = t;
        }
    });

    return (
        <mesh ref={mesh}>
            <sphereGeometry args={[size, 32, 32]} />
            <meshStandardMaterial
                color={color}
                emissive={emissive || color}
                emissiveIntensity={0.2}
                roughness={0.7}
                metalness={0.3}
            />
        </mesh>
    );
}

// Main 3D Scene
function Scene() {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.02;
        }
    });

    return (
        <>
            {/* Ambient and directional lighting */}
            <ambientLight intensity={0.2} />
            <directionalLight position={[10, 10, 5]} intensity={0.5} color="#8B5CF6" />
            <pointLight position={[-10, -10, -10]} intensity={0.3} color="#EC4899" />

            {/* Star field */}
            <Stars
                radius={100}
                depth={50}
                count={5000}
                factor={4}
                saturation={0}
                fade
                speed={1}
            />

            {/* Sparkles */}
            <Sparkles
                count={200}
                scale={15}
                size={2}
                speed={0.3}
                color="#8B5CF6"
            />

            <Sparkles
                count={100}
                scale={10}
                size={3}
                speed={0.2}
                color="#EC4899"
            />

            {/* Nebula clouds */}
            <NebulaCloud position={[-5, 2, -10]} color="#8B5CF6" scale={1.5} />
            <NebulaCloud position={[6, -3, -8]} color="#EC4899" scale={1.2} />
            <NebulaCloud position={[0, 5, -15]} color="#3B82F6" scale={2} />

            {/* Floating particles */}
            <FloatingParticles count={150} />

            {/* Orbiting planets */}
            <group ref={groupRef}>
                <OrbitingPlanet radius={8} speed={0.1} size={0.3} color="#8B5CF6" />
                <OrbitingPlanet radius={12} speed={0.07} size={0.4} color="#EC4899" />
                <OrbitingPlanet radius={15} speed={0.05} size={0.25} color="#3B82F6" />
            </group>

            {/* Central glow */}
            <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
                <mesh position={[0, 0, -5]}>
                    <sphereGeometry args={[0.5, 32, 32]} />
                    <meshBasicMaterial color="#EC4899" transparent opacity={0.3} />
                </mesh>
            </Float>
        </>
    );
}

// Scroll-driven scene wrapper
function ScrollScene({ children }: { children: React.ReactNode }) {
    return (
        <ScrollControls pages={5} damping={0.3}>
            <Scroll>
                <Scene />
            </Scroll>
            <Scroll html style={{ width: '100%' }}>
                {children}
            </Scroll>
        </ScrollControls>
    );
}

// Main exported component
export default function CosmicScene({ children }: { children?: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-0">
            <Canvas
                camera={{ position: [0, 0, 8], fov: 60 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'linear-gradient(to bottom, #0a0a1a, #0d0d20, #0a0a1a)' }}
            >
                {children ? (
                    <ScrollScene>{children}</ScrollScene>
                ) : (
                    <Scene />
                )}
            </Canvas>
        </div>
    );
}

// Simple background-only version (no scroll)
export function CosmicBackground() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            <Canvas
                camera={{ position: [0, 0, 8], fov: 60 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                <Scene />
            </Canvas>
        </div>
    );
}
