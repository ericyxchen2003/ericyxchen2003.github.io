// Install the surveyed sheet before construction of the road and collision indexes.
(() => {
  const data=HKTszWanShan, map=HKMAP, north=HKNorth;
  const [left,top,right,bottom]=data.bounds;
  const replaced=new Set(data.seamBuildingIds);
  const keep=b=>!replaced.has(b.id);
  map.buildings=map.buildings.filter(keep);
  north.buildings=north.buildings.filter(keep).concat(data.buildings);
  for(const k of ['roads','parks','paths','decks','piers','excavations','barriers','water','marks','diagonals'])north[k].push(...data[k]);
  for(const [key,rows] of Object.entries(data.nodes))north.nodes[key].push(...rows);
  map.terrain.tszWanShan=data.terrain;
  north.land=data.land;
  const previousTop=north.bounds[1];
  north.bounds[1]=Math.min(previousTop,top);
  const outside=map.outsideExtension, edge=map.extensionEdge;
  const inside=(x,z)=>x>=left&&x<=data.driveEast&&z>=top&&z<=bottom;
  map.outsideExtension=(x,z)=>!inside(x,z)&&(z<previousTop||outside(x,z));
  map.extensionEdge=(a,b)=>edge(a,b)||[0,1,2,3].some(i=>a[i%2]===(i===2?data.driveEast:data.bounds[i])&&b[i%2]===a[i%2]&&inside(...a)&&inside(...b));
})();
