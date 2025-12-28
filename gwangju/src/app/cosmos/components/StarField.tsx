'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

function MovingStars() {
    const ref = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta / 10;
            ref.current.rotation.y -= delta / 15;
        }
    });

    return (
        <group ref={ref}>
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Sparkles count={200} scale={12} size={2} speed={0.4} opacity={0.5} color="#8B5CF6" />
            <Sparkles count={100} scale={10} size={4} speed={0.2} opacity={0.3} color="#EC4899" />
        </group>
    );
}

export function StarField() {
    return (
        <div className="fixed inset-0 z-0 bg-black pointer-events-none">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <MovingStars />
            </Canvas>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black z-10" />
        </div>
    );
}
