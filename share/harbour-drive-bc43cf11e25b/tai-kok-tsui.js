// Merge the surveyed western parcels before the vehicle and scene indexes are built.
(() => {
  const west = window.HKTaiKokTsui, north = window.HKNorth;
  const boundary=west.bounds[2], oldEnds=new Map();
  for(const r of north.roads)for(const p of [r.p[0],r.p.at(-1)]){
    if(p[0]===boundary)oldEnds.set(r.osm+','+p[1],r);
  }
  const roads=new Map(west.roads.map(r=>[r.id,r]));
  for(const d of west.decks){
    for(const [a,b] of [[d.p[0],d.p[1]],[d.p.at(-1),d.p.at(-2)]]){
      if(a[0]!==boundary||a[0]===b[0])continue;
      const peer=oldEnds.get(roads.get(d.id).osm+','+a[1]);
      if(peer)d.westJoin={x:boundary,dzDx:(b[1]-a[1])/(b[0]-a[0]),oldId:peer.id,oldLayer:peer.l};
    }
  }
  const seamBuildings = new Set(west.seamBuildingIds);
  north.buildings = north.buildings.filter(b => !seamBuildings.has(b.id)).concat(west.buildings);
  for (const k of ['roads','parks','paths','decks','piers','excavations','barriers','water','marks','diagonals'])
    north[k].push(...west[k]);
  for (const [type,rows] of Object.entries(west.nodes)) north.nodes[type].push(...rows);
  const [left,top,right,bottom]=west.bounds;
  // The survey footprint is L-shaped. Keep the exposed ends of both sheets
  // as map boundaries, including where a road ends on land.
  window.HKMAP.outsideExtension=(x,z)=>x<right && (x<left||z<top||z>bottom);
  window.HKMAP.extensionEdge=(a,b)=>{
    const x=(a[0]+b[0])/2,z=(a[1]+b[1])/2;
    if(Math.abs(a[0]-right)<.1 && Math.abs(b[0]-right)<.1)return z<=top||z>=bottom;
    return x<right && [top,bottom].some(v=>Math.abs(a[1]-v)<.1&&Math.abs(b[1]-v)<.1);
  };
  north.bounds = [left, ...north.bounds.slice(1)];
  north.land = west.land;
  window.HKMAP.terrain.west = west.terrain;
})();
