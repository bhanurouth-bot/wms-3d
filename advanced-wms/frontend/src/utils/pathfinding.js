// frontend/src/utils/pathfinding.js

// A* Algorithm Implementation
export const findPath = (startPos, endPos, roads) => {
  // 1. Convert 3D float positions to "Grid Coordinates" (integers)
  // Assuming standard 1x1 or 2x2 grid tiles. We'll round to nearest integer.
  const toGrid = (vec3) => ({ x: Math.round(vec3[0]), y: Math.round(vec3[2]) });
  
  const startNode = toGrid(startPos);
  const endNode = toGrid(endPos);

  // 2. Build the Grid from Roads
  // We store walkable nodes in a Set for O(1) lookup: "x,y"
  const walkable = new Set();
  
  roads.forEach(r => {
    // Roads have width/depth. We need to mark ALL tiles covered by this road as walkable.
    // E.g. a 4x4 road at (10,10) covers (8,8) to (12,12)
    const halfW = (r.width || 2) / 2;
    const halfD = (r.depth || 2) / 2;
    
    const minX = Math.round(r.pos_x - halfW);
    const maxX = Math.round(r.pos_x + halfW);
    const minZ = Math.round(r.pos_z - halfD);
    const maxZ = Math.round(r.pos_z + halfD);

    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        walkable.add(`${x},${z}`);
      }
    }
  });

  // Ensure Start/End are valid (Hack: If rack is slightly off-road, snap it to nearest road)
  // For simplicity, we assume start/end are always valid or we add them temporarily
  walkable.add(`${startNode.x},${startNode.y}`);
  walkable.add(`${endNode.x},${endNode.y}`);

  // 3. A* Setup
  const openSet = [startNode];
  const cameFrom = {}; // Maps nodeStr -> parentNode
  const gScore = {};   // Cost from start
  const fScore = {};   // Estimated cost to end

  const nodeStr = (n) => `${n.x},${n.y}`;
  
  gScore[nodeStr(startNode)] = 0;
  fScore[nodeStr(startNode)] = heuristic(startNode, endNode);

  while (openSet.length > 0) {
    // Get node with lowest fScore
    openSet.sort((a, b) => (fScore[nodeStr(a)] || Infinity) - (fScore[nodeStr(b)] || Infinity));
    const current = openSet.shift();

    if (current.x === endNode.x && current.y === endNode.y) {
      return reconstructPath(cameFrom, current);
    }

    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ];

    for (let neighbor of neighbors) {
      const nStr = nodeStr(neighbor);
      
      // Check collision
      if (!walkable.has(nStr)) continue;

      const tentativeG = gScore[nodeStr(current)] + 1; // Distance is always 1 grid unit

      if (tentativeG < (gScore[nStr] || Infinity)) {
        cameFrom[nStr] = current;
        gScore[nStr] = tentativeG;
        fScore[nStr] = tentativeG + heuristic(neighbor, endNode);
        
        if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  // No path found? Return direct line as fallback (so app doesn't crash)
  console.warn("No path found via roads! using direct line.");
  return [ [startPos[0], 0.2, startPos[2]], [endPos[0], 0.2, endPos[2]] ];
};

// Heuristic: Manhattan Distance
const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

const reconstructPath = (cameFrom, current) => {
  const totalPath = [ [current.x, 0.2, current.y] ];
  const nodeStr = (n) => `${n.x},${n.y}`;
  
  while (nodeStr(current) in cameFrom) {
    current = cameFrom[nodeStr(current)];
    totalPath.unshift([current.x, 0.2, current.y]);
  }
  return totalPath;
};