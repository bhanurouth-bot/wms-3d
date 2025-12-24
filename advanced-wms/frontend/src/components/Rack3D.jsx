import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';

const Rack3D = ({ data, itemCount, showHeatmap }) => {
  const { width, height, depth, pos_x, pos_z, rotation, shelves, identifier } = data;
  const shelfHeight = height / shelves;

  const heatmapColor = useMemo(() => {
    const capacity = shelves * 4; 
    const percentage = itemCount / capacity;
    if (percentage >= 0.8) return '#ff3333';
    if (percentage >= 0.4) return '#ffaa00';
    return '#00ff44';
  }, [itemCount, shelves]);

  return (
    <group position={[pos_x, height / 2, pos_z]} rotation={[0, rotation, 0]}>
      {showHeatmap ? (
        <mesh>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial color={heatmapColor} transparent opacity={0.6} />
        </mesh>
      ) : (
        <>
          <mesh>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color="gray" wireframe />
          </mesh>
          {Array.from({ length: shelves }).map((_, i) => (
            <mesh key={i} position={[0, (i * shelfHeight) - (height / 2) + 0.1, 0]}>
              <boxGeometry args={[width, 0.05, depth]} />
              <meshStandardMaterial color="#444" />
            </mesh>
          ))}
        </>
      )}

      <Html position={[0, height/2 + 0.5, 0]}>
        <div style={{ 
          color: 'white', 
          background: showHeatmap ? heatmapColor : 'black', 
          padding: '2px 5px', 
          borderRadius: '4px', 
          fontSize: '10px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap'
        }}>
          {identifier} {showHeatmap && `(${itemCount})`}
        </div>
      </Html>
    </group>
  );
};

export default Rack3D;