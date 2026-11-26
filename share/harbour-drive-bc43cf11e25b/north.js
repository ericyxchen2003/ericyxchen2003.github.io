/* Install the surveyed northern extract before any scene or routing consumers. */
(() => {
  const map=window.HKMAP, north=window.HKNorth;
  const replaced=new Set(north.remove);
  map.southBounds=map.bounds;
  const southernEnds=new Map();
  for(const r of map.roads)for(const p of [r.p[0],r.p.at(-1)]){
    if(p[1]===map.southBounds[1])southernEnds.set(p[0],r);
  }
  for(const d of north.decks){
    for(const [i,j] of [[0,1],[d.p.length-1,d.p.length-2]]){
      const a=d.p[i],b=d.p[j],old=southernEnds.get(a[0]);
      if(a[1]===map.southBounds[1]&&old&&a[1]!==b[1]){
        d.join={z:a[1],dxDz:(b[0]-a[0])/(b[1]-a[1]),oldId:old.id,oldLayer:old.l};
      }
    }
  }
  map.bounds=north.bounds;
  map.land=north.land;
  map.roads=map.roads.filter(r=>!replaced.has(r.id)).concat(north.roads);
  for(const layer of ['buildings','paths','parks'])map[layer].push(...north[layer]);
  for(const [key,entries] of Object.entries(north.nodes))map.nodes[key].push(...entries);
  map.pedestrianCrossings.push(...north.marks);
  map.diagonalCrossings.push(...north.diagonals);
  map.terrain.north=north.terrain;
  map.terrain.relief.decks.push(...north.decks);
  map.terrain.relief.piers.push(...north.piers);
  map.meta.roadSegments=map.roads.length;
  map.meta.namedRoads=new Set(map.roads.map(r=>r.en||r.n).filter(Boolean)).size;
  map.meta.roadKm=Math.round(map.roads.reduce((total,r)=>total+r.p.slice(1).reduce((a,p,i)=>a+Math.hypot(p[0]-r.p[i][0],p[1]-r.p[i][1]),0),0)/100)/10;
  map.meta.northBuildingVolumes=north.buildings.length;

  function polygonIndex(polys){
    const bins=new Map(),key=(x,z)=>Math.floor(x/32)+','+Math.floor(z/32);
    for(const poly of polys){
      const xs=poly.p.map(p=>p[0]),zs=poly.p.map(p=>p[1]);
      for(let i=Math.floor(Math.min(...xs)/32);i<=Math.floor(Math.max(...xs)/32);i++)
        for(let j=Math.floor(Math.min(...zs)/32);j<=Math.floor(Math.max(...zs)/32);j++){
          const k=i+','+j;if(!bins.has(k))bins.set(k,[]);bins.get(k).push(poly);
        }
    }
    function inside(p,x,z){
      let yes=false;
      for(let i=0,j=p.length-1;i<p.length;j=i++){
        const a=p[i],b=p[j];
        if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;
      }
      return yes;
    }
    return (x,z)=>(bins.get(key(x,z))||[]).some(q=>inside(q.p,x,z)&&!(q.holes||[]).some(p=>inside(p,x,z)));
  }
  const blocked=polygonIndex(north.barriers),excavated=polygonIndex(north.excavations.concat(window.HKHungHom?.portals?.cuts||[]));
  function cutTerrain(ctx){
    ctx.save();ctx.globalCompositeOperation='destination-out';
    for(const poly of north.excavations){
      ctx.beginPath();
      for(const ring of [poly.p,...(poly.holes||[])]){
        ctx.moveTo(...ring[0]);for(const p of ring.slice(1))ctx.lineTo(...p);ctx.closePath();
      }
      ctx.fill('evenodd');
    }
    ctx.restore();
  }
  // Each wall belongs to its carriageway. Omit a wall where another branch
  // joins at the same elevation, leaving the merge open to the vehicle.
  function tunnels(scene,height){
    const T=window.THREE,verts=[],colors=[],lanes=north.roads.filter(r=>r.bore&&!window.HKWestTunnels?.ids.has(r.id)),cells=new Map();
    const fixtureVertices=[];
    const color=new T.Color(),key=(x,z)=>Math.floor(x/24)+','+Math.floor(z/24);
    for(const r of lanes)for(let i=1;i<r.profile.length;i++){
      const path=r.portal||r.profile,a=path[i-1],b=path[i],margin=Math.max(a[7]||0,b[7]||0,r.w/2)+1,entry={r,a,b};
      for(let u=Math.floor((Math.min(a[0],b[0])-margin)/24);u<=Math.floor((Math.max(a[0],b[0])+margin)/24);u++)
        for(let v=Math.floor((Math.min(a[1],b[1])-margin)/24);v<=Math.floor((Math.max(a[1],b[1])+margin)/24);v++){
          const k=u+','+v;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(entry);
        }
    }
    function overlap(x,y,z,owner){
      return (cells.get(key(x,z))||[]).some(({r,a,b})=>{
        if(r===owner||r.l!==owner.l||owner.liningEnds&&Object.values(owner.liningEnds).some(join=>join[3]===r.id)||(r.portal&&owner.portal&&r.en===owner.en))return false;
        const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));
        return Math.abs(y-a[2]-t*(b[2]-a[2]))<1&&Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)<r.w/2+.45;
      });
    }
    function quad(a,b,c,d,shade){
      color.set(shade);for(const p of [a,b,c,a,c,d]){verts.push(...p);colors.push(color.r,color.g,color.b);}
    }
    function fixture(a,b,c,d){
      for(const p of [a,b,c,a,c,d])fixtureVertices.push(...p);
    }
    for(const r of lanes){
      const p=r.portal||r.profile,wuhu=r.portal&&r.en==='Wuhu Street underpass';
      let last,distance=0;
      for(let i=0;i<p.length;i++){
        const [x,z,y]=p[i],a=p[Math.max(0,i-1)],b=p[Math.min(p.length-1,i+1)],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
        const join=r.liningEnds?.[i],nx=join?join[0]:r.portal?p[i][3]:-dz/len,nz=join?join[1]:r.portal?p[i][4]:dx/len;
        const section=[-1,1].map(sign=>{
          const u=sign*((r.liningWidths?.[i] ?? join?.[2] ?? (r.portal?p[i][7]:r.w/2+.20))+(r.platformWidth?.(x,z,sign)||0)),xx=x+nx*u,zz=z+nz*u;
          const land=height(xx,zz),floor=r.portal?y+(1-p[i][5])*(land-height(x,z)):y;
          const rail=r.portal?p[i][6]:1;
          const top=r.covered?floor+5.55:Math.max(floor+(y-land>1?.86:.12)*rail,land+.42*rail);
          return {rail,raised:floor>land+.65,soffit:[xx,floor-.72,zz],pavement:[xx,floor+.012,zz],foot:[xx,floor-.06,zz],cap:[xx,top,zz],rim:[xx+sign*nx*.42,top+.16*rail,zz+sign*nz*.42],band:[xx,y+1.04,zz],stripe:[xx,y+1.15,zz]};
        });
        if(last){
          const previousDistance=distance;
          distance+=Math.hypot(x-p[i-1][0],z-p[i-1][1]);
          if(r.portal)quad(last[0].pavement,last[1].pavement,section[1].pavement,section[0].pavement,'#52595b');
          if(section.some(q=>q.raised)||last.some(q=>q.raised)){
            quad(last[0].soffit,section[0].soffit,section[1].soffit,last[1].soffit,'#858c86');
            for(const k of [0,1])quad(last[k].soffit,section[k].soffit,section[k].foot,last[k].foot,'#969e95');
          }
          for(const k of [0,1]){
            const q=section[k],v=last[k];
            if((r.sharedWalls?.[i] & (1<<k)) || (q.rail===0&&v.rail===0))continue;
            if(overlap((q.foot[0]+v.foot[0])/2,(q.foot[1]+v.foot[1])/2,(q.foot[2]+v.foot[2])/2,r))continue;
            quad(v.foot,q.foot,q.cap,v.cap,wuhu?(r.covered?'#626e70':'#92958c'):(r.covered?'#b6bcb1':'#bdb9a9'));
            quad(v.cap,q.cap,q.rim,v.rim,wuhu?'#b2b5aa':'#d6d3c7');
            if(wuhu&&!r.covered){
              // Close the outside of the raised coping down to the actual bank.
              const toe=q=>[q.rim[0],Math.min(q.rim[1],height(q.rim[0],q.rim[2])-.09),q.rim[2]];
              quad(v.rim,q.rim,toe(q),toe(v),'#83897f');
            }
            if(r.covered)quad(v.band,q.band,q.stripe,v.stripe,'#68958d');
            if(wuhu&&q.rail===1&&Math.floor(distance/8)!==Math.floor(previousDistance/8)){
              // Set the reflectors into the wall, clear of wheels and mirrors.
              const top=Math.min(q.cap[1]-.10,q.pavement[1]+.85),side=k===0?1:-1;
              const marker=(s,h)=>[q.cap[0]+side*nx*.025+s*dx/len,top+h,q.cap[2]+side*nz*.025+s*dz/len];
              if(top>q.pavement[1]+.16)fixture(marker(-.16,-.085),marker(.16,-.085),marker(.16,.035),marker(-.16,.035));
            }
          }
          if(r.platformWidth)quad(last[0].foot,last[1].foot,section[1].foot,section[0].foot,'#8d928b');
          if(r.covered){
            quad(last[0].cap,last[1].cap,section[1].cap,section[0].cap,'#737c79');
            quad(last[0].rim,section[0].rim,section[1].rim,last[1].rim,'#a4aaa0');
            if(i%3===1)for(const k of [0,1]){
              const sign=k===0?1:-1,u=sign*(r.w/2-1.0),origin=[x+nx*u,y+5.45,z+nz*u];
              const v=(t,s)=>[origin[0]+dx/len*t+nx*s,origin[1],origin[2]+dz/len*t+nz*s];
              if(wuhu)fixture(v(-.85,-.12),v(.85,-.12),v(.85,.12),v(-.85,.12));
              else quad(v(-.7,-.11),v(.7,-.11),v(.7,.11),v(-.7,.11),'#fff2cf');
            }
          }
        }
        if(join?.[4] || (wuhu&&r.covered&&(i===0||i===p.length-1))){
          // Face the exposed fill between the soffit and hillside. The entire
          // opening below the beam stays clear, including both shoulder strips.
          const [left,right]=section,head=q=>[q.rim[0],Math.max(q.cap[1]+1.05,height(q.rim[0],q.rim[2])+.35),q.rim[2]];
          const lintel=q=>[q.rim[0],q.cap[1],q.rim[2]];
          quad(lintel(left),lintel(right),head(right),head(left),'#87908b');
          const lip=(q,h)=>[q.rim[0],q.cap[1]+h,q.rim[2]];
          const offset=i===0?-.08:.08;
          const front=(q,h)=>[q.rim[0]+dx/len*offset,q.cap[1]+h,q.rim[2]+dz/len*offset];
          quad(lip(left,0),lip(right,0),front(right,0),front(left,0),'#465353');
          quad(front(left,0),front(right,0),front(right,.24),front(left,.24),'#c4c8bd');
          for(const [k,q] of section.entries()){
            if(r.sharedWalls?.[i===0?1:i] & (1<<k))continue;
            const post=(out,h)=>[q.cap[0]+(k?1:-1)*nx*out+dx/len*offset,q.pavement[1]+h,q.cap[2]+(k?1:-1)*nz*out+dz/len*offset];
            quad(post(0,0),post(.42,0),post(.42,5.55),post(0,5.55),'#7c8784');
          }
        }
        last=section;
      }
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
    const mesh=new T.Mesh(geo,new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}));mesh.name='Yau Ma Tei tunnel structures';scene.add(mesh);
    if(fixtureVertices.length){
      const lights=new T.BufferGeometry();
      lights.setAttribute('position',new T.Float32BufferAttribute(fixtureVertices,3));
      const fixtures=new T.Mesh(lights,new T.MeshBasicMaterial({color:0xffe7b5,side:T.DoubleSide}));
      fixtures.name='Wuhu underpass guide lights';scene.add(fixtures);
    }
    window.HKWestTunnels?.draw(scene,height);
  }
  window.HKNorthWorks={blocked,excavated,cutTerrain,tunnels,water:north.water};
})();
