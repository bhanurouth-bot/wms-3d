import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WaveDashboard = ({ isFullScreen, onVisualizeWave }) => {
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [pickList, setPickList] = useState(null);

  useEffect(() => {
    // Refresh pending orders when component mounts
    axios.get('http://127.0.0.1:8000/api/orders/')
      .then(res => setOrders(res.data.filter(o => o.status === 'PENDING')))
      .catch(err => console.error(err));
  }, [pickList]); // Re-fetch if pickList is cleared (completed)

  const toggleOrder = (id) => {
    if (selectedOrders.includes(id)) setSelectedOrders(selectedOrders.filter(o => o !== id));
    else setSelectedOrders([...selectedOrders, id]);
  };

  const generateWave = async () => {
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/wave/create/', { order_ids: selectedOrders });
      setPickList(res.data.pick_list);
      
      // CRITICAL UPDATE: Pass the wave ID so App.jsx can complete it later
      if (onVisualizeWave) {
        onVisualizeWave(res.data.pick_list, res.data.wave_id);
      }
    } catch (err) {
      alert("Error generating wave. Check console.");
      console.error(err);
    }
  };

  const containerStyle = isFullScreen ? styles.fullScreenContainer : styles.modalContainer;

  return (
    <div style={containerStyle}>
      <div style={styles.header}>
        <h2 style={{margin:0, color: '#333'}}>Wave Planning Console</h2>
        <div style={{fontSize: '14px', color: '#666'}}>
          {pickList ? "Status: Visualization Active" : "Status: Order Selection"}
        </div>
      </div>

      {!pickList ? (
        <div style={styles.content}>
          <div style={styles.toolbar}>
            <span style={{fontWeight:'bold'}}>Pending Orders ({orders.length})</span>
            <button 
              onClick={generateWave} 
              disabled={selectedOrders.length === 0} 
              style={selectedOrders.length > 0 ? styles.primaryBtn : styles.disabledBtn}
            >
              Generate Wave for {selectedOrders.length} Orders
            </button>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th width="50">Select</th>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', padding:'40px', color:'#999'}}>No Pending Orders</td></tr>}
              {orders.map(order => (
                <tr key={order.id}>
                  <td><input type="checkbox" onChange={() => toggleOrder(order.id)} checked={selectedOrders.includes(order.id)} style={{transform:'scale(1.2)'}}/></td>
                  <td style={{fontWeight:'bold', color:'#007bff'}}>{order.order_number}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.items.map(i => <span key={i.sku} style={styles.tag}>{i.sku} (x{i.quantity})</span>)}</td>
                  <td style={{color:'#666'}}>{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={styles.content}>
          <div style={styles.toolbar}>
            <button style={styles.secondaryBtn} onClick={() => { setPickList(null); setSelectedOrders([]); }}>← Back to Orders</button>
            <button style={styles.printBtn} onClick={() => window.print()}>Print Pick List</button>
          </div>
          
          <div style={styles.pickListContainer}>
            <h3 style={{marginTop:0}}>Wave Generated Successfully</h3>
            <p style={{color: '#28a745', fontWeight: 'bold'}}>✓ Visualization sent to Digital Twin tab. Switch tabs to execute.</p>
            
            <table style={styles.table}>
              <thead>
                <tr style={{background: '#e9ecef'}}>
                  <th>Sequence</th>
                  <th>Location</th>
                  <th>SKU</th>
                  <th>Order Ref</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pickList.map((task, idx) => (
                  <tr key={idx} style={{background: task.status === 'OUT OF STOCK' ? '#ffebeb' : 'white', borderBottom: '1px solid #eee'}}>
                    <td style={{padding:'12px', fontWeight:'bold'}}>#{idx + 1}</td>
                    <td style={{fontWeight:'bold', color:'#333'}}>{task.location}</td>
                    <td>{task.sku}</td>
                    <td>{task.order}</td>
                    <td><span style={{background: task.status === 'OK' ? '#d4edda' : '#f8d7da', color: task.status === 'OK' ? '#155724' : '#721c24', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight:'bold'}}>{task.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  fullScreenContainer: { maxWidth: '1200px', margin: '40px auto', background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', minHeight: '80vh', fontFamily: 'Segoe UI, sans-serif' },
  modalContainer: {},
  header: { padding: '25px 30px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  content: { padding: '30px' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  table: { width: '100%', borderCollapse: 'collapse', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  tag: { background: '#f8f9fa', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', marginRight: '5px', border: '1px solid #dee2e6' },
  primaryBtn: { padding: '12px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', boxShadow: '0 2px 4px rgba(40,167,69,0.3)' },
  disabledBtn: { padding: '12px 24px', background: '#e9ecef', color: '#adb5bd', border: 'none', borderRadius: '6px', cursor: 'not-allowed', fontWeight: '600' },
  secondaryBtn: { padding: '10px 20px', background: 'transparent', color: '#666', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', marginRight: '10px' },
  printBtn: { padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  pickListContainer: { background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }
};

export default WaveDashboard;