// Special elevations share the mapped footprints and roof datums of the survey blocks.
window.HKCoastModels=(()=>{
  const T=THREE, museum=283356, station=297176, tower=201050, mplus=311046;
  const bronzeArch=new Set([203837,203838,203839,203840,235737]);
  const museumBase=291490;
  const igcTowers=new Set([297272,297273,295992,297178]);
  const custom=new Set([museum,museumBase,station,tower,mplus,...igcTowers]);
  const curbLabels=new Map([
    [museum,['香港故宮文化博物館','HONG KONG PALACE MUSEUM','#89704e']],
    [station,['香港西九龍站','Hong Kong West Kowloon Station','#28474e']],
    [272633,['圓方','E L E M E N T S','#714e37']],
    [111537,['九龍站','Kowloon Station','#1b645c']],
    [310911,['自由空間','FREESPACE','#353e41']]
  ]);
  let atlas,surface,roofFinish,lightFinish;
  const lettering=new Map();
  function sign(text){
    const key=text.join('|');
    if(!lettering.has(key)){
      atlas??=HKDetails.atlas();
      lettering.set(key,atlas.add((ctx,w,h)=>{
        ctx.fillStyle=text[2];ctx.fillRect(0,0,w,h);
        HKDetails.lettering(ctx,text[0],w/2,45,'bold 43px','#fff8e4',w-18);
        HKDetails.lettering(ctx,text[1],w/2,94,'bold 24px','#fff7e6',w-16);
      }));
    }
    return lettering.get(key);
  }
  function faces(p){
    const area=p.reduce((a,v,i)=>{const q=p[(i+1)%p.length];return a+v[0]*q[1]-v[1]*q[0];},0);
    return p.map((v,i)=>{
      const q=p[(i+1)%p.length],dx=q[0]-v[0],dz=q[1]-v[1],w=Math.hypot(dx,dz);
      const turn=Math.atan2(dz,dx)+(area>0?Math.PI:0),c=Math.cos(turn),s=Math.sin(turn);
      const at=(u,y,d)=>[(v[0]+q[0])/2+c*u-s*d,y,(v[1]+q[1])/2+s*u+c*d];
      return {w,at,angle:-turn,nz:c};
    }).filter(f=>f.w>.1);
  }
  function plate(face,props,u,y,d,w,h,depth,color){
    props.add('box',...face.at(u,y,d),w,h,depth,color,face.angle);
  }
  function badge(f,signs,y,d,w,h,text){
    signs.quad(sign(text),[f.at(-w/2,y-h/2,d),f.at(w/2,y-h/2,d),f.at(w/2,y+h/2,d),f.at(-w/2,y+h/2,d)]);
  }
  // A shared material and one indexed stream-local mesh per shell bound the number of draws.
  function shell(name,group,roof=false){
    const positions=[],colors=[],uv=[],shades=new Map();
    function tri(a,b,c,color){
      if(!shades.has(color))shades.set(color,new T.Color(color));
      const shade=shades.get(color);
      for(const p of [a,b,c]){
        positions.push(...p);colors.push(shade.r,shade.g,shade.b);
        if(roof==='pavers')uv.push(p[0]/12,p[2]/12);
        else if(roof)uv.push((p[0]+605)/220,1-(p[2]+1050)/275);
      }
    }
    const quad=(a,b,c,d,col)=>{tri(a,b,c,col);tri(a,c,d,col);};
    function finish(unlit=false){
      const g=new T.BufferGeometry();
      g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
      g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
      if(roof)g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
      g.computeVertexNormals();
      surface??=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
      let material=roof==='pavers'?terrazzo():roof?stationFinish():surface;
      if(unlit){lightFinish??=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});material=lightFinish;}
      const m=new T.Mesh(g,material);m.name=name;group.add(m);
    }
    return {tri,quad,finish};
  }
  function cap(mesh,ring,color){
    for(const [i,j,k] of T.ShapeUtils.triangulateShape(ring.map(p=>new T.Vector2(p[0],p[2])),[]))
      mesh.tri(ring[k],ring[j],ring[i],color);
  }
  function stationFinish(){
    if(roofFinish)return roofFinish;
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;
    const ctx=canvas.getContext('2d');
    // Ribbons of rooftop planting flank arched runs of glazing. Map them in one plan
    // coordinate system so both halves of the former survey-sheet seam line up.
    const pixels=ctx.createImageData(1024,1024),palette=[[229,232,222],[114,145,94],[189,197,185],
      [145,162,153],[193,208,204],[102,138,151],[119,155,164]];
    for(let y=0;y<1024;y++){
      const t=y/1024,bend=160*Math.sin(t*2.45-.35)+145*t;
      for(let x=0;x<1024;x++){
        const u=((x-bend)%285+285)%285,index=u<9||u>275?0:u<64?1:u<77?2:u<103?3:
          u%25<2.8||y%38<2.5?4:(Math.floor(u/25)+Math.floor(y/38))%3===0?5:6;
        const col=palette[index],i=(y*1024+x)*4;
        pixels.data[i]=col[0];pixels.data[i+1]=col[1];pixels.data[i+2]=col[2];pixels.data[i+3]=255;
      }
    }
    ctx.putImageData(pixels,0,0);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
    return roofFinish=new T.MeshLambertMaterial({map:texture,vertexColors:true,side:T.DoubleSide});
  }
  function terminal(b,group,props,signs){
    const roof=shell('香港西九龍站 · 弧形天幕',group,true),walls=shell('香港西九龍站 · 玻璃幕牆',group);
    const shape=p=>{const [x,z]=p,t=Math.max(0,Math.min(1,(z+1048)/270)),axis=-495-23*Math.sin(t*Math.PI);
      const arch=Math.max(0,1-((x-axis)/137)**2);
      // The glazed hall rises over the concourse and falls towards the public plaza.
      const spine=Math.sin(Math.PI*Math.min(1,.13+.87*t));
      return [x,7.6+spine*(13+17*arch)+1.25*spine*Math.cos((x-axis)/23+t*3),z];};
    function patch(a,b,c){
      const edges=[[a,b,c],[b,c,a],[c,a,b]].sort((u,v)=>Math.hypot(v[0][0]-v[1][0],v[0][1]-v[1][1])-Math.hypot(u[0][0]-u[1][0],u[0][1]-u[1][1]));
      const [s,e,q]=edges[0];
      if(Math.hypot(s[0]-e[0],s[1]-e[1])<12){roof.tri(shape(a),shape(c),shape(b),'#ffffff');return;}
      const m=[(s[0]+e[0])/2,(s[1]+e[1])/2];patch(s,m,q);patch(m,e,q);
    }
    const rings=[b.p,...(b.holes||[])],flat=rings.flat();
    for(const [a,c,d] of T.ShapeUtils.triangulateShape(rings[0].map(q=>new T.Vector2(...q)),rings.slice(1).map(r=>r.map(q=>new T.Vector2(...q)))))patch(flat[a],flat[c],flat[d]);
    for(const ring of rings)for(const f of faces(ring)){
      const n=Math.ceil(f.w/4.4);
      for(let i=0;i<n;i++){
        const u=f.w*(i/n-.5),v=f.w*((i+1)/n-.5),point=(s,d)=>{const [x,,z]=f.at(s,0,d);return shape([x,z]);};
        const a=point(u,0),c=point(v,0),floor=b.basePD,band=(p,y)=>[p[0],y,p[2]];
        const af=band(a,floor),cf=band(c,floor);
        const glazing=(p,t)=>[p[0],floor+(p[1]-floor)*t,p[2]];
        walls.quad(af,cf,c,a,i%4===0?'#64838c':'#77959b');
        for(const t of [.24,.50,.74]){
          const s=glazing(a,t),e=glazing(c,t);
          walls.quad(s,e,band(e,e[1]+.09),band(s,s[1]+.09),'#9caeb0');
        }
        if(i%3===0){
          const left=point(u+.16,.12),right=point(v-.16,.12);
          walls.quad(band(left,floor+.18),band(left,floor+.84),band(right,right[1]-.7),band(right,right[1]-.06),'#b6c5c1');
        }
        walls.quad(band(a,a[1]-.65),band(c,c[1]-.65),c,a,'#c5c8ba');
        const post=point(u+.20,.035);walls.quad(band(a,floor),band(post,floor),post,a,'#c4ccc8');
      }
    }
    const front=faces(b.p).filter(f=>f.w>19&&f.nz>.1).sort((a,b)=>b.w-a.w)[0];
    if(front&&b.p.length>20)badge(front,signs,b.basePD+5,.13,18,2.1,curbLabels.get(station));
    roof.finish();walls.finish();
  }
  function layered(b,group,levels,palette,name){
    const mesh=shell(name,group),p=b.p,cx=p.reduce((s,q)=>s+q[0],0)/p.length,cz=p.reduce((s,q)=>s+q[1],0)/p.length;
    const ring=(t,s)=>p.map(q=>[cx+(q[0]-cx)*s,b.basePD+t*b.h,cz+(q[1]-cz)*s]);
    const bands=levels.map(([t,s])=>ring(t,s));
    const mix=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
    for(let j=1;j<bands.length;j++)for(let i=0;i<p.length;i++){
      const k=(i+1)%p.length,lo=bands[j-1],hi=bands[j],length=Math.hypot(p[i][0]-p[k][0],p[i][1]-p[k][1]),count=Math.ceil(length/(b.id===tower?2.65:2.1));
      for(let n=0;n<count;n++){
        const l=n/count,r=(n+1)/count,m=l+(r-l)*(b.id===tower?.065:.12),quad=(u,v,col)=>mesh.quad(mix(lo[i],lo[k],u),mix(lo[i],lo[k],v),mix(hi[i],hi[k],v),mix(hi[i],hi[k],u),col);
        quad(l,m,palette[j-1][1]);quad(m,r,palette[j-1][0]);
      }
    }
    cap(mesh,bands.at(-1),palette.at(-1)[1]);mesh.finish();
  }
  function gallery(b,group,props,signs){
    layered(b,group,[[0,.76],[.20,.78],[.27,.79],[.68,.96],[.72,.967],[1,1]],
      [['#b5a080','#a58c6a'],['#455855','#9c8b6e'],['#cbb48c','#ae946d'],['#947f63','#ad9676'],['#d6c09c','#b7a07d']],'香港故宮文化博物館 · 金屬外殼');
    const p=b.p,cx=p.reduce((s,q)=>s+q[0],0)/p.length,cz=p.reduce((s,q)=>s+q[1],0)/p.length;
    const lower=faces(p.map(([x,z])=>[cx+.77*(x-cx),cz+.77*(z-cz)]));
    const f=lower.sort((a,b)=>b.w-a.w)[0];badge(f,signs,b.basePD+4,.12,Math.min(24,f.w*.64),2.1,curbLabels.get(museum));
  }
  function atriums(b,group){
    const mesh=shell('故宮 · 三向中庭',group),p=b.p;
    const cx=p.reduce((s,q)=>s+q[0],0)/p.length,cz=p.reduce((s,q)=>s+q[1],0)/p.length;
    const widths=[[0,.76],[.20,.78],[.27,.79],[.68,.96],[.72,.967],[1,1]];
    function width(t){
      const i=widths.findIndex(q=>q[0]>=t),a=widths[i-1]||widths[0],c=widths[i];
      return a[1]+(c[1]-a[1])*(t-a[0])/(c[0]-a[0]||1);
    }
    const sides=faces(p),used=new Set();
    for(const [ax,az,lo,hi] of [[1,0,.06,.22],[0,1,.29,.47],[-1,0,.65,.84]]){
      const face=sides.filter(f=>f.w>12&&!used.has(f)).sort((a,c)=>{
        const score=f=>{const v=f.at(0,0,1),q=f.at(0,0,0);return ((v[0]-q[0])*ax+(v[2]-q[2])*az)*Math.sqrt(f.w);};return score(c)-score(a);
      })[0];if(!face)continue;used.add(face);
      const at=(u,t)=>{const q=face.at(u,0,.28);return [cx+(q[0]-cx)*width(t),b.basePD+b.h*t,cz+(q[2]-cz)*width(t)];};
      const w=face.w*.68;
      for(let i=0;i<10;i++){
        const l=w*(i/10-.5),r=l+w/10;
        mesh.quad(at(l,lo),at(r,lo),at(r,hi),at(l,hi),i%3?'#4e6664':'#586f6b');
        mesh.quad(at(l,lo),at(l+.15,lo),at(l+.15,hi),at(l,hi),'#a18d6f');
      }
      mesh.quad(at(-w/2,lo),at(w/2,lo),at(w/2,lo+.014),at(-w/2,lo+.014),'#c4ac88');
    }
    mesh.finish();
  }
  function mallBase(b,group,props){
    layered(b,group,[[0,1],[.12,1],[.81,1],[1,1]],
      [['#a99c83','#b7a78c'],['#607774','#b8aa90'],['#c0ac8d','#cfc0a4']],'香港故宮 · 海濱平台');
    for(const f of faces(b.p).filter(q=>q.w>14))
      plate(f,props,0,b.top+.28,-.1,f.w,.55,.34,'#c1b59d');
  }
  function arch(group){
    const mesh=shell('凱旋門 · 空中會所',group);
    for(const part of window.HKArchPlates||[]){
      const top=part.high+4.7,low=part.low+4.7;
      const ring=part.p.map(p=>[p[0],top,p[1]]);
      cap(mesh,ring,'#a29984');
      for(const f of faces(part.p)){
        mesh.quad(f.at(-f.w/2,low,0),f.at(f.w/2,low,0),f.at(f.w/2,top,0),f.at(-f.w/2,top,0),'#867d70');
        for(let y=low+2;y<top;y+=3.3)mesh.quad(f.at(-f.w/2,y,.03),f.at(f.w/2,y,.03),f.at(f.w/2,y+1.4,.03),f.at(-f.w/2,y+1.4,.03),'#657a79');
      }
    }
    mesh.finish();
  }
  function offices(b,group,props){
    const levels=[[0,.96],[.10,1],[.49,1],[.50,.993],[.83,.99],[.87,.965],[1,.95]];
    const shades=levels.slice(1).map((v,i)=>[i===2?'#667d78':'#819b9b','#b1beb6']);
    layered(b,group,levels,shades,'環球匯 · 高鐵西九龍站上蓋');
    const ring=b.p,cx=ring.reduce((s,p)=>s+p[0],0)/ring.length,cz=ring.reduce((s,p)=>s+p[1],0)/ring.length;
    for(const f of faces(ring.map(([x,z])=>[cx+(x-cx)*.95,cz+(z-cz)*.95])).filter(q=>q.w>12))
      plate(f,props,0,b.top-.65,.06,f.w,1.3,.28,'#bcc9bd');
  }
  function icc(b,group){
    const levels=[[0,.89],[.045,1],[.17,.985],[.177,.983],[.43,.966],[.437,.965],[.68,.943],[.687,.941],[.91,.917],[.916,.916],[.974,.898],[1,.84]];
    const colors=levels.slice(1).map((v,i)=>[i===2||i===4||i===6||i===8?'#566b73':i===0?'#829fa9':i===10?'#99afb5':'#6f929f','#bacdd0']);
    layered(b,group,levels,colors,'環球貿易廣場 · 收分玻璃塔身');
  }
  let pavingMaterial;
  function terrazzo(){
    if(pavingMaterial)return pavingMaterial;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
    const ctx=canvas.getContext('2d'),stone=['#d4cbb8','#ded6c4','#d9d0bf','#d7cfbd'];
    ctx.fillStyle='#b8ae9c';ctx.fillRect(0,0,256,256);
    for(let r=0;r<8;r++)for(let c=-1;c<5;c++){
      const x=c*64+(r%2)*32;ctx.fillStyle=stone[(r*3+c+8)%4];ctx.fillRect(x+1,r*32+1,63,31);
    }
    const tex=new T.CanvasTexture(canvas);tex.wrapS=tex.wrapT=T.RepeatWrapping;
    tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
    return pavingMaterial=new T.MeshLambertMaterial({map:tex,vertexColors:true,side:T.DoubleSide});
  }
  function horizontal(mesh,poly,y,tint){
    const loops=[poly.p,...(poly.holes||[])].map(r=>r.map(q=>new T.Vector2(...q)));
    const faces=T.ShapeUtils.triangulateShape(loops[0],loops.slice(1)),flat=loops.flat();
    for(const tri of faces){
      const [a,b,c]=tri.map(i=>[flat[i].x,y,flat[i].y]);mesh.tri(c,b,a,tint);
    }
  }
  function terrace(b,group,props){
    const data=HKWestKowloon.elements,y=b.top,tile=shell('圓方 · 平台鋪面',group,'pavers');
    horizontal(tile,b,y,'#ffffff');tile.finish();
    const mesh=shell('圓方 · 平台花園及通道',group);
    for(const [kind,regions] of Object.entries(data.roof)){
      const lift=kind==='garden'?.30:kind==='walk'?.05:.035;
      for(const poly of regions){
        horizontal(mesh,poly,y+lift,{walk:'#eee4cd',drive:'#777876',garden:'#648257',pitch:'#788f82'}[kind]);
        if(kind==='pitch'&&poly.p.length===4){
          const corners=[...poly.p];
          const length=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
          if(length(corners[0],corners[1])<length(corners[0],corners[3]))corners.push(corners.shift());
          const [a,c,,d]=corners;
          const court=(u,v,h)=>[a[0]+(c[0]-a[0])*u+(d[0]-a[0])*v,y+h,a[1]+(c[1]-a[1])*u+(d[1]-a[1])*v];
          const mark=(u,v,r,s)=>mesh.quad(court(u,v,.067),court(r,v,.067),court(r,s,.067),court(u,s,.067),'#f1eee5');
          for(const v of [.10,.20,.80,.90])mark(.09,v,.91,v+.008);
          for(const u of [.09,.91])mark(u,.10,u+.004,.905);
          for(const u of [.275,.725])mark(u,.20,u+.004,.805);
          mark(.275,.497,.725,.505);
          mesh.quad(court(.5,.08,.78),court(.5,.92,.78),court(.5,.92,.87),court(.5,.08,.87),'#eceadb');
        }
        if(kind==='garden')for(const ring of [poly.p,...(poly.holes||[])])for(const f of faces(ring))
          mesh.quad(f.at(-f.w/2,y+.01,0),f.at(f.w/2,y+.01,0),f.at(f.w/2,y+lift,0),f.at(-f.w/2,y+lift,0),'#b6aa92');
      }
    }
    for(const [x,z] of data.trees){
      const r=1.5+Math.abs(x+z)%5*.14;
      props.add('pole',x,y+1.45,z,.13,2.8,.13,'#806e57');
      props.add('crown',x,y+3.35,z,r,r*.87,r,'#648356');
    }
    mesh.finish();
  }
  function elementsBlock(b,group,props,signs,height){
    const kind=b.podiumPart,upper=kind==='upper',inside=kind==='hall',pier=kind==='pier';
    const label={upper:'商場上蓋',hall:'車站環迴路側牆',pier:'車道支柱',plinth:'住宅塔座基座'}[kind];
    const mesh=shell('圓方 · '+label,group),y=b.basePD,top=b.top;
    for(const ring of [b.p,...(b.holes||[])])for(const f of faces(ring)){
      const start=-f.w/2,end=f.w/2;
      const strip=(u,v,lo,hi,d,c)=>mesh.quad(f.at(u,lo,d),f.at(v,lo,d),f.at(v,hi,d),f.at(u,hi,d),c);
      const paint=upper?'#ada699':pier?'#ccc6b8':inside?'#d5cdbb':'#b8ae9b';
      const [x,,z]=f.at(0,0,0);
      strip(start,end,inside||pier?Math.min(y,height(x,z)-.45):y,top,0,paint);
      if(upper){
        strip(start,end,top-1.15,top-.82,.035,'#cfcabe');
        strip(start,end,y+.48,y+.67,.035,'#968b7b');
      }else if(inside||pier){
        strip(start,end,7.18,7.39,.025,'#95805e');
        strip(start,end,7.42,7.53,.026,'#a69c81');
        if(inside)for(let u=start+2.8;u<end-.01;u+=2.8)
          strip(u,Math.min(end,u+.034),7.54,top-.05,.018,'#b3a997');
        if(inside&&f.w>48){
          badge(f,signs,10,.08,5.6,.97,['圓方　九龍站','ELEMENTS  ·  KOWLOON STATION','#355451']);
        }
      }
    }
    if(upper){
      horizontal(mesh,b,y,'#c9c7bd');
      terrace(b,group,props);
      for(const island of HKWestKowloon.elements.islands){
        const [x,z]=island.p[0],floor=height(x,z);
        horizontal(mesh,island,floor+.15,'#b4aa92');
        for(const f of faces(island.p))
          mesh.quad(f.at(-f.w/2,floor-.04,0),f.at(f.w/2,floor-.04,0),f.at(f.w/2,floor+.15,0),f.at(-f.w/2,floor+.15,0),'#ded3b9');
      }
      const lights=shell('圓方 · 車道照明',group);
      for(const [i,[x,z,turn]] of HKWestKowloon.elements.lights.entries()){
        const along=Math.cos(turn),across=Math.sin(turn);
        const at=(u,v)=>[x+u*along-v*across,y-.25,z+u*across+v*along];
        props.add('box',x,y-.12,z,3.95,.24,.58,'#8f9391',-turn);
        lights.quad(at(-1.85,-.16),at(1.85,-.16),at(1.85,.16),at(-1.85,.16),'#fff3d9');
        if(i%2===0)props.add('box',x+3.8*along,y-.19,z+3.8*across,.56,.38,9.3,'#abb0a7',-turn);
      }
      lights.finish(true);
    }else if(kind==='plinth')horizontal(mesh,b,top,'#b3aa97');
    mesh.finish();
  }
  function building(b,props,signs,height,group){
    if(b.podiumPart){elementsBlock(b,group,props,signs,height);return;}
    if(b.foundation||!b.p?.length||b.h<3)return;
    if(b.id===station){terminal(b,group,props,signs);return;}
    if(b.id===museum){gallery(b,group,props,signs);atriums(b,group);return;}
    if(b.id===museumBase){mallBase(b,group,props);return;}
    if(igcTowers.has(b.id)){offices(b,group,props);return;}
    if(b.id===203839)arch(group);
    if(b.id===tower){icc(b,group);return;}
    const estate=bronzeArch.has(b.id)?['#928167','#b29679']:b.en?.startsWith('The Cullinan')?['#7898ab','#aebbc8']:b.en?.startsWith('Sorrento')?['#82998d','#c2c7b7']:b.en?.startsWith('The Harbourside')?['#76999f','#bdc9c0']:b.en?.startsWith('The Waterfront')?['#c7b8a1','#dbcebb']:null;
    if(!estate&&![mplus,279107,272633,111537,81117,310911].includes(b.id))return;
    const f=faces(b.p),long=[...f].sort((a,b)=>b.w-a.w)[0],top=b.top,base=b.basePD;
    if(b.id===mplus){
      layered(b,group,[[0,1],[1,1]],[['#4a6765','#6e8981']],'M+ · 海港幕牆');
      for(const face of f)for(let y=base+.8;y<top;y+=1.22)plate(face,props,0,y,.12,face.w,.24,.35,'#6e8178');
      const south=f.filter(s=>s.nz>.7).sort((a,b)=>b.w-a.w)[0];
      if(south){
        const pattern=['100010000','110110010','101010010','100010111','100010010','100010010'];
        pattern.forEach((row,j)=>[...row].forEach((cell,i)=>{if(cell==='1')plate(south,props,(i-4)*2.15,base+39-j*2.15,.42,2.06,1.82,.12,'#cddacb');}));
      }
    }else if(estate){
      for(const face of f.filter(s=>s.w>7)){
        plate(face,props,face.w*.34,base+b.h*.52,.07,.48,b.h*.94,.23,estate[1]);
        for(let y=base+11;y<top-3;y+=12)plate(face,props,0,y,.08,face.w*.96,.58,.25,estate[0]);
      }
    }else if(b.id===81117){
      for(const face of f.filter(q=>q.w>32)){
        plate(face,props,0,top-.8,.10,face.w,1.60,.38,'#b9c4bc');
        for(let u=-face.w*.48;u<face.w*.49;u+=5)plate(face,props,u,top-5.3,.25,.24,7.6,.38,'#92a5a6');
      }
    }else{
      const colour=b.id===279107?'#566e69':b.id===310911?'#555b54':'#b2a18a';
      for(const face of f.filter(q=>q.w>12)){
        plate(face,props,0,top-1.25,.06,face.w,1.65,.32,colour);
        if(b.slice)continue;
        for(let u=-face.w*.46;u<face.w*.48;u+=6.8)plate(face,props,u,base+b.h*.5,.08,.28,b.h*.83,.32,colour);
      }
      if(curbLabels.has(b.id)&&long?.w>20&&!b.slice&&b.h>9)badge(long,signs,base+Math.min(7,b.h*.5),.32,Math.min(18,long.w*.58),1.8,curbLabels.get(b.id));
    }
  }
  function entrance(props,signs,x,y,z,ref,station){
    const fast=station[1]==='Hong Kong West Kowloon Station',w=fast?2.6:2.15;
    props.add('box',x,y+1.57,z,.2,3.14,.2,'#778581');
    props.add('box',x,y+2.97,z,w,.88,.25,'#435354');
    const text=[station[0]+' '+ref,station[1]+' · '+ref,fast?'#344f58':'#8c3442'];
    for(const side of [-1,1]){
      const q=(dx,dy)=>[x+dx*side,y+2.97+dy,z+side*.132];
      signs.quad(sign(text),[q(-w/2,-.43),q(w/2,-.43),q(w/2,.43),q(-w/2,.43)]);
    }
  }
  function landscape(props,height,hasSpace){
    // The gate rail rests parallel to the entrance of the Yuen Fat Wharf yard.
    const gateX=-1572.95,gateZ=-3029.52,gateY=height(gateX,gateZ),angle=-.884;
    for(const side of [-1,1]){
      const x=gateX+side*3.85*.78,z=gateZ+side*3.85*.63;
      props.add('box',x,gateY+.93,z,.44,1.86,.44,'#939b95');
      if(side>0)props.add('box',x-1.85,gateY+1.20,z+2.25,5.85,.23,.17,'#d6b75d',-angle);
    }
    for(const [x,z,kind] of window.HKParkFurniture||[]){
      if(!hasSpace(x,z))continue;
      const y=height(x,z);
      if(kind==='drinking_water'){
        props.add('box',x,y+.42,z,.42,.84,.36,'#aeb8b5');
        props.add('box',x,y+.87,z,.52,.10,.47,'#cdd1c7');continue;
      }
      if(![-1.4,1.4].every(dx=>[-1,1].every(dz=>hasSpace(x+dx,z+dz))))continue;
      for(const dx of [-1.3,1.3])for(const dz of [-.9,.9]){
        const base=height(x+dx,z+dz);props.add('box',x+dx,(base+y+2.68)/2,z+dz,.12,y+2.68-base,.12,'#7b8075');
      }
      props.add('box',x,y+2.72,z,3.12,.14,2.42,'#d2d0b9');
      for(const dz of [-.63,.63])props.add('box',x,y+.46,z+dz,2.3,.14,.4,'#9f8062');
    }
  }
  function distant(b,batch){
    if(b.podiumPart){
      const tint=new T.Color(b.podiumPart==='upper'?'#c9c1ac':'#bbb2a1');
      for(const ring of [b.p,...(b.holes||[])])for(const f of faces(ring))
        batch.quad(f.at(-f.w/2,b.basePD,0),f.at(f.w/2,b.basePD,0),f.at(f.w/2,b.top,0),f.at(-f.w/2,b.top,0),tint);
      if(b.podiumPart==='upper'){
        const mesh={tri(a,c,d){const i=batch.p.length/3;for(const p of [a,c,d])batch.vert(p,0,0,tint);batch.idx.push(i,i+1,i+2);}};
        horizontal(mesh,b,b.top);horizontal(mesh,b,b.basePD);
      }
      return true;
    }
    if(!custom.has(b.id))return false;
    const p=b.p,cx=p.reduce((s,q)=>s+q[0],0)/p.length,cz=p.reduce((s,q)=>s+q[1],0)/p.length;
    const profile=b.id===museum?[[0,.76],[.23,.79],[1,1]]:
      b.id===tower?[[0,.89],[.045,1],[.97,.898],[1,.84]]:[[0,1],[1,1]];
    const tint=new T.Color(b.id===museum?'#c9ad86':b.id===mplus?'#526e6b':b.id===museumBase?'#bbaa8d':'#8ba7ac');
    const rings=profile.map(([t,s])=>p.map(([x,z])=>{
      let y=b.basePD+t*b.h;
      if(b.id===station&&t){const along=Math.max(0,Math.min(1,(z+1048)/270));y=7.6+Math.sin(Math.PI*(.13+.87*along))*24;}
      return [cx+(x-cx)*s,y,cz+(z-cz)*s];
    }));
    for(let j=1;j<rings.length;j++)for(let i=0;i<p.length;i++){
      const k=(i+1)%p.length;batch.quad(rings[j-1][i],rings[j-1][k],rings[j][k],rings[j][i],tint);
    }
    const top=rings.at(-1),index=batch.p.length/3;
    for(const q of top)batch.vert(q,0,0,tint);
    for(const [i,j,k] of T.ShapeUtils.triangulateShape(top.map(q=>new T.Vector2(q[0],q[2])),[]))batch.idx.push(index+k,index+j,index+i);
    return true;
  }
  return {entrance,landscape,distant,replaces:b=>!!b.podiumPart||(!b.foundation&&custom.has(b.id)),style:b=>bronzeArch.has(b.id)?6:b.id===272633?12:b.id===279107||b.id===310911?3:undefined,building};
})();
