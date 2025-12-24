import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Grid } from '@react-three/drei';
import axios from 'axios';
import * as THREE from 'three';

// Import Components
import Rack3D from './components/Rack3D';
import Conveyor3D from './components/Conveyor3D';
import AnimatedItem from './components/AnimatedItem';
import GhostPath from './components/GhostPath';
import Sidebar from './components/Sidebar';
import FPVController from './components/FPVController'; // Import the new controller

// Helper Component to animate Camera
const CameraFlyTo = ({ targetPos, onFinish }) => {
  const { camera, controls } = useThree();
  
  useFrame((state, delta) => {
    if (!targetPos) return;

    // Smoothly interpolate camera position to target + offset
    const desiredPos = new THREE.Vector3(targetPos.x + 5, targetPos.y + 5, targetPos.z + 5);
    camera.position.lerp(desiredPos, 3.0 * delta);
    
    // Smoothly look at the target
    if (controls) {
      controls.target.lerp(targetPos, 3.0 * delta);
      controls.update();
    }

    // Stop animating when close enough (Simple check)
    if (camera.position.distanceTo(desiredPos) < 0.5) {
      onFinish();
    }
  });
  return null;
};

function App() {
  const [warehouseData, setWarehouseData] = useState(null);
  const [items, setItems] = useState([]);
  const [conveyors, setConveyors] = useState([]);
  
  // States
  const [selectedItem, setSelectedItem] = useState(null);
  const [activePath, setActivePath] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  
  // Camera & Control States
  const [isFPV, setIsFPV] = useState(false); // First Person View Toggle
  const [cameraTarget, setCameraTarget] = useState(null); // For Search Fly-to

  // Fetch Data
  const fetchData = () => {
    axios.get('http://127.0.0.1:8000/api/warehouses/1/')
      .then(res => {
        setWarehouseData(res.data);
        if(res.data.conveyors) setConveyors(res.data.conveyors);
      })
      .catch(err => console.error(err));

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

  // Handle Keyboard Toggle for "P"
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'p') {
        setIsFPV(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Search from Sidebar
  const handleSearch = (sku) => {
    const foundItem = items.find(i => i.sku.toLowerCase().includes(sku.toLowerCase()));
    if (foundItem && warehouseData) {
      // Find the rack position
      const rack = warehouseData.racks.find(r => r.id === foundItem.rack);
      if (rack) {
        setSelectedItem(foundItem);
        // Set camera target to the Rack's position
        setCameraTarget(new THREE.Vector3(rack.pos_x, rack.height/2, rack.pos_z));
        // Reset target after animation (timeout logic handled in component implicitly by stop condition or state reset)
      }
    } else {
      alert("Item not found!");
    }
  };

  const handlePathReceived = (pathData) => {
    setActivePath(pathData);
    setTimeout(() => setActivePath(null), 5000);
  };

  // Calculate Heatmap Data
  const getRackOccupancy = () => {
    const counts = {};
    items.forEach(item => {
      const rackId = item.rack; 
      counts[rackId] = (counts[rackId] || 0) + 1;
    });
    return counts;
  };
  const rackCounts = getRackOccupancy();

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#111' }}>
      
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          
          {/* CONTROL SWITCHER */}
          {isFPV ? (
            <FPVController />
          ) : (
            <OrbitControls makeDefault />
          )}

          {/* CAMERA ANIMATOR (Only active when searching) */}
          {cameraTarget && !isFPV && (
            <CameraFlyTo 
              targetPos={cameraTarget} 
              onFinish={() => setCameraTarget(null)} 
            />
          )}

          <Sky sunPosition={[100, 20, 100]} />
          <Grid args={[50, 50]} cellColor="white" sectionColor="gray" />

          {/* RACKS */}
          {warehouseData && warehouseData.racks.map(rack => (
            <Rack3D 
              key={rack.id} 
              data={{...rack, items: []}} 
              itemCount={rackCounts[rack.id] || 0}
              showHeatmap={showHeatmap}
            /> 
          ))}

          {/* CONVEYORS */}
          {conveyors.map(c => <Conveyor3D key={c.id} data={c} />)}

          {/* ITEMS */}
          {warehouseData && items.map(item => (
            <AnimatedItem 
              key={item.id} 
              item={item} 
              racks={warehouseData.racks}
              onClick={setSelectedItem} 
            />
          ))}

          {/* GHOST PATH */}
          {activePath && <GhostPath points={activePath} />}

        </Canvas>

        {/* UI OVERLAY */}
        <div style={{ position: 'absolute', top: 20, left: 20, color: 'white', pointerEvents: 'none' }}>
          <h1>WMS 3D Control</h1>
          <p>{warehouseData ? warehouseData.name : "Loading..."}</p>
          <p style={{fontSize: '12px', color: isFPV ? '#0f0' : '#888'}}>
            Mode: {isFPV ? 'FIRST PERSON (WASD to Walk, Click to Lock)' : 'ORBIT (Left Click to Rotate)'}
          </p>
        </div>
      </div>

      <Sidebar 
        selectedItem={selectedItem} 
        racks={warehouseData ? warehouseData.racks : []}
        onMoveSuccess={fetchData} 
        onPathReceived={handlePathReceived}
        toggleHeatmap={setShowHeatmap}
        onSearch={handleSearch}
      />
      
    </div>
  );
}

export default App;