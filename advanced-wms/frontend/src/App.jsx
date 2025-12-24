import React, { useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Grid, Text } from '@react-three/drei';
import axios from 'axios';
import * as THREE from 'three';

// Components
import Rack3D from './components/Rack3D';
import Conveyor3D from './components/Conveyor3D';
import AnimatedItem from './components/AnimatedItem';
import GhostPath from './components/GhostPath';
import Sidebar from './components/Sidebar';
import FPVController from './components/FPVController';
import WaveDashboard from './components/WaveDashboard';
import WarehouseEditor from './components/WarehouseEditor';

// Utilities
import { findPath } from './utils/pathfinding'; // <--- NEW IMPORT

// --- HELPER: Camera Animation ---
const CameraFlyTo = ({ targetPos, onFinish }) => {
  const { camera, controls } = useThree();
  useFrame((state, delta) => {
    if (!targetPos) return;
    const desiredPos = new THREE.Vector3(targetPos.x + 8, targetPos.y + 12, targetPos.z + 8);
    camera.position.lerp(desiredPos, 3.0 * delta);
    if (controls) {
      controls.target.lerp(targetPos, 3.0 * delta);
      controls.update();
    }
    if (camera.position.distanceTo(desiredPos) < 0.5) onFinish();
  });
  return null;
};

// --- HELPER: Zone Label Component ---
const ZoneLabel = ({ position, text, color }) => (
  <group position={[position[0], 0.1, position[2]]}>
    {/* Floor Tint */}
    <mesh rotation={[-Math.PI/2, 0, 0]}>
      <planeGeometry args={[15, 20]} />
      <meshBasicMaterial color={color} transparent opacity={0.1} />
    </mesh>
    {/* 3D Text Label */}
    <Text 
      position={[-5, 0.2, -8]} 
      rotation={[-Math.PI/2, 0, 0]} 
      fontSize={2} 
      color={color}
      anchorX="left" 
      anchorY="top"
    >
      {text}
    </Text>
  </group>
);


