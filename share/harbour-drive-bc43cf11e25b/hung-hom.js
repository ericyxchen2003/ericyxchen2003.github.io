// Install the east sheet before navigation, terrain and collision indexes are built.
(() => {
  const map=HKMAP, north=HKNorth, east=HKHungHom;
  const [seam,top,right,bottom]=east.bounds;
  for(const d of [...map.terrain.relief.decks,...north.decks])if(east.oldDecks[d.id])d.p=east.oldDecks[d.id];
  const removedPiers=new Set((east.oldPiersRemoved||[]).map(p=>p.join(',')));
  for(const source of [map.terrain.relief,north])source.piers=source.piers.filter(p=>!removedPiers.has(p[0]+','+p[1]));
  const lifts=new Map(east.oldPiers.map(([x,z,y])=>[x+','+z,y]));
  for(const p of [...map.terrain.relief.piers,...north.piers]){
    const y=lifts.get(p[0]+','+p[1]);if(y!==undefined)p[2]=y;
  }
  const ends=new Map();
  for(const r of [...map.roads,...north.roads]) for(const p of [r.p[0],r.p.at(-1)]){
    if(p[0]===seam)ends.set((r.osm??String(r.id).match(/\d+/)?.[0])+','+p[1],r);
  }
  const roads=new Map(east.roads.map(r=>[r.id,r]));
  for(const d of east.decks) for(const [a,b] of [[d.p[0],d.p[1]],[d.p.at(-1),d.p.at(-2)]]){
    const peer=ends.get(roads.get(d.id).osm+','+a[1]);
    if(peer&&a[0]===seam&&a[0]!==b[0]){
      const far=a===d.p[0]?d.p.at(-1):d.p[0];
      d.westJoin={x:seam,dzDx:(b[1]-a[1])/(b[0]-a[0]),blend:Math.min(8,Math.abs(far[0]-seam)),oldId:peer.id,oldLayer:peer.l};
    }
  }
  const replaced=new Set(east.seamBuildingIds);
  map.buildings=map.buildings.filter(b=>!replaced.has(b.id));
  north.buildings=north.buildings.filter(b=>!replaced.has(b.id)).concat(east.buildings);
  for(const k of ['roads','parks','paths','decks','piers','excavations','barriers','water','marks','diagonals'])north[k].push(...east[k]);
  if(east.portals){
    const works=east.portals,keys=rows=>new Set(rows.map(p=>p.join(',')));
    const cuts=keys(works.oldCuts),walls=keys(works.oldBarriers);
    north.excavations=north.excavations.filter(q=>!cuts.has(q.p[0].join(',')));
    north.barriers=north.barriers.filter(q=>!walls.has(q.p[0].join(','))).concat(works.blocked);
    for(const r of [...map.roads,...north.roads])if(works.roads[r.id])r.portal=works.roads[r.id];
    for(const d of [...map.terrain.relief.decks,...north.decks])if(works.roads[d.id]){
      d.portal=works.roads[d.id];d.p=d.portal.map(p=>p.slice(0,3));
    }
  }
  for(const [k,rows] of Object.entries(east.nodes))north.nodes[k].push(...rows);
  map.terrain.hungHom=east.terrain;north.land=east.land;
  north.bounds=[north.bounds[0],north.bounds[1],right,north.bounds[3]];
  const outside=map.outsideExtension,edge=map.extensionEdge;
  map.outsideExtension=(x,z)=>outside(x,z)||(x>seam&&(z<top||z>bottom||x>right));
  east.drawWuhuSigns=(height,props,atlas,signs)=>{
    const approach=roads.get('hh844368172')?.portal,covered=roads.get('hh151396680')?.portal;
    if(!approach||!covered)return;
    const label=atlas.add((c,w,h)=>{
      c.fillStyle='#235184';c.fillRect(0,0,w,h);
      c.strokeStyle='#eaf2ee';c.lineWidth=4;c.strokeRect(4,4,w-8,h-8);
      HKDetails.lettering(c,'蕪湖街下通道',w*.43,43,'bold 56px','#fff',w*.77);
      HKDetails.lettering(c,'Wuhu Street Underpass',w*.43,94,'600 32px','#fff',w*.77);
      c.fillStyle='#fff';c.beginPath();
      for(const [i,[u,v]] of [[0,-32],[9,-32],[9,4],[23,4],[4,29],[-16,4],[-2,4],[-2,-32]].entries()){
        if(i)c.lineTo(w*.9+u,h*.51+v);else c.moveTo(w*.9+u,h*.51+v);
      }
      c.fill();
    });
    function face(row,w,h,base,advance){
      const [x,z,,nx,nz]=row,dx=nz,dz=-nx;
      const at=(u,v)=>[x+nx*u-dx*.16,base+v,z+nz*u-dz*.16];
      signs.quad(label,[at(-w/2,0),at(w/2,0),at(w/2,h),at(-w/2,h)]);
      const angle=-Math.atan2(nz,nx);
      props.add('box',x,base+h/2,z,w+.08,h+.08,.18,'#57656c',angle);
      if(advance){
        const u=row[7]+.75,px=x+nx*u,pz=z+nz*u,foot=height(px,pz),top=base+h*.57;
        props.add('pole',px,(foot+top)/2,pz,.105,top-foot+.04,.105,'#758185');
        props.add('box',x+nx*u/2,top,z+nz*u/2,u,.15,.14,'#758185',angle);
      }
    }
    const split=approach.at(-1),mouth=covered[0];
    face(split,4.35,1.28,split[2]+5.4,true);
    face(mouth,3.45,.73,mouth[2]+5.84,false);
  };
  map.extensionEdge=(a,b)=>edge(a,b)||(Math.abs(a[0]-seam)<.1&&Math.abs(b[0]-seam)<.1&&(a[1]+b[1])/2<top)||
    ((a[0]+b[0])/2>=seam&&[top,bottom].some(z=>Math.abs(a[1]-z)<.1&&Math.abs(b[1]-z)<.1));
})();
