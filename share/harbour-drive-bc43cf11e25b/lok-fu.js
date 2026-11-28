// Install the surveyed sheet before construction of the road and collision indexes.
(() => {
  const data=HKLokFu, map=HKMAP, north=HKNorth;
  const [left,top,right,bottom]=data.bounds;
  const replaced=new Set(data.seamBuildingIds);
  const keep=b=>!replaced.has(b.id)||!b.p.some(([x,z])=>Math.abs(x-left)<.15||Math.abs(z+4290)<.15||Math.abs(x-2450)<.15);
  map.buildings=map.buildings.filter(keep);
  north.buildings=north.buildings.filter(keep).concat(data.buildings);
  for(const k of ['roads','parks','paths','decks','piers','excavations','barriers','water','marks','diagonals'])north[k].push(...data[k]);
  for(const [key,rows] of Object.entries(data.nodes))north.nodes[key].push(...rows);
  map.terrain.lokFu=data.terrain;
  north.land=data.land;
  const outside=map.outsideExtension, edge=map.extensionEdge;
  const inside=(x,z)=>x>=left&&x<=right&&z>=top&&z<=bottom;
  map.outsideExtension=(x,z)=>!inside(x,z)&&outside(x,z);
  map.extensionEdge=(a,b)=>edge(a,b)||[0,1,2,3].some(i=>a[i%2]===data.bounds[i]&&b[i%2]===data.bounds[i]&&inside(...a)&&inside(...b));
})();
