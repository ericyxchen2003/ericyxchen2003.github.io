// Install the surveyed sheet before construction of the road and collision indexes.
(() => {
  const data=HKDiamondHill, map=HKMAP, north=HKNorth;
  const [left,top,right,bottom]=data.bounds;
  const replaced=new Set(data.seamBuildingIds);
  const keep=b=>!replaced.has(b.id);
  map.buildings=map.buildings.filter(keep);
  north.buildings=north.buildings.filter(keep).concat(data.buildings);
  for(const k of ['roads','parks','paths','decks','piers','excavations','barriers','water','marks','diagonals'])north[k].push(...data[k]);
  for(const [key,rows] of Object.entries(data.nodes))north.nodes[key].push(...rows);
  map.terrain.diamondHill=data.terrain;
  north.decks.find(d=>d.id==='spk39577195').p=data.seamProfile;
  const [px,pz,level]=data.seamPier;
  const pier=north.piers.find(p=>p[0]===px&&p[1]===pz);
  if(pier)pier[2]=level;
  north.land=data.land;
  const outside=map.outsideExtension, edge=map.extensionEdge;
  const inside=(x,z)=>x>=left&&x<=right&&z>=top&&z<=bottom;
  map.outsideExtension=(x,z)=>!inside(x,z)&&outside(x,z);
  map.extensionEdge=(a,b)=>edge(a,b)||[0,1,2,3].some(i=>a[i%2]===data.bounds[i]&&b[i%2]===data.bounds[i]&&inside(...a)&&inside(...b));
})();
