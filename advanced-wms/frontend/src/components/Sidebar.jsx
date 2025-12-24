import React, { useState } from 'react';
import axios from 'axios';

const Sidebar = ({ selectedItem, racks, onMoveSuccess, onPathReceived, toggleHeatmap, onSearch }) => {
  const [targetRackId, setTargetRackId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHeatmapOn, setIsHeatmapOn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleToggle = () => {
    const newState = !isHeatmapOn;
    setIsHeatmapOn(newState);
    toggleHeatmap(newState);
  };

  const handleSearch = () => {
    if(searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const handleMove = async () => {
    if (!selectedItem) return;
    if (!targetRackId) return alert("Please select a destination rack");
    
    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/automation/scan/', {
        sku: selectedItem.sku,
        location_id: targetRackId
      });
      
      if (response.data.path && onPathReceived) {
        onPathReceived(response.data.path);
      }

      alert(`Transfer Initiated! Job ID: ${response.data.job_id}`);
      onMoveSuccess();
      
    } catch (error) {
      console.error(error);
      alert("Error moving item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{marginTop: 0}}>WMS Control</h2>
      
      {/* SEARCH BAR */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
        <input 
          style={styles.input} 
          placeholder="Search SKU (e.g. RTX-4090)..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button style={styles.smallButton} onClick={handleSearch}>Go</button>
      </div>

      {/* HEATMAP TOGGLE */}
      <button 
        style={{
          ...styles.button, 
          background: isHeatmapOn ? '#ff4444' : '#444', 
          marginBottom: '20px',
          fontSize: '12px',
          padding: '10px'
        }} 
        onClick={handleToggle}
      >
        {isHeatmapOn ? 'DISABLE HEATMAP' : 'ENABLE HEATMAP MODE'}
      </button>

      <hr style={{ borderColor: '#333', margin: '0 0 20px 0' }} />

      {/* SELECTED ITEM DETAILS */}
      {!selectedItem ? (
        <p style={{ color: '#888', fontStyle: 'italic' }}>Select an item in 3D view or search to manage.</p>
      ) : (
        <>
          <div style={styles.card}>
            <div style={{...styles.colorDot, background: selectedItem.color}}></div>
            <div>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{selectedItem.name}</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#ccc' }}>
                <strong>SKU:</strong> {selectedItem.sku}
              </p>
            </div>
          </div>

          <div style={styles.details}>
            <p><strong>Current Rack:</strong> {racks.find(r => r.id === selectedItem.rack)?.identifier || 'Unknown'}</p>
            <p><strong>Shelf Level:</strong> {selectedItem.shelf_level}</p>
          </div>

          <h3 style={{marginTop: '20px', fontSize: '14px', color: '#aaa'}}>ACTIONS</h3>
          <label style={styles.label}>Move to Rack:</label>
          
          <select 
            style={styles.select}
            value={targetRackId}
            onChange={(e) => setTargetRackId(e.target.value)}
          >
            <option value="">-- Select Destination --</option>
            {racks.map(rack => (
              rack.id !== selectedItem.rack && (
                <option key={rack.id} value={rack.identifier}>
                  {rack.identifier}
                </option>
              )
            ))}
          </select>

          <button 
            style={{...styles.button, opacity: loading ? 0.7 : 1}} 
            onClick={handleMove}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'INITIATE TRANSFER'}
          </button>
        </>
      )}
      
      <div style={{ marginTop: 'auto', fontSize: '11px', color: '#555', textAlign: 'center' }}>
        Press 'P' for First Person View
        <br />
        Advanced WMS Control v1.1
      </div>
    </div>
  );
};

const styles = {
  container: { width: '320px', height: '100vh', background: '#1a1a1a', color: 'white', padding: '25px', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', fontFamily: 'sans-serif' },
  card: { display: 'flex', alignItems: 'center', gap: '15px', background: '#252525', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' },
  colorDot: { width: '40px', height: '40px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' },
  details: { marginTop: '15px', fontSize: '13px', color: '#aaa', lineHeight: '1.6' },
  label: { display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase' },
  select: { width: '100%', padding: '12px', background: '#333', color: 'white', border: '1px solid #444', borderRadius: '6px', marginBottom: '20px', outline: 'none', cursor: 'pointer' },
  button: { width: '100%', padding: '15px', background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' },
  input: { flexGrow: 1, padding: '10px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' },
  smallButton: { padding: '10px 15px', background: '#444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
};

export default Sidebar;