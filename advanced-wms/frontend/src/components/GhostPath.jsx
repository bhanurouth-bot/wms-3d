// frontend/src/components/GhostPath.jsx
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

const GhostPath = ({ points }) => {
  // Convert simple arrays [x, y, z] into Vector3 objects for Three.js
  const path = useMemo(() => {
    if (!points || points.length < 2) return null;
    return points.map(p => new THREE.Vector3(p[0], 0.1, p[2])); // 0.1 Y to hover slightly above floor
  }, [points]);

  if (!path) return null;

  return (
    <Line
      points={path}       // Array of Vector3
      color="cyan"        // High contrast color
      lineWidth={3}       // Thick line
      dashed={true}       // Make it look "ghostly"
      dashScale={2}       // Dash size
      dashSize={1}        // Dash length
      gapSize={0.5}       // Gap length
      opacity={0.8}
      transparent
    />
  );
};

export default GhostPath;