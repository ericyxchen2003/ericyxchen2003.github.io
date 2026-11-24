// The baked shell shares vertices across the through lanes, ramps and station forks.
window.HKWestTunnels = (() => {
  const data = HKWestTunnelData, ids = new Set(data.roads);
  function unpack(text) {
    const bytes = Uint8Array.from(atob(text), c => c.charCodeAt(0));
    return new Uint16Array(bytes.buffer);
  }
  const values = unpack(data.points), points = [];
  function lid(floor, land) {
    return floor + Math.max(4.85, Math.min(5.38, land - floor - .32));
  }
  for (let i = 0; i < values.length; i += 4) {
    const x = values[i] / 100 - 700, z = values[i+1] / 50 - 1450;
    const floor = values[i+2] / 100 - 100, land = values[i+3] / 100 - 100;
    points.push({x, z, floor, ceiling: lid(floor,land), bank: Math.max(land+.36, floor+.40)});
  }
  const floorTriangles = unpack(data.floor), pavement = new Map();
  for (let i=0; i<floorTriangles.length; i+=3) {
    const [a,b,c]=[0,1,2].map(j=>points[floorTriangles[i+j]]);
    const bx=b.x-a.x,bz=b.z-a.z,cx=c.x-a.x,cz=c.z-a.z,det=bx*cz-bz*cx;
    if (Math.abs(det)<1e-8) continue;
    const tri={a,b,c,bx,bz,cx,cz,det};
    for(let x=Math.floor(Math.min(a.x,b.x,c.x)/12); x<=Math.floor(Math.max(a.x,b.x,c.x)/12); x++)
      for(let z=Math.floor(Math.min(a.z,b.z,c.z)/12); z<=Math.floor(Math.max(a.z,b.z,c.z)/12); z++){
        const key=x+','+z;
        if(!pavement.has(key)) pavement.set(key,[]);
        pavement.get(key).push(tri);
      }
  }
  function floorAt(x,z) {
    const tris=pavement.get(Math.floor(x/12)+','+Math.floor(z/12));
    if (!tris) return;
    for (const {a,b,c,bx,bz,cx,cz,det} of tris) {
      const dx=x-a.x,dz=z-a.z,u=(dx*cz-dz*cx)/det,v=(bx*dz-bz*dx)/det;
      if (u>=-1e-6 && v>=-1e-6 && u+v<=1.000001) return a.floor+u*(b.floor-a.floor)+v*(c.floor-a.floor);
    }
  }
  const walls = unpack(data.walls), openWalls = unpack(data.openWalls);
  const barriers = new Map();
  for (const edges of [walls,openWalls]) for (let j=0; j<edges.length; j+=2) {
    const a=points[edges[j]], b=points[edges[j+1]];
    for (let x=Math.floor((Math.min(a.x,b.x)-3)/16); x<=Math.floor((Math.max(a.x,b.x)+3)/16); x++) {
      for (let z=Math.floor((Math.min(a.z,b.z)-3)/16); z<=Math.floor((Math.max(a.z,b.z)+3)/16); z++) {
        const key=x+','+z;
        if (!barriers.has(key)) barriers.set(key,[]);
        barriers.get(key).push([a,b]);
      }
    }
  }
  // Clip each nearby physical wall against the oriented body, including thin
  // dividers between two parallel carriageways. Mapped portals have no wall.
  function hitsWall(x,z,yaw,level,height,halfLength,halfWidth) {
    if (level!==-1) return false;
    const nearby=barriers.get(Math.floor(x/16)+','+Math.floor(z/16));
    if (!nearby) return false;
    const fx=Math.sin(yaw), fz=-Math.cos(yaw), y=height?.surface?.(x,z,level);
    for (const [a,b] of nearby) {
      if (y+1.7<Math.min(a.floor,b.floor)||y>Math.max(a.floor,b.floor)+4.7) continue;
      const dx=b.x-a.x,dz=b.z-a.z,ax=a.x-x,az=a.z-z;
      let lo=0,hi=1;
      for (const [p,v,h] of [[ax*fx+az*fz,dx*fx+dz*fz,halfLength],[-ax*fz+az*fx,-dx*fz+dz*fx,halfWidth]]) {
        if (Math.abs(v)<1e-7) { if(Math.abs(p)>h) hi=-1; continue; }
        const t0=(-h-p)/v,t1=(h-p)/v;
        lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));
      }
      if (lo<=hi) return true;
    }
    return false;
  }
  function chaseRange(x,z,angle,range,height) {
    if(floorAt(x,z)===undefined) return range;
    const dx=Math.sin(angle),dz=Math.cos(angle);
    for(let d=.4;d<range+.32;d+=.32) {
      const at=Math.min(d,range);
      if(hitsWall(x+dx*at,z+dz*at,0,-1,height,.22,.22)) return Math.max(.4,at-.38);
    }
    return range;
  }
  function draw(scene,height) {
    const T=THREE,positions=[],colors=[],palette=new Map();
    function vertex(p,y,tint) {
      positions.push(p.x,y,p.z);
      if (!palette.has(tint)) palette.set(tint,new T.Color(tint));
      const c=palette.get(tint);colors.push(c.r,c.g,c.b);
    }
    function panel(a,b,c,d,low,high=low) {
      for(const [p,y,tint] of [[...a,low],[...b,low],[...c,high],[...a,low],[...c,high],[...d,high]]) vertex(p,y,tint);
    }
    function surface(tris,which,tint,offset=0) {
      for (const i of unpack(tris)) {const p=points[i];vertex(p,p[which]+offset,tint);}
    }
    surface(data.floor,'floor','#505354',-.018);
    surface(data.roof,'ceiling','#777a75');
    surface(data.roof,'ceiling','#a0a199',.30);
    function segment(a,b,y1,y2,shade,top=shade) {
      panel([a,y1(a)],[b,y1(b)],[b,y2(b)],[a,y2(a)],shade,top);
    }
    const sill=p=>p.floor-.22,skirt=p=>p.floor+.29,band=p=>p.floor+1.02,stripe=p=>p.floor+1.15;
    for (const [edges,covered] of [[walls,true],[openWalls,false]]) {
      for(let i=0;i<edges.length;i+=2) {
        const a=points[edges[i]],b=points[edges[i+1]],top=p=>covered?p.ceiling+.30:p.bank;
        segment(a,b,sill,p=>Math.min(skirt(p),top(p)),'#656c68','#787f77');
        if (covered) {
          segment(a,b,skirt,band,'#a3a89f','#c9cac0');
          segment(a,b,band,stripe,'#608781');
          segment(a,b,stripe,top,'#c9cac0','#a9aca5');
        } else {
          segment(a,b,skirt,top,'#b8b6a8','#c5c2b3');
          // Coping overlaps the raster excavation edge on the landward side.
          const dx=b.x-a.x,dz=b.z-a.z,k=.66/(Math.hypot(dx,dz)||1);
          const out=p=>({x:p.x+dz*k,z:p.z-dx*k});
          panel([a,top(a)],[b,top(b)],[out(b),top(b)+.04],[out(a),top(a)+.04],'#d0cdbf');
          panel([out(a),top(a)-.70],[out(b),top(b)-.70],[out(b),top(b)+.04],[out(a),top(a)+.04],'#a8a696');
        }
      }
    }
    const rims=unpack(data.rims);
    for(let i=0;i<rims.length;i+=2) segment(points[rims[i]],points[rims[i+1]],p=>p.ceiling,p=>p.ceiling+.30,'#8c938d');
    // The cut face above each mouth meets the ground mesh and hides its
    // underside while retaining both the real opening and the street overhead.
    const portals=unpack(data.portals);
    for (let i=0;i<portals.length;i+=2) {
      const a=points[portals[i]],b=points[portals[i+1]];
      const dx=b.x-a.x,dz=b.z-a.z,k=2.5/(Math.hypot(dx,dz)||1);
      const inner=p=>({x:p.x-dz*k,z:p.z+dx*k});
      const crown=p=>Math.max(p.ceiling+.46,p.bank);
      const join=(p,q)=>Math.max(p.ceiling+.37,height(q.x,q.z)+.035);
      const c=inner(b),d=inner(a);
      segment(a,b,p=>p.ceiling+.28,crown,'#9e9f95','#b7b7a9');
      panel([a,crown(a)],[b,crown(b)],[c,join(b,c)],[d,join(a,d)],'#b2b3a3');
    }
    // Light strips are part of the same static batch; no per-light draw calls.
    for(const r of HKMAP.roads) {
      if (!r.covered||!ids.has(r.id)) continue;
      let at=5;
      for(let i=1;i<r.profile.length;i++) {
        const a=r.profile[i-1],b=r.profile[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
        for(;at<len;at+=14) for(const side of [-1,1]) {
          const edge=side*Math.min(2.4,r.w*.27);
          const corner=(u,v)=>{
            const x=a[0]+(dx*(at+u)-dz*(edge+v))/len,z=a[1]+(dz*(at+u)+dx*(edge+v))/len;
            return [{x,z},lid(height.surface(x,z,-1,r.id),height(x,z))-.14];
          };
          panel(corner(-.8,-.11),corner(.8,-.11),corner(.8,.11),corner(-.8,.11),'#f9edce');
        }
        at-=len;
      }
    }
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
    const mesh=new T.Mesh(geo,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide}));
    mesh.name='Lin Cheung and West Kowloon Station tunnel shell';scene.add(mesh);
  }
  const water=HKNorthWorks.water.filter((_,i)=>!data.waterSkip.includes(i)).concat({p:data.waterOutline});
  return {ids,draw,hitsWall,water,floorAt,chaseRange};
})();
