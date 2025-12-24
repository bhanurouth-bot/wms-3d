import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const AnimatedItem = ({ item, allRacks, onClick }) => {
  const meshRef = useRef();
  
  // Calculate Target Position based on Rack + Shelf Height
  const getTargetPosition = () => {
    // 1. Find the Rack this item belongs to
    // (We use item.rack_id because of the serializer update)
    const parentRack = allRacks.find(r => r.id === item.rack_id);
    if (!parentRack) return new THREE.Vector3(0, 0, 0);

    // 2. Find the Specific Shelf inside that Rack
    const parentShelf = parentRack.shelves.find(s => s.id === item.shelf);
    
    // Default Y if shelf not found (fallback)
    let y = 0.5; 
    if (parentShelf) {
      y = parentShelf.level_height + (item.height / 2);
    }

    // 3. X/Z Calculation (Standard)
    const x = parentRack.pos_x + (item.position_on_shelf - (parentRack.width / 2) + (item.width / 2));
    const z = parentRack.pos_z;

    return new THREE.Vector3(x, y, z);
  };

  const targetPos = useMemo(() => getTargetPosition(), [item, allRacks]);
  
  // Initialize position to target so they don't fly in from 0,0,0 on load
  const [currentPos] = useState(targetPos);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    // Smooth Lerp
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