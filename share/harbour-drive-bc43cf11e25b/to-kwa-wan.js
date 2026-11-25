// Install the surveyed sheet before construction of the road and collision indexes.
(() => {
  const data=HKToKwaWan, map=HKMAP, north=HKNorth;
  const [left,top,right,bottom]=data.bounds;
  const replaced=new Set(data.seamBuildingIds);
  map.buildings=map.buildings.filter(b=>!replaced.has(b.id));
  north.buildings=north.buildings.filter(b=>!replaced.has(b.id)).concat(data.buildings);
  for(const k of ['roads','parks','paths','decks','piers','excavations','barriers','water','marks','diagonals'])north[k].push(...data[k]);
  for(const [key,rows] of Object.entries(data.nodes))north.nodes[key].push(...rows);
  map.terrain.toKwaWan=data.terrain;
  north.land=data.land;
  const outside=map.outsideExtension, edge=map.extensionEdge;
  map.outsideExtension=(x,z)=>!(x>=left&&x<=right&&z>=top&&z<=bottom)&&outside(x,z);
  map.extensionEdge=(a,b)=>edge(a,b)||(a[1]===top&&b[1]===top&&Math.min(a[0],b[0])>=left)||
    (a[0]===right&&b[0]===right&&Math.min(a[1],b[1])>=top);
})();
