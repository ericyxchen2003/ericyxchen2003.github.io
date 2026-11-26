// Join Sham Shui Po to the three neighbouring survey sheets.
(()=>{
  const data=HKShamShuiPo,map=HKMAP,north=HKNorth;
  const replaces=new Set(data.seamBuildingIds);
  const keep=b=>!replaces.has(b.id)||!b.p.some(([x,z])=>Math.abs(x+1800)<.2||Math.abs(x+850)<.2||Math.abs(x+525)<.2||Math.abs(z+3840)<.2||Math.abs(z+4120)<.2);
  map.buildings=map.buildings.filter(keep);
  north.buildings=north.buildings.filter(keep).concat(data.buildings);
  for(const key of ['roads','parks','paths','decks','piers','excavations','barriers','water','marks','diagonals'])north[key].push(...data[key]);
  for(const [key,rows] of Object.entries(data.nodes))north.nodes[key].push(...rows);
  north.land=data.land;map.terrain.shamShuiPo=data.terrain;

  const previous=map.outsideExtension,edge=map.extensionEdge;
  function inside(x,z){
    let odd=false;
    for(let i=0,j=data.outline.length-1;i<data.outline.length;j=i++){
      const a=data.outline[i],b=data.outline[j];
      if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])odd=!odd;
    }
    return odd;
  }
  map.outsideExtension=(x,z)=>previous(x,z)&&!inside(x,z);
  map.extensionEdge=(a,b)=>edge(a,b)||data.outline.some((p,i)=>{
    const q=data.outline[(i+1)%data.outline.length],dx=q[0]-p[0],dz=q[1]-p[1];
    return [a,b].every(([x,z])=>x>=Math.min(p[0],q[0])-.2&&x<=Math.max(p[0],q[0])+.2&&z>=Math.min(p[1],q[1])-.2&&z<=Math.max(p[1],q[1])+.2&&Math.abs(dx*(z-p[1])-dz*(x-p[0]))<.2*Math.hypot(dx,dz));
  });
})();
