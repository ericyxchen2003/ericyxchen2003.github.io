// Install the surveyed sheet before construction of the road and collision indexes.
(() => {
  const data=HKKowloonTong, map=HKMAP, north=HKNorth;
  const [left,top,right,bottom]=data.bounds;
  const replaced=new Set(data.seamBuildingIds);
  const keep=b=>!replaced.has(b.id)||!b.p.some(([x,z])=>Math.abs(z-bottom)<.15||Math.abs(x-HKKowloonCity.bounds[0])<.15||Math.abs(z-HKKowloonCity.bounds[1])<.15);
  map.buildings=map.buildings.filter(keep);
  north.buildings=north.buildings.filter(keep).concat(data.buildings);
  for(const k of ['roads','parks','paths','decks','piers','excavations','barriers','water','marks','diagonals'])north[k].push(...data[k]);
  for(const [key,rows] of Object.entries(data.nodes))north.nodes[key].push(...rows);
  // The two traced Waterloo flyover axes share a reversible carriageway.
  // Match the adjoining two running lanes in each direction for fixed game traffic.
  for(const r of [...map.roads,...north.roads]){
    if(r.id===767525155||r.id===767525161){r.w=6.3;r.lanes=2;}
  }
  for(const d of [...map.terrain.relief.decks,...north.decks]){
    if([767525155,98547380,888280085,888280086].includes(d.id)){
      d.w=6.3;delete d.edges;
    }
  }
  const byId=new Map(north.decks.map(d=>[d.id,d]));
  // Reconcile the common asphalt at the tidal flyover median before meshing
  // either carriageway. Taper out before both independent approach banks.
  const historical=[98547380,767525155,888280085,888280086,888280083,888280084,98547382,484579024];
  const paired=historical.map(id=>byId.get(id)).filter(Boolean);
  const original=paired.map(d=>d.p.map(p=>p.slice()));
  for(const [i,d] of paired.entries())for(const p of d.p){
    let gap=Infinity,peerY=p[2];
    for(const [j,rows] of original.entries()){
      if(j===i)continue;
      for(let k=1;k<rows.length;k++){
        const a=rows[k-1],b=rows[k],dx=b[0]-a[0],dz=b[1]-a[1];
        if((original[i].at(-1)[1]-original[i][0][1])*dz>=0)continue;
        const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz)));
        const distance=Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz);
        if(distance<gap){gap=distance;peerY=a[2]+t*(b[2]-a[2]);}
      }
    }
    const fade=Math.max(0,Math.min(1,(p[1]+3599)/18,(-3430-p[1])/20));
    if(gap<9)p[2]+=(peerY-p[2])*.5*fade;
  }
  const changedEnds=new Map(paired.flatMap(d=>[d.p[0],d.p.at(-1)]).map(([x,z,y])=>[x+','+z,y]));
  for(const d of north.decks){
    if(paired.includes(d))continue;
    for(const end of [d.p[0],d.p.at(-1)]){
      const y=changedEnds.get(end[0]+','+end[1]);
      if(y===undefined)continue;
      const diff=y-end[2];
      for(const p of d.p)p[2]+=diff*Math.max(0,1-Math.hypot(p[0]-end[0],p[1]-end[1])/16);
    }
  }
  map.terrain.kowloonTong=data.terrain;
  north.land=data.land;
  const outside=map.outsideExtension, edge=map.extensionEdge;
  const previousTop=north.bounds[1];
  north.bounds[1]=Math.min(top,previousTop);
  map.outsideExtension=(x,z)=>!(x>=left&&x<=right&&z>=top&&z<=bottom)&&(z<previousTop||outside(x,z));
  map.extensionEdge=(a,b)=>edge(a,b)||[0,1,2,3].some(i=>a[i%2]===data.bounds[i]&&b[i%2]===data.bounds[i]);
})();