function App() {
  // --- UI TABS ---
  const [activeTab, setActiveTab] = useState('3D_VIEW'); // '3D_VIEW', 'OPERATIONS', 'EDITOR'

  // --- STATE ---
  const [warehouseData, setWarehouseData] = useState(null);
  const [items, setItems] = useState([]);
  const [conveyors, setConveyors] = useState([]);
  const [roads, setRoads] = useState([]); // <--- NEW STATE FOR ROADS
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Visualizations
  const [activePath, setActivePath] = useState(null);
  const [wavePath, setWavePath] = useState(null);
  const [highlightedRackIds, setHighlightedRackIds] = useState([]);
  const [activeWaveId, setActiveWaveId] = useState(null);
  
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isFPV, setIsFPV] = useState(false);
  const [cameraTarget, setCameraTarget] = useState(null);

  // --- FETCH DATA ---
  const fetchData = () => {
    // 1. Fetch Warehouse Data
    axios.get('http://127.0.0.1:8000/api/warehouses/1/')
      .then(res => {
        setWarehouseData(res.data);
        if(res.data.conveyors) setConveyors(res.data.conveyors);
      })
      .catch(err => console.error(err));

    // 2. Fetch Items
    axios.get('http://127.0.0.1:8000/api/items/')
      .then(res => setItems(res.data))
      .catch(err => console.error(err));

    // 3. Fetch Roads (For Pathfinding)
    axios.get('http://127.0.0.1:8000/api/roads/')
      .then(res => setRoads(res.data))
      .catch(err => console.error("No roads found", err));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000); // Polling (2s)
    return () => clearInterval(interval);
  }, []);

  // --- MEMOS ---
  const allRacks = useMemo(() => {
    if (!warehouseData || !warehouseData.aisles) return [];
    return warehouseData.aisles.flatMap(aisle => aisle.racks);
  }, [warehouseData]);

  const rackCounts = useMemo(() => {
    const counts = {};
    items.forEach(item => { counts[item.rack_id] = (counts[item.rack_id] || 0) + 1; });
    return counts;
  }, [items]);

  // --- HANDLERS ---
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
        setActiveTab('3D_VIEW');
      }
    } else {
      alert("Item not found!");
    }
  };

  // --- INTELLIGENT A* WAVE VISUALIZATION ---
  const handleVisualizeWave = (pickList, waveId) => {
    if (!pickList || pickList.length === 0) return;

    setActiveWaveId(waveId);
    
    // 1. Highlight Racks
    const rackIdsToHighlight = pickList.map(task => task.rack_id);
    setHighlightedRackIds(rackIdsToHighlight);

    // 2. Build A* Path using Roads
    let fullPath = [];
    let currentPos = [0, 0, 15]; // Start at Packing Station

    pickList.forEach(task => {
      const rack = allRacks.find(r => r.id === task.rack_id);
      if (rack) {
        // Target is the rack location (A* will snap to nearest road)
        const targetPos = [rack.pos_x, 0.5, rack.pos_z];
        
        // Use A* Utility
        const segment = findPath(currentPos, targetPos, roads);
        fullPath = [...fullPath, ...segment];
        
        currentPos = targetPos; // Update current position
      }
    });

    // Return to Packing Station
    const returnSegment = findPath(currentPos, [0, 0, 15], roads);
    fullPath = [...fullPath, ...returnSegment];

    setWavePath(fullPath);
    setActiveTab('3D_VIEW');
  };

  const handleCompleteWave = async () => {
    if(!activeWaveId) return;
    try {
      await axios.post('http://127.0.0.1:8000/api/wave/complete/', { wave_id: activeWaveId });
      alert("SUCCESS: Wave Completed. Inventory updated.");
      setWavePath(null);
      setHighlightedRackIds([]);
      setActiveWaveId(null);
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Error completing wave.");
    }
  };

  // FPV Key Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'p' && activeTab === '3D_VIEW') setIsFPV(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* TOP NAVBAR */}
      <div style={styles.navBar}>
        <div style={styles.navTitle}>WMS <span style={{color:'#007bff'}}>PRIME</span></div>
        <div style={styles.navMenu}>
          <button style={activeTab === '3D_VIEW' ? styles.navButtonActive : styles.navButton} onClick={() => setActiveTab('3D_VIEW')}>
            Digital Twin
          </button>
          <button style={activeTab === 'OPERATIONS' ? styles.navButtonActive : styles.navButton} onClick={() => setActiveTab('OPERATIONS')}>
            Operations
          </button>
          <button style={activeTab === 'EDITOR' ? styles.navButtonActive : styles.navButton} onClick={() => setActiveTab('EDITOR')}>
            Layout Editor (CAD)
          </button>
        </div>
      </div>

      <div style={{ flexGrow: 1, position: 'relative', display: 'flex' }}>
        
        {/* TAB 1: 3D VIEW */}
        {activeTab === '3D_VIEW' && (
          <>
            <div style={{ flexGrow: 1, position: 'relative', background: '#111' }}>
              <Canvas camera={{ position: [25, 30, 25], fov: 45 }} shadows>
                <ambientLight intensity={0.4} />
                <directionalLight position={[10, 50, 20]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
                <Sky sunPosition={[100, 20, 100]} />
                <Grid args={[100, 100]} cellColor="#444" sectionColor="#888" />

                {isFPV ? <FPVController /> : <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.1} />}
                {cameraTarget && !isFPV && <CameraFlyTo targetPos={cameraTarget} onFinish={() => setCameraTarget(null)} />}

                {/* --- ZONES (Visual Only) --- */}
                <ZoneLabel position={[-10, 0, 0]} text="ZONE A (Electronics)" color="#007bff" />
                <ZoneLabel position={[10, 0, 0]} text="ZONE B (Bulk)" color="#ffaa00" />
                <ZoneLabel position={[0, 0, 15]} text="PACKING AREA" color="#28a745" />

                {/* --- RACKS --- */}
                {allRacks.map(rack => (
                  <Rack3D 
                    key={rack.id} 
                    data={rack} 
                    itemCount={rackCounts[rack.id] || 0} 
                    showHeatmap={showHeatmap}
                    isHighlighted={highlightedRackIds.includes(rack.id)}
                    isDimmed={highlightedRackIds.length > 0 && !highlightedRackIds.includes(rack.id)}
                  />
                ))}

                {/* --- CONVEYORS & ITEMS --- */}
                {conveyors.map(c => <Conveyor3D key={c.id} data={c} />)}
                {items.map(item => (
                  <AnimatedItem key={item.id} item={item} allRacks={allRacks} onClick={setSelectedItem} />
                ))}

                {/* --- PATHS --- */}
                {activePath && <GhostPath points={activePath} color="cyan" />}
                {wavePath && <GhostPath points={wavePath} color="#ffaa00" />}

              </Canvas>

              {/* OVERLAY UI */}
              <div style={{ position: 'absolute', top: 20, left: 20, color: 'white', pointerEvents: 'none' }}>
                <h1 style={{margin: 0, fontSize: '20px'}}>Live Floor View</h1>
                
                {activeWaveId && (
                  <div style={{marginTop: '20px', pointerEvents: 'auto'}}>
                    <p style={{color: '#ffaa00', fontWeight:'bold', textShadow:'0 2px 4px black', margin:'0 0 10px 0'}}>
                      ⚡ WAVE ACTIVE (Follow Yellow Line)
                    </p>
                    <button 
                      onClick={handleCompleteWave}
                      style={styles.actionBtn}
                    >
                      ✅ CONFIRM PICK & SHIP
                    </button>
                  </div>
                )}
                
                <p style={{fontSize: '12px', color: '#aaa', marginTop: '15px'}}>{isFPV ? "WASD to Walk" : "Orbit Mode"}</p>
              </div>
            </div>

            <Sidebar 
              selectedItem={selectedItem} 
              racks={allRacks} 
              onMoveSuccess={fetchData} 
              onPathReceived={handlePathReceived}
              toggleHeatmap={setShowHeatmap}
              onSearch={handleSearch}
              openPlanning={() => setActiveTab('OPERATIONS')} 
            />
          </>
        )}

        {/* TAB 2: OPERATIONS */}
        {activeTab === 'OPERATIONS' && (
          <div style={{ width: '100%', height: '100%', background: '#f4f6f8', overflow: 'auto' }}>
            <WaveDashboard isFullScreen={true} onVisualizeWave={handleVisualizeWave} />
          </div>
        )}

        {/* TAB 3: CAD EDITOR */}
        {activeTab === 'EDITOR' && (
          <WarehouseEditor onClose={() => setActiveTab('3D_VIEW')} />
        )}

      </div>
    </div>
  );
}

const styles = {
  navBar: { height: '60px', background: '#1a1a1a', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', color: 'white', fontFamily: 'sans-serif', userSelect: 'none' },
  navTitle: { fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px' },
  navMenu: { display: 'flex', gap: '10px' },
  navButton: { background: 'transparent', border: 'none', color: '#aaa', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', borderBottom: '2px solid transparent', transition: 'all 0.2s' },
  navButtonActive: { background: '#252525', border: 'none', color: 'white', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', borderBottom: '2px solid #007bff', borderRadius: '4px 4px 0 0' },
  actionBtn: {
    padding: '12px 24px', fontSize: '15px', fontWeight: 'bold', background: '#28a745', color: 'white',
    border: '2px solid white', borderRadius: '6px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
  }
};

export default App;