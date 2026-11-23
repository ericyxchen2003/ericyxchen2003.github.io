/* Paired one-way carriageways in the Salisbury Road cutting. Metres, HKPD. */
window.HKUnderpass = (() => {
  "use strict";
  const mix=(a,b,t)=>a+(b-a)*t;
  const clamp=t=>Math.max(0,Math.min(1,t));
  const smooth=t=>(t=clamp(t),t*t*(3-2*t));
  function line(points){
    const distances=[0];
    for(let i=1;i<points.length;i++)distances.push(distances[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
    const length=distances.at(-1), knots=distances.map(d=>d/length);
    return {knots,length,at(t){
      let i=1;while(i<knots.length-1 && t>knots[i])i++;
      const f=(t-knots[i-1])/(knots[i]-knots[i-1]);
      return points[i].map((n,j)=>mix(points[i-1][j],n,f));
    }};
  }
  function create(sections,base){
    if(!sections)return null;
    const rows=[];
    for(const [part,pair] of sections.entries()){
      const [a,b]=pair.map(line),n=Math.ceil(Math.max(a.length,b.length)/2);
      const knots=new Set([...a.knots,...b.knots,...Array.from({length:n+1},(_,i)=>i/n)]);
      for(const t of [...knots].sort((u,v)=>u-v)){
        if(t===0 && part)continue;
        const e=a.at(t),w=b.at(t),dx=w[0]-e[0],dz=w[1]-e[1],gap=Math.hypot(dx,dz);
        const x=(e[0]+w[0])/2,z=(e[1]+w[1])/2,prev=rows.at(-1);
        if(prev && Math.hypot(x-prev.x,z-prev.z)<.02)continue;
        const s=prev?prev.s+Math.hypot(x-prev.x,z-prev.z):0;
        rows.push({x,z,s,nx:dx/gap,nz:dz/gap,halfGap:gap/2,westW:mix(2.05,3.7,smooth((x-396)/24)),part});
      }
    }
    const west=rows[0],east=rows.at(-1);
    const portalW=rows.findLast(r=>r.part===0),portalE=rows.findLast(r=>r.part===1);
    // Tie both ends to the district terrain. Interior spot heights constrain the ramps;
    // the interpolated low point leaves room for double-deckers below the junction slab.
    const anchors=[[west.x,base(west.x,west.z)],[379,3.73],[397,2.56],[435,.04],[464,-1.41],
      [482,-1.68],[554,-1.68],[577,-1.57],[592,-1.25],[612,.38],[648,2.52],[667,3.52],[east.x,base(east.x,east.z)]];
    const grade=i=>(anchors[i+1][1]-anchors[i][1])/(anchors[i+1][0]-anchors[i][0]);
    const slopes=anchors.map((_,i)=>{
      if(i===0)return grade(0);if(i===anchors.length-1)return grade(i-1);
      const a=grade(i-1),b=grade(i);return a*b>0?2*a*b/(a+b):0;
    });
    for(const r of rows){
      let i=0;while(i<anchors.length-2 && r.x>anchors[i+1][0])i++;
      const [x,y]=anchors[i],[xx,yy]=anchors[i+1],h=xx-x,t=clamp((r.x-x)/h);
      r.y=mix(y,yy,smooth(t))+h*t*(1-t)*((1-t)*slopes[i]-t*slopes[i+1]);
      r.lo=-r.halfGap-3.7-.18;r.hi=r.halfGap+r.westW+.18;
    }
    // Locate the cross-section containing a point. The tunnel curves, but every
    // cross-section faces east, so the separating lines allow a binary search.
    const along=(r,x,z)=>(x-r.x)*r.nz-(z-r.z)*r.nx;
    function locate(x,z){
      if(x<west.x-23||x>east.x+23||z<east.z-36||z>west.z+36||along(west,x,z)<0||along(east,x,z)>0)return null;
      let lo=0,hi=rows.length-1;
      while(hi-lo>1){const m=(hi+lo)>>1;if(along(rows[m],x,z)>=0)lo=m;else hi=m;}
      const a=rows[lo],b=rows[hi],d=along(a,x,z),t=clamp(d/(d-along(b,x,z)||1));
      const u=(x-mix(a.x,b.x,t))*mix(a.nx,b.nx,t)+(z-mix(a.z,b.z,t))*mix(a.nz,b.nz,t);
      return {s:mix(a.s,b.s,t),u,lo:mix(a.lo,b.lo,t),hi:mix(a.hi,b.hi,t),y:mix(a.y,b.y,t)};
    }
    function tip(s){return Math.min(s,east.s-s);}
    function floor(x,z){
      const p=locate(x,z);if(!p)return base(x,z);
      return mix(base(x,z),p.y,smooth(tip(p.s)/14));
    }
    const covered=s=>s>=portalW.s&&s<=portalE.s;
    function ground(x,z){
      const y=base(x,z),p=locate(x,z);if(!p)return y;
      const lateral=Math.max(p.lo-p.u,p.u-p.hi,0);
      const weight=smooth(tip(p.s)/45)*smooth(1-lateral/12);
      return mix(y,Math.max(y,4.8),weight);
    }
    function blocks(x,z,level,margin=0){
      const p=locate(x,z);if(!p||tip(p.s)<5)return false;
      if(level===0)return !covered(p.s)&&p.u>=p.lo-margin&&p.u<=p.hi+margin;
      if(level!==-2)return false;
      return p.u<p.lo+.13||p.u>p.hi-.13||Math.abs(p.u)<.24*smooth((tip(p.s)-5)/9);
    }
    const xy=(r,u)=>[r.x+u*r.nx,r.z+u*r.nz];
    function outline(list,pad){
      return [...list.map(r=>xy(r,r.lo-pad)),...[...list].reverse().map(r=>xy(r,r.hi+pad))];
    }
    function cutTerrain(ctx){
      ctx.save();ctx.globalCompositeOperation='destination-out';ctx.fillStyle='#000';
      for(const span of [rows.filter(r=>r.s<=portalW.s),rows.filter(r=>r.s>=portalE.s)]){
        const polygon=outline(span,.55);ctx.beginPath();ctx.moveTo(...polygon[0]);
        for(const p of polygon.slice(1))ctx.lineTo(...p);
        ctx.closePath();ctx.fill();
      }ctx.restore();
    }
    // Ground markings are separate meshes. Subtract each open trench section
    // from nearby surface paint as well as from the terrain texture.
    const cells=new Map(),cellWidth=12;
    for(let i=1;i<rows.length;i++){
      const a=rows[i-1],b=rows[i];if(covered((a.s+b.s)/2))continue;
      const quad=[xy(a,a.lo),xy(b,b.lo),xy(b,b.hi),xy(a,a.hi)];
      const xs=quad.map(p=>p[0]),zs=quad.map(p=>p[1]);
      const box=[Math.min(...xs),Math.min(...zs),Math.max(...xs),Math.max(...zs)];
      for(let k=Math.floor(box[0]/cellWidth);k<=Math.floor(box[2]/cellWidth);k++){
        if(!cells.has(k))cells.set(k,[]);
        cells.get(k).push({quad,box});
      }
    }
    function surfacePaint(poly){
      const xs=poly.map(p=>p[0]),left=Math.min(...xs),right=Math.max(...xs);
      if(right<west.x-12||left>east.x+12)return [poly];
      const zs=poly.map(p=>p[1]),top=Math.min(...zs),bottom=Math.max(...zs);
      if(bottom<east.z-20||top>west.z+20)return [poly];
      const candidates=new Set();
      for(let k=Math.floor(left/cellWidth);k<=Math.floor(right/cellWidth);k++)
        for(const item of cells.get(k)||[])candidates.add(item);
      let pieces=[poly];
      for(const {quad,box} of candidates){
        if(box[0]>=right||box[2]<=left||box[1]>=bottom||box[3]<=top)continue;
        const visible=[];
        for(let part of pieces){
          for(let i=0;i<4 && part.length>=3;i++){
            const a=quad[i],b=quad[(i+1)%4],dx=b[0]-a[0],dz=b[1]-a[1];
            const signed=p=>dx*(p[1]-a[1])-dz*(p[0]-a[0]);
            const inner=[],outer=[];
            let prev=part.at(-1),last=signed(prev);
            for(const p of part){
              const distance=signed(p);
              if((last<0)!==(distance<0)){
                const t=last/(last-distance),cross=[mix(prev[0],p[0],t),mix(prev[1],p[1],t)];
                inner.push(cross);outer.push(cross);
              }
              (distance<0?outer:inner).push(p);prev=p;last=distance;
            }
            if(outer.length>=3)visible.push(outer);
            part=inner;
          }
        }
        pieces=visible;
      }
      return pieces;
    }
    function draw(scene){
      const T=window.THREE,exterior={positions:[],colors:[]},interior={positions:[],colors:[]};
      const lamps=[],color=new T.Color(),colorsByName=new Map();
      let batch=exterior;
      function quad(a,b,c,d,tint){
        if(!colorsByName.has(tint))colorsByName.set(tint,color.set(tint).toArray());
        const rgb=colorsByName.get(tint);
        for(const p of [a,b,c,a,c,d]){batch.positions.push(...p);batch.colors.push(...rgb);}
      }
      const point=(r,u,y)=>{const [x,z]=xy(r,u);return [x,y,z];};
      const road=(r,u,dy=0)=>{const [x,z]=xy(r,u);return [x,floor(x,z)+.035+dy,z];};
      function cap(r,u){
        const [x,z]=xy(r,u);
        return Math.max(ground(x,z)+.56*smooth(tip(r.s)/15),floor(x,z)+.055);
      }
      const soffit=r=>4.04+.08*(r.s-portalW.s)/(portalE.s-portalW.s);
      for(let i=1;i<rows.length;i++){
        const a=rows[i-1],b=rows[i],s=(a.s+b.s)/2,roof=covered(s);
        batch=roof?interior:exterior;
        const darkness=clamp(Math.min(s-portalW.s,portalE.s-s)/14);
        const roadTone=['#555b5d','#52585a','#4d5355','#464c4e','#414749'][Math.round(darkness*4)];
        // At the street tie-ins the survey surface has crossfall. Tessellate
        // across as well as along the carriageway to match each wheel height.
        const strips=tip(s)<16?Math.ceil((a.hi-a.lo)/.7):1;
        for(let k=0;k<strips;k++){
          const u=k/strips,v=(k+1)/strips;
          quad(road(a,mix(a.lo,a.hi,u)),road(a,mix(a.lo,a.hi,v)),
               road(b,mix(b.lo,b.hi,v)),road(b,mix(b.lo,b.hi,u)),roadTone);
        }
        function stripe(ua,ub,width,col,lift=.016){
          quad(road(a,ua-width,lift),road(a,ua+width,lift),road(b,ub+width,lift),road(b,ub-width,lift),col);
        }
        for(const side of [-1,1]){
          const u=side<0?a.lo:a.hi,v=side<0?b.lo:b.hi;
          const topA=roof?soffit(a):cap(a,u),topB=roof?soffit(b):cap(b,v);
          const wa=point(a,u,topA),wb=point(b,v,topB);
          quad(road(a,u),road(b,v),wb,wa,roof?'#9c9d90':'#d4d0bd');
          if(!roof){
            const width=1.04,outerA=point(a,u+width*side,topA),outerB=point(b,v+width*side,topB);
            quad(wa,wb,outerB,outerA,'#dcd8c8');
            quad(outerA,outerB,point(b,v+width*side,topB-1.05),point(a,u+width*side,topA-1.05),'#b8b7a9');
            if(tip(s)>18){
              const post=a.s%6>b.s%6,ua=u+side*.43,ub=v+side*.43;
              for(const h of [.30,.77])quad(point(a,ua,topA+h),point(b,ub,topB+h),
                point(b,ub,topB+h+.047),point(a,ua,topA+h+.047),'#6d7774');
              if(post){
                const foot=point(a,ua,topA),head=point(a,ua,topA+.82);
                quad(foot,[foot[0]+.075,foot[1],foot[2]], [head[0]+.075,head[1],head[2]],head,'#586260');
              }
            }
          }
          if(tip(s)>14 && a.s%6>b.s%6){
            const join=.042,foot=road(a,u-side*.012),head=point(a,u-side*.012,topA);
            const distance=b.s-a.s,tx=(b.x-a.x)*join/distance,tz=(b.z-a.z)*join/distance;
            quad(foot,[foot[0]+tx,foot[1],foot[2]+tz],[head[0]+tx,head[1],head[2]+tz],head,'#969a93');
          }
          stripe(u-side*.25,v-side*.25,.067,'#e8e5d4');
          const laneA=side*a.halfGap,laneB=side*b.halfGap;
          if((side<0||a.westW>3.5)&&Math.floor(s/3)%3===0)stripe(laneA,laneB,.074,'#e6e3d4');
          if(roof){
            // A continuous light-coloured wall band and periodic ceiling fixtures
            // keep the covered section legible without dynamic lights.
            quad(road(a,u-side*.012,1.08),road(b,v-side*.012,1.08),road(b,v-side*.012,1.25),road(a,u-side*.012,1.25),'#d6c692');
            if(Math.floor(a.s/9)!==Math.floor(b.s/9)){
              const p=point(a,laneA-.14,soffit(a)-.045),q=point(a,laneA+.14,soffit(a)-.045);
              const r=point(b,laneB+.14,soffit(b)-.045),v=point(b,laneB-.14,soffit(b)-.045);
              for(const pt of [p,q,r,p,r,v])lamps.push(...pt);
            }
          }
        }
        const divider=(r,u,h)=>road(r,u,h*smooth((tip(r.s)-5)/9));
        if(tip(s)>5){
          for(const side of [-1,1])quad(divider(a,.23*side,0),divider(b,.23*side,0),
            divider(b,.12*side,.8),divider(a,.12*side,.8),'#b5b3a7');
          quad(divider(a,-.12,.8),divider(a,.12,.8),divider(b,.12,.8),divider(b,-.12,.8),'#d8d1ba');
        }
        if(roof)quad(point(a,a.lo,soffit(a)),point(a,a.hi,soffit(a)),point(b,b.hi,soffit(b)),point(b,b.lo,soffit(b)),'#777b79');
      }
      batch=exterior;
      for(const r of [portalW,portalE]){
        const l=r.lo-1.04,h=r.hi+1.04,y=soffit(r);
        quad(point(r,l,y),point(r,h,y),point(r,h,cap(r,h)),point(r,l,cap(r,l)),'#d7d4c8');
      }
      // Covered pavement receives only the baked tunnel lighting. Street-level
      // tree and building shadows must end at the roof.
      for(const [data,name,receive] of [[exterior,'Salisbury Road Underpass',true],[interior,'Salisbury covered carriageways',false]]){
        const geo=new T.BufferGeometry();
        geo.setAttribute('position',new T.Float32BufferAttribute(data.positions,3));
        geo.setAttribute('color',new T.Float32BufferAttribute(data.colors,3));
        geo.computeVertexNormals();
        const mesh=new T.Mesh(geo,new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}));
        mesh.name=name;mesh.receiveShadow=receive;scene.add(mesh);
      }
      const lights=new T.BufferGeometry();
      lights.setAttribute('position',new T.Float32BufferAttribute(lamps,3));
      const fixtures=new T.Mesh(lights,new T.MeshBasicMaterial({color:0xfff3d3,side:T.DoubleSide}));
      fixtures.name='Underpass ceiling lights';scene.add(fixtures);
    }
    return {floor,ground,blocks,draw,cutTerrain,surfacePaint,waterHole:outline(rows,2),rows,portalW,portalE};
  }
  return {create};
})();
