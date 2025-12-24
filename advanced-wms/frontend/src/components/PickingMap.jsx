import React from 'react';

const PickingMap = ({ racks, pickList }) => {
  // Map dimensions (Scale down meters to pixels)
  const SCALE = 20; 
  const MAP_WIDTH = 800;
  const MAP_HEIGHT = 600;
  const CENTER_X = MAP_WIDTH / 2;
  const CENTER_Y = MAP_HEIGHT / 2;

  return (
    <div style={{ background: 'white', padding: '20px', border: '2px solid black' }}>
      <h3 style={{ textAlign: 'center' }}>PICKING MANIFEST & MAP</h3>
      
      <svg width={MAP_WIDTH} height={MAP_HEIGHT} style={{ background: '#f0f0f0', border: '1px solid #ccc' }}>
        {/* Draw All Racks (Gray Boxes) */}
        {racks.map(rack => (
          <rect
            key={rack.id}
            x={CENTER_X + (rack.pos_x * SCALE)}
            y={CENTER_Y + (rack.pos_z * SCALE)}
            width={rack.width * SCALE}
            height={rack.depth * SCALE}
            fill="#ccc"
            stroke="#999"
          />
        ))}

        {/* Draw Path Line */}
        {pickList && pickList.length > 0 && (
          <polyline
            points={
              pickList.map(task => {
                const r = racks.find(rack => rack.id === task.rack_id);
                return r ? `${CENTER_X + r.pos_x * SCALE},${CENTER_Y + r.pos_z * SCALE}` : "";
              }).join(" ")
            }
            fill="none"
            stroke="black"
            strokeWidth="3"
            strokeDasharray="5,5"
          />
        )}

        {/* Draw Pick Targets (Circles) */}
        {pickList && pickList.map((task, i) => {
          const r = racks.find(rack => rack.id === task.rack_id);
          if (!r) return null;
          return (
            <g key={i}>
              <circle
                cx={CENTER_X + r.pos_x * SCALE}
                cy={CENTER_Y + r.pos_z * SCALE}
                r="8"
                fill="black"
              />
              <text 
                x={CENTER_X + r.pos_x * SCALE + 10} 
                y={CENTER_Y + r.pos_z * SCALE + 5} 
                fontSize="12" 
                fontWeight="bold"
              >
                #{i+1}
              </text>
            </g>
          );
        })}
      </svg>

      <div style={{ marginTop: '10px', fontSize: '12px' }}>
        * Follow dashed line sequence. confirm SKU at location.
      </div>
    </div>
  );
};

export default PickingMap;