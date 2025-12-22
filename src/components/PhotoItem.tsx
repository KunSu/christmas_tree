import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { Image, useCursor, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { currentTheme } from '../config/theme';
import { generateChaosPositions } from '../utils/positions';

interface PhotoItemProps {
    url: string;
    description?: string;
    date?: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
    index: number;
}

const PhotoItem: React.FC<PhotoItemProps> = ({ url, description, date, position, rotation, scale, index }) => {
    const { camera } = useThree();
    const mode = useStore((state) => state.mode);
    const ref = useRef<THREE.Group>(null);
    const [hovered, setHover] = useState(false);

    // Interaction Status: IDLE -> ZOOMED -> FLIPPED
    const [status, setStatus] = useState<'IDLE' | 'ZOOMED' | 'FLIPPED'>('IDLE');

    // Track if click originated from this photo to prevent global listener interference
    const clickedFromPhoto = useRef(false);

    useCursor(hovered && status === 'IDLE');

    // Chaos position
    const chaosPos = useMemo(() => {
        const p = generateChaosPositions(1, 10);
        return new THREE.Vector3(p[0], p[1], p[2]);
    }, []);

    // Target position (on tree)
    const treePos = useMemo(() => new THREE.Vector3(...position), [position]);

    // Scratch objects for animation to avoid GC
    const scratch = useMemo(() => ({
        targetPos: new THREE.Vector3(),
        targetScale: new THREE.Vector3(),
        camDir: new THREE.Vector3(),
        lookAtPos: new THREE.Vector3(),
        dummyObj: new THREE.Object3D(),
        targetQ: new THREE.Quaternion(),
        currentQ: new THREE.Quaternion()
    }), []);

    useFrame((state, delta) => {
        if (!ref.current) return;

        const { targetPos, targetScale, camDir, lookAtPos, dummyObj, targetQ, currentQ } = scratch;

        if (status === 'IDLE') {
            // --- IDLE STATE ---
            const basePos = mode === 'CHAOS' ? chaosPos : treePos;
            targetPos.copy(basePos);

            // Scale (apply base scale prop)
            const s = (hovered ? 1.4 : 1) * scale;
            targetScale.set(s, s, s);

            // Rotation
            lookAtPos.set(0, basePos.y, 0);

            // Calculate IDLE rotation using dummy
            dummyObj.position.copy(basePos);
            dummyObj.lookAt(lookAtPos);
            dummyObj.rotateY(Math.PI); // Face outward
            dummyObj.rotation.z += Math.sin(state.clock.elapsedTime + index) * 0.1;

            targetQ.copy(dummyObj.quaternion);

        } else {
            // --- ZOOMED / FLIPPED STATE ---
            // Position: In front of camera (World Space)
            camera.getWorldDirection(camDir);
            // Place 5 units in front of camera
            const targetWorldPos = scratch.targetPos.copy(camera.position).add(camDir.multiplyScalar(5));

            // Convert World Position to Local Position
            // We need to do this because the parent (Tree) might be rotating
            if (ref.current && ref.current.parent) {
                ref.current.parent.worldToLocal(targetWorldPos);
            }

            // Scale: Calculate to fill half screen height (with base scale applied)
            const fovRad = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
            const dist = 5;
            const heightAtDist = 2 * dist * Math.tan(fovRad / 2);
            const s = heightAtDist * 0.4 * scale; // 40% of screen height, scaled by base scale
            targetScale.set(s, s, s);

            // Rotation: Face camera
            // We need to calculate the rotation in local space that makes it look at the camera
            // Or simpler: just lookAt camera in world space, then convert quaternion to local?
            // Actually, lookAt works in local space but expects a target in local space if parent is rotated?
            // No, Object3D.lookAt(vector) assumes the vector is in world space.
            // BUT, it updates the local rotation to point at that world position.
            // So dummyObj.lookAt(camera.position) *should* work if dummyObj is in the scene hierarchy?
            // No, dummyObj is a standalone object.

            // Correct approach for rotation:
            // 1. Place dummy at the target LOCAL position.
            // 2. We want it to face the camera.
            // 3. If we use dummy.lookAt(camera.position), it sets dummy's local rotation assuming dummy's parent is world (identity).
            //    But our actual object has a rotated parent.
            //    So we need to compensate for parent rotation.

            // Easier way:
            // Use a dummy attached to the scene (world) to get the world quaternion we want.
            // Then convert that world quaternion to local quaternion.

            // World Quaternion we want:
            // Face the camera (billboard)
            scratch.dummyObj.position.set(0, 0, 0); // Position doesn't matter for rotation calculation if we just want "face camera" direction?
            // Actually position matters for lookAt.
            // Let's use a dummy that is NOT parented (World space).
            // We want the object at `targetWorldPos` (calculated before worldToLocal) to look at `camera.position`.

            // Re-calculate world pos for rotation calculation (since we mutated targetPos to local above)
            const worldPosForRot = scratch.lookAtPos.copy(camera.position).add(camDir.multiplyScalar(5)); // Re-compute world pos

            scratch.dummyObj.position.copy(worldPosForRot);
            scratch.dummyObj.lookAt(camera.position);
            if (status === 'FLIPPED') {
                scratch.dummyObj.rotateY(Math.PI);
            }

            // Now scratch.dummyObj.quaternion is the WORLD rotation we want.
            // We need to convert this to LOCAL rotation for ref.current.
            // localQ = parentWorldQ_inverse * desiredWorldQ

            if (ref.current && ref.current.parent) {
                const parentQ = ref.current.parent.getWorldQuaternion(scratch.currentQ); // Reuse currentQ as temp
                const parentInv = parentQ.invert();
                targetQ.copy(parentInv.multiply(scratch.dummyObj.quaternion));
            } else {
                targetQ.copy(scratch.dummyObj.quaternion);
            }
        }

        // Apply Lerps
        // If we are ZOOMED/FLIPPED and close to target, snap to it to avoid lag when moving camera
        const isZoomed = status === 'ZOOMED' || status === 'FLIPPED';
        const dist = ref.current.position.distanceTo(targetPos);
        const angleDist = ref.current.quaternion.angleTo(targetQ);

        // Thresholds for "arrived"
        const posThreshold = 0.1;
        const rotThreshold = 0.05;

        if (isZoomed && dist < posThreshold && angleDist < rotThreshold) {
            // Lock to camera
            ref.current.position.copy(targetPos);
            ref.current.quaternion.copy(targetQ);
            ref.current.scale.lerp(targetScale, delta * 10); // Scale can still lerp fast
        } else {
            // Transitioning or Idle
            const speed = isZoomed ? 6 : 4; // Faster lerp when zooming in
            ref.current.position.lerp(targetPos, delta * speed);
            ref.current.scale.lerp(targetScale, delta * speed);
            ref.current.quaternion.slerp(targetQ, delta * speed);
        }
    });

    const handleClick = () => {
        clickedFromPhoto.current = true;
        if (status === 'IDLE') {
            setStatus('ZOOMED');
        } else if (status === 'ZOOMED') {
            setStatus('FLIPPED');
        } else if (status === 'FLIPPED') {
            setStatus('ZOOMED');
        }
    };

    // Click outside listener to close
    useEffect(() => {
        if (status === 'IDLE') return;

        const handleGlobalClick = () => {
            // Skip if the click originated from the photo itself
            if (clickedFromPhoto.current) {
                clickedFromPhoto.current = false;
                return;
            }
            setStatus('IDLE');
        };
        // Use a slight delay to avoid immediate closure if click propagates
        const timer = setTimeout(() => {
            window.addEventListener('click', handleGlobalClick);
        }, 10);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('click', handleGlobalClick);
        };
    }, [status]);

    return (
        <>
            {status !== 'IDLE' && (
                <mesh
                    position={[camera.position.x, camera.position.y, camera.position.z]}
                    onClick={(e) => { e.stopPropagation(); setStatus('IDLE'); }}
                    visible={false}
                >
                    <sphereGeometry args={[100, 16, 16]} />
                    <meshBasicMaterial side={THREE.BackSide} />
                </mesh>
            )}

            <group
                ref={ref}
                position={position}
                renderOrder={10}
                onClick={(e) => { e.stopPropagation(); handleClick(); }}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
            >

                {/* Polaroid Frame */}
                <mesh position={[0, -0.05, -0.02]}>
                    <boxGeometry args={[1.2, 1.6, 0.05]} />
                    <meshStandardMaterial color={currentTheme.photo.frame} roughness={0.2} metalness={0.1} side={THREE.DoubleSide} />
                </mesh>

                {/* Photo */}
                <Image
                    url={url}
                    position={[0, 0.05, 0.01]}
                    scale={[1.1, 1.3]}
                    transparent
                />

                {/* Date on Front */}
                {date && (
                    <Text
                        position={[0, -0.7, 0.02]}
                        fontSize={0.1}
                        color={currentTheme.photo.text}
                        anchorX="center"
                        anchorY="middle"
                    >
                        {date}
                    </Text>
                )}

                {/* Back of Photo (Message) */}
                <mesh position={[0, 0, -0.051]} rotation={[0, Math.PI, 0]}>
                    <planeGeometry args={[1, 1]} />
                    <meshStandardMaterial color={currentTheme.photo.back} />
                    {description && (
                        <Text
                            position={[0, 0, 0.01]}
                            fontSize={0.08}
                            color={currentTheme.photo.text}
                            maxWidth={0.8}
                            textAlign="center"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {description}
                        </Text>
                    )}
                </mesh>
            </group>
        </>
    );
};

export default PhotoItem;
