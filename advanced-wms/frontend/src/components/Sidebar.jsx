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
    if(searchQuery.trim()) onSearch(searchQuery);
  };

  const handleMove = async () => {
    if (!targetRackId) return alert("Please select a destination");
    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/automation/scan/', {
        sku: selectedItem.sku,
        location_id: targetRackId // Sending Rack ID (Backend picks default shelf)
      });
      if (response.data.path && onPathReceived) onPathReceived(response.data.path);
      alert(`Transfer Started! Job: ${response.data.job_id}`);
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
      <h2 style={{marginTop:0}}>WMS Control</h2>
      
      {/* Search */}
      <div style={{display:'flex', gap:'5px', marginBottom:'20px'}}>
        <input style={styles.input} placeholder="SKU..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
        <button style={styles.smallButton} onClick={handleSearch}>Go</button>
      </div>

      <button style={{...styles.button, background: isHeatmapOn ? '#d33' : '#444', marginBottom:'20px', padding:'10px', fontSize:'12px'}} onClick={handleToggle}>
        {isHeatmapOn ? 'DISABLE HEATMAP' : 'ENABLE HEATMAP'}
      </button>
      <hr style={{borderColor:'#333', margin:'0 0 20px 0'}}/>

      {!selectedItem ? (
        <p style={{color:'#888'}}>Select item or search.</p>
      ) : (
        <>
          <div style={styles.card}>
            <div style={{...styles.colorDot, background:selectedItem.color}}></div>
            <div>
              <h3 style={{margin:'0 0 5px 0', fontSize:'16px'}}>{selectedItem.name}</h3>
              <p style={{margin:0, fontSize:'12px', color:'#ccc'}}>SKU: {selectedItem.sku}</p>
            </div>
          </div>
          
          <div style={styles.details}>
             {/* Note: We use rack_id because that is what we have in item now */}
             <p>Rack ID: {selectedItem.rack_id}</p>
             <p>Shelf ID: {selectedItem.shelf}</p>
          </div>

          <h3 style={{marginTop:'20px', fontSize:'14px', color:'#aaa'}}>ACTIONS</h3>
          <label style={styles.label}>Move to Rack:</label>
          <select style={styles.select} value={targetRackId} onChange={e => setTargetRackId(e.target.value)}>
            <option value="">-- Select Destination --</option>
            {racks.map(rack => (
              <option key={rack.id} value={rack.identifier}>
                {rack.identifier} (Aisle {rack.identifier.split('-')[0]})
              </option>
            ))}
          </select>

          <button style={styles.button} onClick={handleMove} disabled={loading}>
            {loading ? '...' : 'INITIATE TRANSFER'}
          </button>
        </>
      )}
      <div style={{marginTop:'auto', fontSize:'11px', color:'#555', textAlign:'center'}}>v2.0 - Aisle Support</div>
    </div>
  );
};

const styles = {
  container: { width: '320px', height: '100vh', background: '#1a1a1a', color: 'white', padding: '20px', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', fontFamily: 'sans-serif' },
  card: { display: 'flex', alignItems: 'center', gap: '15px', background: '#252525', padding: '15px', borderRadius: '8px' },
  colorDot: { width: '40px', height: '40px', borderRadius: '6px' },
  details: { marginTop: '15px', fontSize: '13px', color: '#aaa' },
  label: { display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: '#888' },
  select: { width: '100%', padding: '10px', background: '#333', color: 'white', border: '1px solid #444', borderRadius: '4px', marginBottom: '20px' },
  button: { width: '100%', padding: '15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  input: { flexGrow: 1, padding: '8px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' },
  smallButton: { padding: '8px 12px', background: '#444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

export default Sidebar;