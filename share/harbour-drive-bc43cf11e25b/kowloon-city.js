// Install the surveyed sheet before construction of the road and collision indexes.
(() => {
  const data=HKKowloonCity, map=HKMAP, north=HKNorth;
  const [left,top,right,bottom]=data.bounds;
  const replaced=new Set(data.seamBuildingIds);
  const keep=b=>!replaced.has(b.id)||!b.p.some(([x,z])=>Math.abs(x-left)<.15||Math.abs(z-bottom)<.15);
  map.buildings=map.buildings.filter(keep);
  north.buildings=north.buildings.filter(keep).concat(data.buildings);
  for(const k of ['roads','parks','paths','decks','piers','excavations','barriers','water','marks','diagonals'])north[k].push(...data[k]);
  for(const [key,rows] of Object.entries(data.nodes))north.nodes[key].push(...rows);
  map.terrain.kowloonCity=data.terrain;
  north.land=data.land;
  const outside=map.outsideExtension, edge=map.extensionEdge;
  const previousTop=north.bounds[1];
  north.bounds[1]=Math.min(top,previousTop);
  map.outsideExtension=(x,z)=>!(x>=left&&x<=right&&z>=top&&z<=bottom)&&(z<previousTop||outside(x,z));
  map.extensionEdge=(a,b)=>edge(a,b)||(a[1]===top&&b[1]===top&&Math.min(a[0],b[0])>=left)||
    (a[0]===left&&b[0]===left&&Math.max(a[1],b[1])<=previousTop)||(a[0]===right&&b[0]===right&&Math.min(a[1],b[1])>=top);
})();
