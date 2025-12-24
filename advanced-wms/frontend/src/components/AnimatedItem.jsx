import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const AnimatedItem = ({ item, racks, onClick }) => {
  const meshRef = useRef();
  
  // Calculate target position based on Rack + Shelf Level
  const getTargetPosition = () => {
    const parentRack = racks.find(r => r.id === item.rack);
    if (!parentRack) return new THREE.Vector3(0, 0, 0);

    const shelfHeight = parentRack.height / parentRack.shelves;
    const x = parentRack.pos_x + (item.position_on_shelf - (parentRack.width / 2) + (item.width / 2));
    const y = (item.shelf_level * shelfHeight) + (item.height / 2);
    const z = parentRack.pos_z;

    return new THREE.Vector3(x, y, z);
  };

  // State to track current visual position
  const [currentPos] = useState(getTargetPosition());
  const targetPos = getTargetPosition();

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Linear Interpolation (Lerp) for smooth movement
    // 5.0 is the speed factor.
    meshRef.current.position.lerp(targetPos, 5.0 * delta);
  });

  return (
    <mesh 
      ref={meshRef} 
      position={[currentPos.x, currentPos.y, currentPos.z]} 
      onClick={(e) => {
        e.stopPropagation();
        onClick(item);
      }}
    >
      <boxGeometry args={[item.width, item.height, item.depth]} />
      <meshStandardMaterial color={item.color} />
    </mesh>
  );
};

export default AnimatedItem;