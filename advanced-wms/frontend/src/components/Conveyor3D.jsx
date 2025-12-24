import React from 'react';

const Conveyor3D = ({ data }) => {
  const { start_x, start_z, end_x, end_z } = data;

  const length = Math.sqrt(Math.pow(end_x - start_x, 2) + Math.pow(end_z - start_z, 2));
  const midX = (start_x + end_x) / 2;
  const midZ = (start_z + end_z) / 2;
  const angle = Math.atan2(end_x - start_x, end_z - start_z);

  return (
    <group position={[midX, 0.2, midZ]} rotation={[0, angle, 0]}>
      <mesh>
        <boxGeometry args={[1, 0.2, length]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, 0.11, 0]}>
         <planeGeometry args={[0.8, length]} />
         <meshStandardMaterial color="#555" />
      </mesh>
    </group>
  );
};

export default Conveyor3D;