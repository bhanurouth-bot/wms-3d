import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';

const Rack3D = ({ data, itemCount, showHeatmap }) => {
  // Destructure shelves from data
  const { width, height, depth, pos_x, pos_z, rotation, shelves, identifier } = data;

  const heatmapColor = useMemo(() => {
    // Capacity = shelves count * approx 2 items per shelf
    const capacity = (shelves ? shelves.length : 1) * 2; 
    const percentage = itemCount / capacity;
    if (percentage >= 0.8) return '#ff3333';
    if (percentage >= 0.4) return '#ffaa00';
    return '#00ff44';
  }, [itemCount, shelves]);

  return (
    <group position={[pos_x, height / 2, pos_z]} rotation={[0, rotation, 0]}>
      
      {/* 1. Main Rack Frame */}
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
          color={showHeatmap ? heatmapColor : "gray"} 
          wireframe={!showHeatmap} 
          transparent={showHeatmap} 
          opacity={0.6} 
        />
      </mesh>

      {/* 2. Physical Shelves (Rendered based on DB data) */}
      {!showHeatmap && shelves && shelves.map((shelf) => (
        <group key={shelf.id} position={[0, shelf.level_height - (height/2), 0]}>
           <mesh>
             <boxGeometry args={[width, 0.05, depth]} />
             <meshStandardMaterial color="#444" />
           </mesh>
           {/* Micro Label for Shelf ID */}
           <Html position={[width/2, 0.1, 0]} transform scale={0.4} occlude>
             <div style={{fontSize: '4px', color: '#ccc', background: '#222', padding: '1px'}}>
               {shelf.identifier}
             </div>
           </Html>
        </group>
      ))}

      {/* 3. Main Label */}
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