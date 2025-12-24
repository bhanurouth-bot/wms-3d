import React, { useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Grid } from '@react-three/drei';
import axios from 'axios';
import * as THREE from 'three';

import Rack3D from './components/Rack3D';
import Conveyor3D from './components/Conveyor3D';
import AnimatedItem from './components/AnimatedItem';
import GhostPath from './components/GhostPath';
import Sidebar from './components/Sidebar';
import FPVController from './components/FPVController';

// Helper to fly camera to search target
const CameraFlyTo = ({ targetPos, onFinish }) => {
  const { camera, controls } = useThree();
  useFrame((state, delta) => {
    if (!targetPos) return;
    const desiredPos = new THREE.Vector3(targetPos.x + 5, targetPos.y + 5, targetPos.z + 5);
    camera.position.lerp(desiredPos, 3.0 * delta);
    if (controls) {
      controls.target.lerp(targetPos, 3.0 * delta);
      controls.update();
    }
    if (camera.position.distanceTo(desiredPos) < 0.5) onFinish();
  });
  return null;
};

function App() {
  const [warehouseData, setWarehouseData] = useState(null);
  const [items, setItems] = useState([]);
  const [activePath, setActivePath] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isFPV, setIsFPV] = useState(false);
  const [cameraTarget, setCameraTarget] = useState(null);

  // FETCH DATA
  const fetchData = () => {
    // 1. Fetch Warehouse (Nested Aisles -> Racks)
    axios.get('http://127.0.0.1:8000/api/warehouses/1/')
      .then(res => setWarehouseData(res.data))
      .catch(err => console.error(err));

    // 2. Fetch Items
    axios.get('http://127.0.0.1:8000/api/items/')
      .then(res => {
        setItems(res.data);
        if (selectedItem) {
          const updated = res.data.find(i => i.id === selectedItem.id);
          if (updated) setSelectedItem(updated);
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [selectedItem]);

  // FLATTEN RACKS: Extract all racks from all aisles into one list for easier rendering
  const allRacks = useMemo(() => {
    if (!warehouseData || !warehouseData.aisles) return [];
    return warehouseData.aisles.flatMap(aisle => aisle.racks);
  }, [warehouseData]);

  // FLATTEN CONVEYORS
  const conveyors = warehouseData?.conveyors || [];

  // CALCULATE HEATMAP (Occupancy per Rack)
  const rackCounts = useMemo(() => {
    const counts = {};
    items.forEach(item => {
      // item.rack_id comes from our serializer helper
      counts[item.rack_id] = (counts[item.rack_id] || 0) + 1;
    });
    return counts;
  }, [items]);

  // HANDLERS
  const handlePathReceived = (path) => {
    setActivePath(path);
    setTimeout(() => setActivePath(null), 5000);
  };

  const handleSearch = (sku) => {
    const foundItem = items.find(i => i.sku.toLowerCase().includes(sku.toLowerCase()));
    if (foundItem && allRacks.length > 0) {
      const rack = allRacks.find(r => r.id === foundItem.rack_id);
      if (rack) {
        setSelectedItem(foundItem);
        setCameraTarget(new THREE.Vector3(rack.pos_x, rack.height/2, rack.pos_z));
      }
    } else {
      alert("Item not found!");
    }
  };

  // Keyboard 'P' for FPV
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'p') setIsFPV(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#111' }}>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <Canvas camera={{ position: [15, 15, 15], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 20, 10]} intensity={1} />
          <Sky sunPosition={[100, 20, 100]} />
          <Grid args={[60, 60]} cellColor="white" sectionColor="gray" />

          {/* CONTROLS */}
          {isFPV ? <FPVController /> : <OrbitControls makeDefault />}
          {cameraTarget && !isFPV && <CameraFlyTo targetPos={cameraTarget} onFinish={() => setCameraTarget(null)} />}

          {/* RACKS */}
          {allRacks.map(rack => (
            <Rack3D 
              key={rack.id} 
              data={rack} 
              itemCount={rackCounts[rack.id] || 0} 
              showHeatmap={showHeatmap} 
            />
          ))}

          {/* CONVEYORS */}
          {conveyors.map(c => <Conveyor3D key={c.id} data={c} />)}

          {/* ITEMS */}
          {items.map(item => (
            <AnimatedItem 
              key={item.id} 
              item={item} 
              allRacks={allRacks} // Pass flattened racks to look up positions
              onClick={setSelectedItem} 
            />
          ))}

          {/* PATHS */}
          {activePath && <GhostPath points={activePath} />}
        </Canvas>

        {/* UI OVERLAY */}
        <div style={{ position: 'absolute', top: 20, left: 20, color: 'white', pointerEvents: 'none' }}>
          <h1>WMS 3D View</h1>
          <p>{warehouseData ? warehouseData.name : "Loading..."}</p>
          <p style={{ color: isFPV ? '#0f0' : '#888', fontSize: '12px' }}>
            {isFPV ? "WASD to Walk (ESC to exit)" : "Orbit Mode (Press 'P' to Walk)"}
          </p>
        </div>
      </div>

      <Sidebar 
        selectedItem={selectedItem} 
        racks={allRacks} 
        onMoveSuccess={fetchData} 
        onPathReceived={handlePathReceived}
        toggleHeatmap={setShowHeatmap}
        onSearch={handleSearch}
      />
    </div>
  );
}

export default App;