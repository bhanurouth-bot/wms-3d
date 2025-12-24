import React, { useState } from 'react';
import axios from 'axios';

const Sidebar = ({ selectedItem, racks, onMoveSuccess, onPathReceived, toggleHeatmap, onSearch, openPlanning }) => {
  const [targetRackId, setTargetRackId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHeatmapOn, setIsHeatmapOn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleToggleHeatmap = () => {
    const newState = !isHeatmapOn;
    setIsHeatmapOn(newState);
    toggleHeatmap(newState);
  };

  const handleSearch = () => {
    if(searchQuery.trim()) onSearch(searchQuery);
  };

  const handleMove = async () => {
    if (!targetRackId) return alert("Please select a destination");
    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/automation/scan/', {
        sku: selectedItem.sku,
        location_id: targetRackId 
      });
      if (response.data.path && onPathReceived) onPathReceived(response.data.path);
      alert(`Job Created! ID: ${response.data.job_id}`);
      onMoveSuccess();
    } catch (error) {
      console.error(error);
      alert("Move failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{marginTop:0, fontSize: '20px'}}>WMS Control</h2>
      
      {/* SEARCH */}
      <div style={{display:'flex', gap:'5px', marginBottom:'15px'}}>
        <input style={styles.input} placeholder="SKU..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <button style={styles.smallButton} onClick={handleSearch}>Go</button>
      </div>

      {/* TOOLS */}
      <h3 style={styles.sectionTitle}>Tools</h3>
      <button style={styles.secondaryButton} onClick={handleToggleHeatmap}>
        {isHeatmapOn ? 'Disable Heatmap' : 'Show Heatmap'}
      </button>
      
      <button style={{...styles.secondaryButton, marginTop: '10px', background: '#6f42c1', borderColor: '#59359a'}} onClick={openPlanning}>
        📅 Wave Planning
      </button>

      <hr style={{borderColor:'#333', margin:'20px 0'}}/>

      {/* SELECTION DETAILS */}
      {!selectedItem ? (
        <div style={{color:'#666', fontSize:'13px', textAlign: 'center', marginTop: '20px'}}>
          Select an item in 3D view<br/>or search to manage.
        </div>
      ) : (
        <>
          <div style={styles.card}>
            <div style={{...styles.colorDot, background:selectedItem.color}}></div>
            <div>
              <h3 style={{margin:'0 0 3px 0', fontSize:'15px'}}>{selectedItem.name}</h3>
              <p style={{margin:0, fontSize:'11px', color:'#ccc'}}>SKU: {selectedItem.sku}</p>
            </div>
          </div>
          
          <div style={styles.details}>
             <p><strong>Rack:</strong> {selectedItem.rack_id}</p>
             <p><strong>Shelf:</strong> {selectedItem.shelf}</p>
          </div>

          <h3 style={styles.sectionTitle}>Actions</h3>
          <label style={styles.label}>Move to Rack:</label>
          <select style={styles.select} value={targetRackId} onChange={e => setTargetRackId(e.target.value)}>
            <option value="">-- Select Destination --</option>
            {racks.map(rack => (
              <option key={rack.id} value={rack.identifier}>
                {rack.identifier} (Aisle {rack.identifier.split('-')[0]})
              </option>
            ))}
          </select>

          <button style={styles.primaryButton} onClick={handleMove} disabled={loading}>
            {loading ? 'Processing...' : 'INITIATE TRANSFER'}
          </button>
        </>
      )}
      
      <div style={{marginTop:'auto', fontSize:'10px', color:'#444', textAlign:'center'}}>
        System v2.5 (Aisle/Wave Supported)
      </div>
    </div>
  );
};

const styles = {
  container: { width: '320px', height: '100vh', background: '#1a1a1a', color: 'white', padding: '20px', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', fontFamily: 'Segoe UI, sans-serif' },
  card: { display: 'flex', alignItems: 'center', gap: '15px', background: '#252525', padding: '15px', borderRadius: '8px', border: '1px solid #333' },
  colorDot: { width: '30px', height: '30px', borderRadius: '4px' },
  details: { marginTop: '15px', fontSize: '13px', color: '#aaa' },
  label: { display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase' },
  sectionTitle: { fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '20px', marginBottom: '10px' },
  select: { width: '100%', padding: '10px', background: '#2a2a2a', color: 'white', border: '1px solid #444', borderRadius: '4px', marginBottom: '15px', outline: 'none' },
  input: { flexGrow: 1, padding: '8px', background: '#2a2a2a', border: '1px solid #444', color: 'white', borderRadius: '4px', outline: 'none' },
  smallButton: { padding: '8px 12px', background: '#444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  
  primaryButton: { width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  secondaryButton: { width: '100%', padding: '10px', background: '#333', color: '#ddd', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }
};

export default Sidebar;