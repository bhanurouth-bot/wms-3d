import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

const GhostPath = ({ points, color = "cyan" }) => {
  const path = useMemo(() => {
    if (!points || points.length < 2) return null;
    // Elevate slightly (0.2) so it doesn't clip through the floor
    return points.map(p => new THREE.Vector3(p[0], 0.2, p[2])); 
  }, [points]);

  if (!path) return null;

  return (
    <Line
      points={path}
      color={color}
      lineWidth={4} // Thicker line for visibility
      dashed={true}
      dashScale={1}
      dashSize={0.5}
      gapSize={0.2}
      opacity={1}
      transparent
    />
  );
};

export default GhostPath;