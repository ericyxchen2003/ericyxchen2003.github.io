// Install the shore before the shared building, traffic and routing indexes.
(()=>{
  const west=window.HKWestKowloon,north=window.HKNorth,map=window.HKMAP;
  const [left,top,right,bottom]=west.bounds,oldEnds=new Map(),fresh=new Map(west.roads.map(r=>[r.id,r]));
  const source=r=>r.osm??String(r.id).match(/\d+/)?.[0];
  for(const r of north.roads){
    const precise=west.seamCoordinates[source(r)];
    if(precise)for(const p of r.p)if(p[0]===-850&&p[1]===-1240.4)p[1]=precise;
  }
  const caps=new Map(west.eastPiers.map(([x,z,y])=>[x+','+z,y]));
  for(const pier of north.piers){
    const cap=caps.get(pier[0]+','+pier[1]);if(cap!==undefined)pier[2]=cap;
  }
  for(const d of north.decks){
    const update=west.eastDecks[d.id];if(update)Object.assign(d,update);
  }
  for(const r of [...map.roads,...north.roads])for(const p of [r.p[0],r.p.at(-1)]){
    if(p[0]===right||p[1]===top)oldEnds.set(source(r)+','+p,r);
  }
  for(const d of west.decks)for(const [a,b] of [[d.p[0],d.p[1]],[d.p.at(-1),d.p.at(-2)]]){
    const peer=oldEnds.get(source(fresh.get(d.id))+','+a.slice(0,2));if(!peer)continue;
    if(a[0]===right && a[0]!==b[0])d.westJoin={x:right,dzDx:(b[1]-a[1])/(b[0]-a[0]),oldId:peer.id,oldLayer:peer.l};
    if(a[1]===top && a[1]!==b[1])d.join={z:top,dxDz:(b[0]-a[0])/(b[1]-a[1]),oldId:peer.id,oldLayer:peer.l};
  }
  const replaced=new Set(west.seamBuildingIds);
  map.buildings=map.buildings.filter(b=>!replaced.has(b.id));
  north.buildings=north.buildings.filter(b=>!replaced.has(b.id)).concat(west.buildings);
  for(const k of ['roads','parks','paths','decks','piers','excavations','barriers','water','marks','diagonals'])north[k].push(...west[k]);
  for(const [k,rows] of Object.entries(west.nodes))north.nodes[k].push(...rows);
  north.land=west.land;map.terrain.coast=west.terrain;
  const northEnd=window.HKTaiKokTsui.bounds[1];
  map.outsideExtension=(x,z)=>x<right&&(z<northEnd||z>bottom||x<left||(x< -1800&&z< -3000));
  const at=(a,b,axis,value)=>Math.abs(a[axis]-value)<.1&&Math.abs(b[axis]-value)<.1;
  map.extensionEdge=(a,b)=>at(a,b,0,-1800)&&(a[1]+b[1])/2<=-3000 ||
    at(a,b,1,-3000)&&(a[0]+b[0])/2<=-1800 || Math.abs(a[0]-right)<.1&&Math.abs(b[0]-right)<.1&&(a[1]+b[1])/2<=northEnd ||
    (a[0]+b[0])/2<right&&Math.abs(a[1]-northEnd)<.1&&Math.abs(b[1]-northEnd)<.1;
})();
