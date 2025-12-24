import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, Grid, TransformControls, useCursor } from '@react-three/drei';
import axios from 'axios';

// --- EDITABLE OBJECT ---
const EditableObject = ({ data, isSelected, onSelect, onChange }) => {
  const [hovered, setHover] = useState(false);
  useCursor(hovered);

  // COLORS: Bright colors to ensure visibility against dark background
  let color = "#aaaaaa"; // Default Rack Gray
  if (data.type === 'road') color = "#555555"; // Road Dark Gray
  if (data.type === 'zone') color = data.color || "rgba(0, 255, 0, 0.3)";
  if (isSelected) color = "#00d0ff"; // Bright Cyan when selected
  if (hovered && !isSelected) color = "#ffffff"; // White on hover

  return (
    <>
      {/* Use meshBasicMaterial so it doesn't need light to be visible */}
      <mesh
        position={[data.x || 0, (data.height || 0.1)/2, data.z || 0]}
        rotation={[0, data.rotation || 0, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(data.id); }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <boxGeometry args={[data.width || 2, data.height || 3, data.depth || 1]} />
        <meshBasicMaterial color={color} wireframe={false} transparent={data.type === 'zone'} opacity={data.type === 'zone' ? 0.3 : 1} />
      </mesh>

      {/* TRANSFORM CONTROLS - WRAPPED Implementation (More stable) */}
      {isSelected && (
        <TransformControls
          mode="translate"
          translationSnap={1}
          rotationSnap={Math.PI / 4}
          showY={false}
          position={[data.x || 0, (data.height || 0.1)/2, data.z || 0]} // Match object pos
          onMouseUp={(e) => {
             // Read the new position from the control's target
             if(e.target.object) {
                onChange(data.id, {
                  x: e.target.object.position.x,
                  z: e.target.object.position.z,
                  rotation: e.target.object.rotation.y // If creating rotation mode later
                });
             }
          }}
        >
          {/* Invisible helper to bind controls to */}
          <mesh visible={false}>
             <boxGeometry args={[data.width, data.height, data.depth]} />
          </mesh>
        </TransformControls>
      )}
    </>
  );
};

// --- MAIN EDITOR ---
const WarehouseEditor = ({ onClose }) => {
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState("Loading...");

  // 1. FETCH DATA
  useEffect(() => {
    const loadData = async () => {
      try {
        setStatus("Fetching...");
        // Fetch Racks and Roads
        const [racksRes, roadsRes] = await Promise.all([
            axios.get('http://127.0.0.1:8000/api/racks/'),
            axios.get('http://127.0.0.1:8000/api/roads/')
        ]);

        let loadedObjects = [];

        // LOAD RACKS: Force Numbers using parseFloat
        racksRes.data.forEach(r => loadedObjects.push({
            id: r.id, dbType: 'rack', type: 'rack',
            x: parseFloat(r.pos_x) || 0, 
            z: parseFloat(r.pos_z) || 0, 
            rotation: parseFloat(r.rotation) || 0,
            width: parseFloat(r.width) || 2, 
            height: parseFloat(r.height) || 3, 
            depth: parseFloat(r.depth) || 1
        }));

        // LOAD ROADS
        roadsRes.data.forEach(r => loadedObjects.push({
            id: r.id, dbType: 'road', type: 'road',
            x: parseFloat(r.pos_x) || 0,
            z: parseFloat(r.pos_z) || 0,
            rotation: parseFloat(r.rotation) || 0,
            width: parseFloat(r.width) || 4,
            height: 0.1,
            depth: parseFloat(r.depth) || 4
        }));

        setObjects(loadedObjects);
        setStatus(`Loaded ${loadedObjects.length} Objects`);

      } catch (err) {
        console.error("Load Error:", err);
        setStatus("Error (Check Console)");
      }
    };
    loadData();
  }, []);

  // 2. ADD PRESETS
  const addPreset = (type) => {
    const newId = `NEW_${Date.now()}`;
    const randX = Math.floor(Math.random() * 5);
    
    let newObj = { id: newId, dbType: 'new', x: randX, z: 0, rotation: 0 };

    if (type === 'RACK') {
      newObj = { ...newObj, type: 'rack', width: 2, height: 3, depth: 1 };
    } else if (type === 'ROAD') {
      newObj = { ...newObj, type: 'road', width: 4, height: 0.1, depth: 4 };
    } else if (type === 'ZONE') {
      newObj = { ...newObj, type: 'zone', width: 10, height: 0.2, depth: 10, color: '#00ff00' };
    }
    
    setObjects([...objects, newObj]);
    setStatus("Added New Object");
  };

  const handleObjectChange = (id, newProps) => {
    setObjects(prev => prev.map(obj => obj.id === id ? { ...obj, ...newProps } : obj));
  };

  // 3. SAVE LOGIC
  const saveLayout = async () => {
    setStatus("Saving...");
    try {
      // Save Racks
      const racks = objects.filter(o => o.type === 'rack');
      for (let obj of racks) {
        const payload = { pos_x: obj.x, pos_z: obj.z, rotation: obj.rotation };
        if (obj.dbType === 'rack') {
            await axios.patch(`http://127.0.0.1:8000/api/racks/${obj.id}/`, payload);
        } else {
            await axios.post('http://127.0.0.1:8000/api/racks/', { 
                ...payload, identifier: `NEW-${obj.id.slice(-4)}`, aisle: 1 
            });
        }
      }
      // Save Roads
      const roads = objects.filter(o => o.type === 'road');
      for (let obj of roads) {
        const payload = { pos_x: obj.x, pos_z: obj.z, rotation: obj.rotation, width: obj.width, depth: obj.depth, warehouse: 1 };
        if (obj.dbType === 'road') {
            await axios.patch(`http://127.0.0.1:8000/api/roads/${obj.id}/`, payload);
        } else {
            await axios.post('http://127.0.0.1:8000/api/roads/', payload);
        }
      }
      alert("Layout Saved!");
      setStatus("Saved Successfully");
    } catch (err) {
      console.error(err);
      alert("Error saving (See Console)");
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={styles.toolbar}>
        <div style={styles.group}>
          <span style={styles.title}>📐 EDITOR</span>
          <div style={styles.divider}></div>
          <button style={styles.btn} onClick={() => addPreset('RACK')}>+ Rack</button>
          <button style={styles.btn} onClick={() => addPreset('ROAD')}>+ Road</button>
          <button style={styles.btn} onClick={() => addPreset('ZONE')}>+ Zone</button>
        </div>
        <div style={styles.group}>
          <span style={{fontSize: '12px', color: '#aaa', marginRight: '15px'}}>{status}</span>
          <button style={styles.saveBtn} onClick={saveLayout}>💾 Save Layout</button>
          <button style={styles.closeBtn} onClick={onClose}>Exit</button>
        </div>
      </div>

      <div style={{ flexGrow: 1, background: '#111', position: 'relative' }}>
        <Canvas>
          {/* Camera: High up, looking down. Zoom=20 is standard for this scale */}
          <OrthographicCamera makeDefault position={[0, 50, 0]} zoom={20} near={0.1} far={1000} />
          
          <ambientLight intensity={1} /> {/* Full brightness */}
          
          {/* Grid Helper */}
          <Grid args={[100, 100]} sectionSize={5} cellSize={1} cellColor="#666" sectionColor="#00d0ff" position={[0, -0.01, 0]} />

          {/* Render Objects */}
          {objects.map(obj => (
            <EditableObject 
              key={obj.id} 
              data={obj} 
              isSelected={selectedId === obj.id}
              onSelect={setSelectedId}
              onChange={handleObjectChange}
            />
          ))}

          {/* Background Plane (Click to deselect) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} onClick={() => setSelectedId(null)}>
             <planeGeometry args={[200, 200]} />
             <meshBasicMaterial color="#1a1a1a" /> 
          </mesh>
        </Canvas>

        <div style={styles.overlay}>
           Right-Click & Drag to Pan • Scroll to Zoom • Left-Click to Select
        </div>
      </div>
    </div>
  );
};

const styles = {
  toolbar: { height: '60px', background: '#252526', borderBottom: '1px solid #000', display: 'flex', justifyContent: 'space-between', padding: '0 20px', alignItems: 'center', color: 'white', fontFamily: 'sans-serif' },
  group: { display: 'flex', alignItems: 'center', gap: '10px' },
  title: { fontWeight: 'bold', color: '#00d0ff', letterSpacing: '1px' },
  divider: { width: '1px', height: '20px', background: '#555', margin: '0 5px' },
  btn: { padding: '8px 12px', background: '#333', color: '#eee', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  saveBtn: { padding: '8px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  closeBtn: { padding: '8px 15px', background: 'transparent', color: '#aaa', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' },
  overlay: { position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '8px 20px', borderRadius: '20px', fontSize: '12px', pointerEvents: 'none' }
};

export default WarehouseEditor;