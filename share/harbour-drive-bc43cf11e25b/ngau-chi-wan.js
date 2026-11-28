// Install the surveyed sheet before construction of the road and collision indexes.
(() => {
  const data=HKNgauChiWan, map=HKMAP, north=HKNorth;
  const [left,top,right,bottom]=data.bounds;
  const replaced=new Set(data.seamBuildingIds);
  const keep=b=>!replaced.has(b.id);
  map.buildings=map.buildings.filter(keep);
  north.buildings=north.buildings.filter(keep).concat(data.buildings);
  for(const k of ['roads','parks','paths','decks','piers','excavations','barriers','water','marks','diagonals'])north[k].push(...data[k]);
  for(const [key,rows] of Object.entries(data.nodes))north.nodes[key].push(...rows);
  map.terrain.ngauChiWan=data.terrain;
  const inherited=north.decks.find(d=>d.id==='kai312042456');
  inherited.p=data.seamProfile;
  const slip=north.decks.find(d=>d.id==='kai831230263');
  slip.p=data.slipProfile;
  slip.landings=[];
  north.decks.find(d=>d.id==='kai156581180').landings[0][2]=data.adjacentLanding;
  for(const [x,z,y] of data.seamPiers){
    const pier=north.piers.find(p=>p[0]===x&&p[1]===z);
    if(pier)pier[2]=y;
  }
  north.land=data.land;
  const outside=map.outsideExtension, edge=map.extensionEdge;
  const inside=(x,z)=>x>=left&&x<=right&&z>=top&&z<=bottom;
  map.outsideExtension=(x,z)=>!inside(x,z)&&outside(x,z);
  map.extensionEdge=(a,b)=>edge(a,b)||[0,1,2,3].some(i=>a[i%2]===data.bounds[i]&&b[i%2]===data.bounds[i]&&inside(...a)&&inside(...b));
})();
