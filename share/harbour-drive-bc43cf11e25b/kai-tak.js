// Merge the apron and runway before building the game's routing and collision indexes.
(()=>{
  const data=HKKaiTak,map=HKMAP,north=HKNorth;
  // The open east bank of the bypass meets a surface lane across the old
  // sheet edge. Fit both clipped halves to its pavement at the seam.
  for(const item of [north.roads.find(r=>r.id==='tkw1453812853'),north.decks.find(d=>d.id==='tkw1453812853')]){
    const profile=item.profile||item.p,a=profile[0],b=profile.at(-1),span=Math.hypot(a[0]-b[0],a[1]-b[1]);
    for(const q of profile){const t=Math.min(1,Math.hypot(q[0]-a[0],q[1]-a[1])/span);q[2]=data.bypassBank*(1-t)+b[2]*t;}
  }
  const replaces=new Set(data.seamBuildingIds);
  const keep=b=>!replaces.has(b.id)||!b.p.some(([x,z])=>Math.abs(x-3000)<.2||Math.abs(x-2450)<.2||Math.abs(z+3840)<.2||Math.abs(z+4290)<.2);
  map.buildings=map.buildings.filter(keep);
  north.buildings=north.buildings.filter(keep).concat(data.buildings);
  const priorOpenings=new Set(HKToKwaWan.water);
  north.water=north.water.filter(p=>!priorOpenings.has(p));
  for(const key of ['roads','parks','paths','decks','piers','excavations','barriers','water','marks','diagonals'])north[key].push(...data[key]);
  // Across both map sheets, the lining is also the pavement. A shared floor
  // under the covered fork keeps the diverging lanes flush until they separate.
  const fork=data.tunnelFork,[fx,fz,fy]=fork.node;
  for(const r of north.roads.filter(r=>r.bore&&r.l===-9)){
    r.tunnelPavement=true;
    const deck=north.decks.find(d=>d.id===r.id);
    if(r.liningWidths)deck.liningHalfWidth=Math.max(...r.liningWidths)+.01;
    if(fork.sections[r.id]){
      r.liningRange=fork.sections[r.id];
      for(const path of new Set([deck.p,r.profile]))for(const p of path){
        const t=Math.max(0,Math.min(1,(Math.hypot(p[0]-fx,p[1]-fz)-19)/26));
        p[2]=fy+(p[2]-fy)*t*t*(3-2*t);
      }
    }
    // Where the branches share a surface street, also adopt its crossfall.
    if(r.id==='tkw37664009')deck.finalTies=[[2115.8,-2773.5,0,0,0,true,30]];
    if(r.id==='tkw1187954303'||r.id==='tkw1187954302')deck.finalTies=[[2097.3,-3090.8,0,0,0,true,13]];
  }
  // Both sides of the sheet seam use exactly the same cross-section.
  for(const id of [25157049,152359912]){
    const pair=north.roads.filter(r=>r.osm===id&&r.bore);
    const ends=pair.map(r=>{
      const p=r.profile,i=p[0][0]===3000?0:p.length-1,j=i===0?1:i-1;
      const sign=i===0?1:-1,dx=(p[j][0]-p[i][0])*sign,dz=(p[j][1]-p[i][1])*sign,len=Math.hypot(dx,dz);
      return {r,i,nx:-dz/len,nz:dx/len};
    });
    const [a,b]=ends,nx=a.nx+b.nx,nz=a.nz+b.nz,len=Math.hypot(nx,nz);
    for(const e of ends)(e.r.liningEnds??={})[e.i]=[nx/len,nz/len,e.r.w/2+.2,(e===a?b:a).r.id,false];
  }
  for(const [key,rows] of Object.entries(data.nodes))north.nodes[key].push(...rows);
  for(const b of data.buildings){
    if([3335073,3335074,3335075].includes(b.id)){b.n='AIRSIDE';b.en='AIRSIDE';}
  }
  north.land=data.land;map.terrain.kaiTak=data.terrain;
  north.bounds[2]=Math.max(data.bounds[2],north.bounds[2]);
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
    return [a,b].every(([x,z])=>Math.abs(dx*(z-p[1])-dz*(x-p[0]))<.2*Math.hypot(dx,dz));
  });
})();
