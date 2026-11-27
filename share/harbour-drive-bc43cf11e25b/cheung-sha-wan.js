// Join the reclaimed shore and factory streets to the existing western districts.
(()=>{
  const data=HKCheungShaWan,map=HKMAP,north=HKNorth;
  const replaces=new Set(data.seamBuildingIds);
  const keep=b=>!replaces.has(b.id);
  map.buildings=map.buildings.filter(keep);
  north.buildings=north.buildings.filter(keep).concat(data.buildings);
  for(const key of ['roads','parks','paths','decks','piers','excavations','barriers','water','marks','diagonals'])north[key].push(...data[key]);
  for(const [key,rows] of Object.entries(data.nodes))north.nodes[key].push(...rows);
  north.land=data.land;map.terrain.cheungShaWan=data.terrain;
  // The northern kerb of the Caldecott Road loop runs just outside the survey sheet.
  const left=-2010,right=-1965,depth=10,top=data.terrain.z;
  map.terrain.caldecottBank=data.caldecottBank;
  for(const ring of [data.outline,...data.land.map(area=>area.p)]){
    const i=ring.findIndex(([x,z],k)=>{
      const [nextX,nextZ]=ring[(k+1)%ring.length];
      return z===top&&nextZ===top&&Math.min(x,nextX)<left&&Math.max(x,nextX)>right;
    });
    if(i<0)continue;
    const points=[[left,top],[left,top-depth],[right,top-depth],[right,top]];
    ring.splice(i+1,0,...(ring[i][0]<left?points:points.reverse()));
  }
  for(const r of data.roads)if(r.p.some(([x,z])=>x>=left&&x<=right&&z-r.w/2-1.45<top))r.edgePavement=true;

  const previous=map.outsideExtension,edge=map.extensionEdge,oldWest=north.bounds[0];
  north.bounds[0]=Math.min(oldWest,data.bounds[0]);
  function inside(x,z){
    let odd=false;
    for(let i=0,j=data.outline.length-1;i<data.outline.length;j=i++){
      const a=data.outline[i],b=data.outline[j];
      if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])odd=!odd;
    }
    return odd;
  }
  map.outsideExtension=(x,z)=>(x<oldWest||previous(x,z))&&!inside(x,z);
  map.extensionEdge=(a,b)=>edge(a,b)||data.outline.some((p,i)=>{
    const q=data.outline[(i+1)%data.outline.length],dx=q[0]-p[0],dz=q[1]-p[1];
    return [a,b].every(([x,z])=>x>=Math.min(p[0],q[0])-.2&&x<=Math.max(p[0],q[0])+.2&&z>=Math.min(p[1],q[1])-.2&&z<=Math.max(p[1],q[1])+.2&&Math.abs(dx*(z-p[1])-dz*(x-p[0]))<.2*Math.hypot(dx,dz));
  });
})();
