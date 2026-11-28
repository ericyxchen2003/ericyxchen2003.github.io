// Extend the land mask and road network across the Rambler Channel.
(()=>{
  const data=HKStonecutters,map=HKMAP,north=HKNorth;
  for(const d of north.decks){
    const rows=data.neighbourFans?.[d.id];if(rows)(d.fans??=[]).push(...rows);
  }
  for(const key of ['roads','parks','paths','decks','piers','excavations','barriers','water','marks','diagonals'])north[key].push(...data[key]);
  north.barriers.push(...(data.yardBarriers||[]));
  for(const [key,rows] of Object.entries(data.nodes))north.nodes[key].push(...rows);
  north.land=data.land;map.terrain.stonecutters=data.terrain;
  data.contains=inside;
  const previous=map.outsideExtension,edge=map.extensionEdge,oldWest=north.bounds[0];
  north.bounds[0]=Math.min(oldWest,data.bounds[0]);
  north.bounds[1]=Math.min(north.bounds[1],data.bounds[1]);
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
