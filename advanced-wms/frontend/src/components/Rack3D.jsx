import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';

const Rack3D = ({ data, itemCount, showHeatmap, isHighlighted, isDimmed }) => {
  const { width, height, depth, pos_x, pos_z, rotation, shelves, identifier } = data;

  // VISUAL LOGIC
  const rackColor = useMemo(() => {
    if (showHeatmap) {
       const capacity = (shelves ? shelves.length : 1) * 2; 
       const percentage = itemCount / capacity;
       if (percentage >= 0.8) return '#ff3333';
       if (percentage >= 0.4) return '#ffaa00';
       return '#00ff44';
    }
    // WAVE VISUALIZATION
    if (isHighlighted) return '#ffaa00'; // GOLD
    if (isDimmed) return '#111';         // DARK GRAY
    return 'gray';                       // Standard
  }, [showHeatmap, isHighlighted, isDimmed, itemCount, shelves]);

  const opacity = useMemo(() => {
    if (isDimmed) return 0.1; // Ghost mode
    if (showHeatmap) return 0.6;
    return 1.0;
  }, [isDimmed, showHeatmap]);

  return (
    <group position={[pos_x, height / 2, pos_z]} rotation={[0, rotation, 0]}>
      
      {/* FRAME */}
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
          color={rackColor} 
          wireframe={!showHeatmap && !isHighlighted} 
          transparent={showHeatmap || isDimmed} 
          opacity={opacity}
          emissive={isHighlighted ? '#ffaa00' : 'black'}
          emissiveIntensity={isHighlighted ? 0.8 : 0}
        />
      </mesh>

      {/* SHELVES (Hide if dimmed for cleaner look) */}
      {!isDimmed && !showHeatmap && shelves && shelves.map((shelf) => (
        <group key={shelf.id} position={[0, shelf.level_height - (height/2), 0]}>
           <mesh>
             <boxGeometry args={[width, 0.05, depth]} />
             <meshStandardMaterial color="#444" />
           </mesh>
           <Html position={[width/2, 0.1, 0]} transform scale={0.4} occlude>
             <div style={{fontSize: '4px', color: '#ccc', background: '#222', padding: '1px'}}>
               {shelf.identifier}
             </div>
           </Html>
        </group>
      ))}

      {/* LABEL */}
      {(!isDimmed || isHighlighted) && (
        <Html position={[0, height/2 + 0.5, 0]}>
          <div style={{ 
            color: 'white', 
            background: isHighlighted ? '#ffaa00' : 'black', 
            padding: '2px 5px', 
            borderRadius: '4px', 
            fontSize: '10px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            textShadow: 'none',
            boxShadow: isHighlighted ? '0 0 8px #ffaa00' : 'none'
          }}>
            {identifier}
          </div>
        </Html>
      )}
    </group>
  );
};

export default Rack3D;