/* Original streetscape meshes in local survey metres. References are in DATA.md.
   Decorative elevations are attached to individual surveyed building components. */
window.HKDetails=(()=>{
  'use strict';
  const data=window.HK_DETAIL_DATA;
  const TAU=Math.PI*2, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const mean=p=>p.reduce((a,q)=>[a[0]+q[0]/p.length,a[1]+q[1]/p.length],[0,0]);
  const area=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-a[1]*b[0];},0))*.5;
  const rect=(x,z,w,d)=>[[x-w/2,z-d/2],[x-w/2,z+d/2],[x+w/2,z+d/2],[x+w/2,z-d/2]];
  const sites=[
    ['science','香港科學館',[80218,83341,83372,83441,83457,85488]],['isquare','國際廣場',[231685,211104,211102]],
    ['peking','北京道一號',[233614,240106]],['chungking','重慶大廈',[60300,239283,319094,319095,319096,319097]],
    ['k11','K11 Art Mall',[256131,211487]],['musea','K11 MUSEA',[159627,239340]],
    ['heritage','香港文物探知館',[117847,118006,118012]],['sports','九龍公園體育館',[336462]],
    ...(window.HKHeritage?.sites||[]),...(window.HKHarbourPlaces?.sites||[]),['terminal','海運大廈',[205457]],
    ['ocean','海洋中心',[156367,233817]],['gateway','港威商場',[21883]],
    ...Object.entries(data.entrances).map(([code,[id]])=>[code,(code.match(/^[NP]/)?'尖東站 ':'尖沙咀站 ')+code,[id]])
  ];
  const records=new Map(), replaced=new Set();
  function prepare(buildings){
    records.clear();replaced.clear();
    const ids=new Set(sites.flatMap(s=>s[2]));
    for(const b of buildings){
      if(!ids.has(+b.id)||b.foundation||b.p.length<3)continue;
      if(!records.has(+b.id)||area(b.p)>area(records.get(+b.id).p))records.set(+b.id,b);
    }
    for(const [key,,ids] of sites){
      // Gateway Arcade has five mapped courtyards and occupied spans above vehicle passages.
      // Its new shopfronts decorate the original clipped structure.
      if(key!=='gateway'&&ids.every(id=>records.has(id)))ids.forEach(id=>replaced.add(records.get(id)));
    }
  }
  function signedDistance(x,z,p){
    let inside=false,d=Infinity;
    for(let i=0,j=p.length-1;i<p.length;j=i++){
      const [a,b]=p[i],[c,e]=p[j],u=c-a,v=e-b,t=clamp(((x-a)*u+(z-b)*v)/(u*u+v*v||1),0,1);
      d=Math.min(d,(x-a-u*t)**2+(z-b-v*t)**2);
      if((b>z)!==(e>z)&&x<(c-a)*(z-b)/(e-b)+a)inside=!inside;
    }
    return Math.sqrt(d)*(inside?-1:1);
  }
  const ponds=data.water.map(({p},i)=>({p,index:i,
    bounds:[Math.min(...p.map(q=>q[0]))-6,Math.min(...p.map(q=>q[1]))-6,Math.max(...p.map(q=>q[0]))+6,Math.max(...p.map(q=>q[1]))+6]}));
  const near=(x,z,s)=>x>=s.bounds[0]&&z>=s.bounds[1]&&x<=s.bounds[2]&&z<=s.bounds[3];
  // The Chinese Garden's two pools meet at a small cascade across their narrow neck.
  const poolLevel=(i,z)=>i===0?20.3:z<-507?25.95:26.90;
  function parkTerrain(base){return (x,z)=>{
    const y=base(x,z);
    for(const s of ponds)if(near(x,z,s)){
      const gap=signedDistance(x,z,s.p),t=clamp((gap-1.4)/4.3,0,1),level=poolLevel(s.index,z);
      return (level-.62)*(1-t*t*(3-2*t))+y*t*t*(3-2*t);
    }
    return window.HKHarbourPlaces?.groundLevel(x,z,y)??y;
  };}
  const play=[[-39.8,-610.4],[-13.6,-610],[-20.9,-596.8],[-23.4,-582.7],[-21.7,-568.9],[-39.3,-559.9],[-41.8,-585.6]];
  const fortCenters=[[-31,-600],[-32,-574]], pavilion=[70,-493.5], gate=[181,-271];
  const sciencePoint=(u,v)=>[802.7-.7441*u-.6681*v,-598.5+.6681*u-.7441*v];
  const scienceCourt=[[14,0],[83,0],[83,16],[14,16]].map(([u,v])=>sciencePoint(u,v));
  const parkSolids=[...(window.HKHarbourPlaces?.solids||[]),{p:scienceCourt,h:5.4},{p:rect(209.17,-641.7,.76,.72),h:2.7},{p:rect(209.4,-638.6,.76,.72),h:2.7},{p:rect(...pavilion,5.6,5.6),h:5.4},...fortCenters.map(([x,z])=>({p:rect(x,z,3.5,3.5),h:3.6})),
    {p:rect(...gate,3.4,.52),h:2.3}];
  const isPond=(x,z)=>ponds.some(s=>near(x,z,s)&&signedDistance(x,z,s.p)<0);
  const fortAngle=k=>(-.18+k/29)*TAU;
  for(const [index,[x,z]] of fortCenters.entries()){
    const radius=index?5.6:6.8;
    for(let k=0;k<25;k++){
      const point=(a,r)=>[x+r*Math.cos(a),z+r*Math.sin(a)],a=fortAngle(k),c=fortAngle(k+1);
      parkSolids.push({p:[point(a,radius),point(c,radius),point(c,radius-.57),point(a,radius-.57)],h:2.0});
    }
  }
  parkSolids.push({p:rect(-31,-586,9.8,1.9),h:2.72});
  function clearPlanting(x,z){
    if(window.HKHarbourPlaces?.clearPlanting(x,z))return true;
    if(x>726&&x<810&&z>-612&&z<-535&&signedDistance(x,z,scienceCourt)<10.0)return true;
    if(ponds.some(s=>near(x,z,s)&&signedDistance(x,z,s.p)<2.0))return true;
    return (x>-45&&x<-12&&z>-612&&z<-558&&signedDistance(x,z,play)<1)||Math.hypot(x-gate[0],z-gate[1])<3;
  }

  // Signs share one canvas atlas, including the plate numbers and names on bus flags.
  function atlas(scale=1){
    const T=THREE,W=2048,H=2048,cellW=512,cellH=128,slots=64,pages=[];
    function add(paint){
      let page=pages.at(-1);
      if(!page||page.n===slots){const cv=document.createElement('canvas');cv.width=W*scale;cv.height=H*scale;
        const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;
        page={n:0,ctx:cv.getContext('2d'),texture:tex,mat:new T.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.1,side:T.DoubleSide,toneMapped:false})};pages.push(page);}
      const i=page.n++,x=i%4*cellW,y=Math.floor(i/4)*cellH,c=page.ctx;
      c.save();c.scale(scale,scale);c.translate(x+2,y+2);c.beginPath();c.rect(0,0,508,124);c.clip();paint(c,508,124);c.restore();page.texture.needsUpdate=true;
      return {mat:page.mat,uv:[(x+2)/W,1-(y+126)/H,(x+510)/W,1-(y+2)/H]};
    }
    return {add};
  }
  function lettering(c,t,x,y,font,colour,max=480,align='center'){
    c.font=font+' "PingFang HK","Heiti TC",Arial,sans-serif';c.fillStyle=colour;c.textAlign=align;c.textBaseline='middle';c.fillText(t,x,y,max);
  }
  function board(label,sub,bg,fg='#fff7df'){
    return (c,w,h)=>{c.fillStyle=bg;c.fillRect(0,0,w,h);
      lettering(c,label,w/2,sub?43:64,'bold '+(sub?65:90)+'px',fg);
      if(sub)lettering(c,sub,w/2,98,'bold 33px',fg);};
  }
  function signBatch(){
    const T=THREE,bins=new Map();
    function quad(tag,points){
      if(!bins.has(tag.mat))bins.set(tag.mat,{p:[],uv:[]});
      const bin=bins.get(tag.mat),[l,b,r,t]=tag.uv,uv=[[l,b],[r,b],[r,t],[l,t]];
      for(const i of [0,1,2,0,2,3]){bin.p.push(...points[i]);bin.uv.push(...uv[i]);}
    }
    function finish(group){
      for(const [mat,bin] of bins){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(bin.p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(bin.uv,2));const mesh=new T.Mesh(geo,mat);mesh.name='Site lettering';group.add(mesh);}
    }
    return {quad,finish};
  }
  function build(scene,ground,kit){
    const T=THREE,{Parts,facadeFrame:frame,tile,eachEdge:edges,lerp2}=kit,labels=atlas(),placed=[];
    const glassMat=new T.MeshPhongMaterial({vertexColors:true,color:0xc5eaeb,transparent:true,opacity:.29,shininess:75,side:T.DoubleSide,depthWrite:false});
    const steel='#b4c6c6',stone='#e5d9bf',dark='#273b40',teal='#396365';
    const edge=(p,i)=>frame(p[i],p[(i+1)%p.length]);
    const low=id=>records.get(id).basePD??ground(...mean(records.get(id).p)),top=id=>records.get(id).top??(low(id)+records.get(id).h);
    const ring=id=>records.get(id).p;
    let b,g,signs;
    function sign(f,u,y,d,w,h,label,sub,bg,fg){
      const entry=labels.add(typeof label==='function'?label:board(label,sub,bg,fg));
      signs.quad(entry,[f.at(u-w/2,y-h/2,d),f.at(u+w/2,y-h/2,d),f.at(u+w/2,y+h/2,d),f.at(u-w/2,y+h/2,d)]);
    }
    function strip(f,y,h,d,c,start=0,end=f.length){if(end-start>.03)b.box(...f.at((start+end)/2,y),end-start,h,d,c,f.angle);}
    function grid(f,lo,hi,pitch,step,c,depth=.06){
      const bays=Math.max(1,Math.round(f.length/pitch));
      for(let i=1;i<bays;i++){const s=f.length*i/bays;tile(b,f,s-.045,s+.045,lo,hi,depth,c);}
      for(let y=lo+step;y<hi;y+=step)tile(b,f,0,f.length,y-.055,y+.055,depth+.005,c);
    }
    function shell(id,tint,roof=tint,start=low(id),end=top(id)){
      const p=ring(id);b.prism(p,start,end,tint,roof);
      if((records.get(id).base||0)<=2&&start<=low(id)+.1)edges(p,(a,c)=>{
        const f=frame(a,c),n=Math.ceil(f.length/3.0);
        for(let j=0;j<n;j++){
          const A=lerp2(a,c,j/n),B=lerp2(a,c,(j+1)/n);
          b.quad([A[0],Math.min(start-.03,ground(...A)-.35),A[1]],[B[0],Math.min(start-.03,ground(...B)-.35),B[1]],[B[0],start,B[1]],[A[0],start,A[1]],tint);
        }
      });
    }
    function panes(f,lo,hi,pitch,palette){
      const n=Math.max(1,Math.round(f.length/pitch));
      for(let k=0;k<n;k++)tile(b,f,k*f.length/n,(k+1)*f.length/n,lo,hi,.04,palette[(Math.floor(k/3)+k%3)%palette.length]);
    }
    function hip(a,c,w,eaves,ridge,clay){
      const f=frame(a,c),s=Math.min(w*.65,f.length*.2),p=f.at(s,ridge,0),q=f.at(f.length-s,ridge,0);
      for(const side of [-1,1]){
        b.quad(f.at(0,eaves,side*w),f.at(f.length,eaves,side*w),q,p,clay[side===1?0:1]);
        for(let j=1;j<5;j++){const t=j/5;b.beam(f.at(s*t,eaves+(ridge-eaves)*t,side*w*(1-t)),f.at(f.length-s*t,eaves+(ridge-eaves)*t,side*w*(1-t)),.055,clay[2]);}
      }
      b.tri(f.at(0,eaves,-w),p,f.at(0,eaves,w),clay[1]);b.tri(f.at(f.length,eaves,-w),f.at(f.length,eaves,w),q,clay[0]);b.beam(p,q,.14,clay[2]);
    }
    function science(){
      const id=80218,p=ring(id),y=low(id),h=top(id);shell(id,'#c98e86','#b0b5a9',y,h-.58);
      edges(p,(a,c,i)=>{const f=frame(a,c),L=f.length;
        panes(f,y+.1,y+3.7,3.7,['#557c81','#41666e','#8ba6a5']);grid(f,y+.15,y+3.7,3.7,2.8,steel);
        for(const v of [4.2,15.8,h-y-.6])strip(f,y+v,1.1,.30,'#506976');
        const n=Math.ceil(L/6);
        for(let j=1;j<n;j++)tile(b,f,j*L/n-.06,j*L/n+.06,y+4.8,h-1,.055,'#af7b77');
        for(const k of [9.5,14.2,20.0])tile(b,f,0,L,y+k,y+k+.085,.062,'#ae7774');
        if(i===0||i===2){const start=L*.25,end=L*.78;tile(b,f,start,end,y+4.9,y+15.2,.087,'#68929a');grid(frame(lerp2(a,c,.25),lerp2(a,c,.78)),y+4.9,y+15.2,3.4,2.9,'#b5cbc6',.099);
          const left=L*.37,right=L*.66;
          for(const u of [left,left+(right-left)/2,right])b.box(...f.at(u,y+2.5,.88),.22,5,.22,steel,f.angle);
          b.quad(f.at(left,y+5.2,.05),f.at(right,y+5.2,.05),f.at(right,y+4.85,1.23),f.at(left,y+4.85,1.23),'#9ab7b7');
          if(i===2)sign(f,L*.53,y+8.2,.14,14.6,2.05,'香港科學館','HONG KONG SCIENCE MUSEUM','#516974');
        }
      });
      const f=edge(p,0),L=f.length;
      // Teal perimeter roof frame, stepped back from the pink tiled exhibition volume.
      for(const d of [-3.6,-35.5]){b.box(...f.at(L/2,h+.32,d),L-2,.84,.75,'#526d77',f.angle);
        for(let u=2;u<L-1;u+=9)b.box(...f.at(u,h-.49,d),.35,2,.35,'#b7c3be',f.angle);}
      for(const u of [1.3,L-1.3])b.beam(f.at(u,h+.32,-3.6),f.at(u,h+.32,-35.5),.43,'#526d77');
      for(let j=0;j<4;j++)b.box(...f.at(11+j*6,h-.1,-25),4.2,1,3,'#b9bdb4',f.angle);
      // Raised, tiled piazza, an external flight of stairs and chamfered mirror-clad
      // portal. The open-sided CSDI parts mark the canopy positions along this facade.
      const plaza=9.9;
      b.prism(scienceCourt,y-.5,plaza,'#a58579','#c7ab99');
      for(let u=15;u<83;u+=2.45)b.beam(f.at(u,plaza+.018,.4),f.at(u,plaza+.018,15.7),.028,'#9e8c83');
      for(let v=2;v<16;v+=2.4)b.beam(f.at(14.3,plaza+.025,v),f.at(82.8,plaza+.025,v),.028,'#a69288');
      for(const [start,end] of [[14,27.4],[37,54],[65,83]]){
        b.beam(f.at(start,plaza+1.02,15.76),f.at(end,plaza+1.02,15.76),.068,steel);
        for(let u=start;u<end;u+=1.45)b.box(...f.at(u,plaza+.50,15.76),.065,1.03,.075,steel,f.angle);
      }
      const portalFace=frame(f.at(47,0,1.8).filter((_,i)=>i!==1),f.at(69,0,1.8).filter((_,i)=>i!==1));
      for(let j=0;j<6;j++)for(let k=0;k<4;k++){
        const u=j*22/6,lo=plaza+k*2.41;
        if(j>0&&j<5&&k===0)continue;
        tile(b,portalFace,u+.055,u+22/6-.055,lo+.05,lo+2.35,.06,['#829a9e','#a7b5a9','#647f82','#a1aeaa','#768f86'][(k*3+j)%5]);
      }
      sign(portalFace,11,plaza+5,.115,12.0,1.45,'香港科學館','HONG KONG SCIENCE MUSEUM','#506874');
      for(const u of [28,36,55,64]){b.box(...f.at(u,plaza+2.15,10.3),.29,4.3,.29,steel,f.angle);
        b.beam(f.at(u,plaza+3.64,10.3),f.at(u,plaza+5.12,5.2),.095,steel);}
      for(const [a,c] of [[26,39],[53,67]]){
        for(let u=a;u<=c;u+=2)b.beam(f.at(u,plaza+4.18,11.2),f.at(u,plaza+5.13,1.3),.092,steel);
        for(const v of [1.3,5.6,11.2])b.beam(f.at(a,plaza+5.25-v*.094,v),f.at(c,plaza+5.25-v*.094,v),.12,'#aebdb9');
        g.quad(f.at(a,plaza+5.13,1.3),f.at(c,plaza+5.13,1.3),f.at(c,plaza+4.18,11.2),f.at(a,plaza+4.18,11.2),'#aac8c4');
      }
      // The flight runs along the piazza edge, descending onto the adjoining slope.
      const bottomPoint=f.at(10,0,18.1),bottom=ground(bottomPoint[0],bottomPoint[2]),n=17;
      for(let k=0;k<n;k++){const u=10+k*.52,v=bottom+(plaza-bottom)*(k+1)/n;
        b.box(...f.at(u,(v+bottom-.38)/2,18.1),.54,v-bottom+.38,3.5,'#bca79d',f.angle);}
      for(const v of [16.48,19.72])b.beam(f.at(10,bottom+1.01,v),f.at(18.8,plaza+1.01,v),.062,steel);
      for(const u of [19,44,78]){b.cylinder(...f.at(u,plaza+.3,12.9),1.1,1.03,.58,'#bcb5a6',12);
        b.dome(...f.at(u,plaza+.56,12.9),.98,.61,.98,'#668258',0,12);}

    }
    function isquare(){
      const p=ring(231685),y=low(231685),h=top(231685);shell(231685,'#adc5c7','#a3b2ad');
      edges(p,(a,c,i)=>{const f=frame(a,c),L=f.length;
        panes(f,y+.4,h-.4,3.4,['#457b86','#5d8e97','#71a3a8']);grid(f,y+.4,h-.4,3.2,4.7,steel);
        if(i===0||i===3){
          if(i===0){
            for(const u of [19.5,44.7]){
              const at=f.at(u,0),sill=ground(at[0],at[2])+.035;
              tile(b,f,u-3.65,u+3.65,sill-.25,sill+3.55,.11,'#4a5856');
              for(let k=0;k<6;k++){
                const left=u-3.52+k*1.18;
                tile(b,f,left,left+1.12,sill+.07,sill+2.7,.14,k===0||k===5?'#88a8a8':'#576f71');
                tile(b,f,left+.02,left+1.10,sill+1.1,sill+1.16,.155,'#c4ccbd');
                tile(b,f,left+.025,left+1.10,sill+.06,sill+.15,.16,'#acb6af');
                if(k>0&&k<5){
                  const handle=left+(k%2?.92:.19);
                  b.beam(f.at(handle,sill+.88,.23),f.at(handle,sill+1.5,.23),.048,'#e3dfcc');
                }
              }
              b.box(...f.at(u,sill+3.58,.26),7.6,.16,.59,'#c6d0c7',f.angle);
              sign(f,u,sill+3.08,.17,3.9,.54,'iSQUARE','國際廣場','#3e555b');
              for(const side of [-1,1]){
                const x=u+side*5.36;
                tile(b,f,x-1.45,x+1.45,sill+.27,sill+3.35,.12,'#a5957e');
                for(let k=0;k<3;k++){
                  const s=x+(k-1)*.86;
                  tile(b,f,s-.36,s+.36,sill+.50,sill+2.73,.136,k%2?'#7d8d85':'#858175');
                  tile(b,f,s-.30,s+.30,sill+.64,sill+.85,.15,'#c4b495');
                  b.box(...f.at(s,sill+1.20,.17),.30,.64,.07,k%2?'#c2a278':'#ddd4bd',f.angle);
                }
                tile(b,f,x-1.45,x+1.45,sill+.30,sill+.40,.165,steel);
              }
            }
          }
          // The escalator flights cross the transparent atrium along Nathan Road.
          for(let j=0;j<4;j++){
            const u=L*(j%2?.72:.27),v=L*(j%2?.27:.72),lo=y+6+j*8.2,hi=lo+8.2;
            const A=f.at(u,lo,.12),C=f.at(v,hi,.12);b.quad(A,C,f.at(v,hi+.85,.12),f.at(u,lo+.85,.12),'#e0ded0');
            b.beam(f.at(u,lo+1.32,.14),f.at(v,hi+1.32,.14),.08,steel);
          }
          sign(f,L*.49,y+5.4,.16,10.8,2.1,'iSQUARE','國際廣場','#334d53');
        }else for(let j=0;j<9;j++)strip(f,y+5.2*j+.8,.75,.19,'#ced8d4');
      });
      for(const id of [211102,211104]){shell(id,'#7b9ba2','#b6c1c1');edges(ring(id),(a,c)=>{
        const f=frame(a,c),lo=low(id),hi=top(id);panes(f,lo,hi,3.3,['#6e899b','#7e8b9e','#8d9fac']);grid(f,lo,hi,2.9,3.25,'#c5d0d1');
        for(let y=lo+8;y<hi;y+=17.5){tile(b,f,0,f.length,y,y+2.4,.13,'#555266');strip(f,y+2.45,.33,.36,'#dacdc5');}
      });}
    }
    function peking(){
      shell(233614,'#aac1bc','#c2c3ba');edges(ring(233614),(a,c)=>{const f=frame(a,c);if(f.length<3)return;
        panes(f,4.4,18.8,3.4,['#506e74','#678b8a']);grid(f,4.4,18.9,3.7,4.4,steel);strip(f,18.6,.8,.36,'#d8d7c6');
        if(f.length>40)sign(f,f.length*.5,10.8,.16,10,1.85,'ONE PEKING','北京道一號','#364f55');
      });
      const p=ring(240106),lo=low(240106),h=top(240106),crown=([x,z])=>h-1-clamp((z+16)/31,0,1)*18;
      b.prism(p,lo,h-20,'#506f7f','#738b93');
      const faces=THREE.ShapeUtils.triangulateShape(p.map(q=>new THREE.Vector2(...q)),[]);
      for(const [i,j,k] of faces)b.tri(...[i,k,j].map(a=>[p[a][0],crown(p[a]),p[a][1]]),'#435d72');
      edges(p,(a,c,i)=>{const f=frame(a,c),L=f.length,A=[a[0],crown(a),a[1]],C=[c[0],crown(c),c[1]];
        b.quad(f.at(0,h-20),f.at(L,h-20),C,A,'#587c8c');b.beam(A,C,.18,steel);
        if(L<3)return;
        grid(f,lo+.4,h-20,3.3,4.0,'#99adb3');
        for(let y=lo+2.8;y<Math.min(A[1],C[1])-.5;y+=3.85)strip(f,y,.32,i===23?.82:.33,'#d7dbd4');
        b.beam(f.at(0,lo),A,.19,'#e2e2d8');
      });
      for(let i=1;i<8;i++){const t=i/8,A=lerp2(p[23],p[0],t),Z=[A[0]-2.5,A[1]-20];b.beam([A[0],crown(A)+.12,A[1]],[Z[0],crown(Z)+.12,Z[1]],.10,'#a7bdc1');}
    }
    function chungking(){
      const base=60300,split=top(base),p=ring(base);
      // Leave a real opening in the Nathan Road face. The lit side windows and
      // rear wall are inside the surveyed podium, giving parallax from a moving taxi.
      b.prism(p,split-.18,split,'#a5a59b','#a7a899');
      edges(p,(a,c,i)=>{const f=frame(a,c),L=f.length,y=low(base)-.66;
        if(i!==8){tile(b,f,0,L,y,split,0,'#aaa9a1');return;}
        const left=L*.24,right=L*.75,entryTop=9.55,deep=-5.8;
        tile(b,f,0,left,y,split,0,'#a6a49a');tile(b,f,right,L,y,split,0,'#a6a49a');tile(b,f,left,right,entryTop,split,0,'#a6a49a');
        tile(b,f,left,right,y,entryTop,deep,'#474f4f');
        b.quad(f.at(left,entryTop,0),f.at(right,entryTop,0),f.at(right,entryTop,deep),f.at(left,entryTop,deep),'#a69c85');
        const floor=Math.max(low(base)+.05,ground(...lerp2(a,c,.5))+.09);
        b.quad(f.at(left,floor,.08),f.at(left,floor,deep),f.at(right,floor,deep),f.at(right,floor,.08),'#aaa18a');
        for(const u of [left,right]){
          b.quad(f.at(u,y,0),f.at(u,y,deep),f.at(u,entryTop,deep),f.at(u,entryTop,0),'#8e826a');
          for(let k=0;k<3;k++){
            const v=-.55-k*1.66,o=u+(u===left?.05:-.05);
            b.quad(f.at(o,floor+.47,v),f.at(o,floor+.47,v-1.40),f.at(o,floor+2.65,v-1.4),f.at(o,floor+2.65,v),'#bad0b9');
            b.beam(f.at(o,floor+1.52,v),f.at(o,floor+1.52,v-1.42),.065,'#cda969');
          }
        }
        for(const v of [-.62,-2.4,-4.4])b.beam(f.at(left+.7,entryTop-.09,v),f.at(right-.7,entryTop-.09,v),.086,'#f4eabd');
        // Kiosks flank the central passage, recessed far enough to see their returns.
        for(const [u,money] of [[left+2.8,true],[right-2.8,false]]){
          const l=u-2.33,r=u+2.33,v=deep+.65;
          tile(b,f,l,r,floor,floor+3.12,v,money?'#8a6d4e':'#566763');
          b.box(...f.at(u,floor+.60,v+.30),4.70,1.2,.62,money?'#996d4e':'#698387',f.angle);
          b.box(...f.at(u,floor+1.22,v+.36),4.76,.12,.8,'#d2c4ab',f.angle);
          tile(b,f,l+.12,r-.12,floor+1.31,floor+2.48,v+.03,money?'#576b61':'#909d98');
          if(money){
            sign(f,u-.92,floor+1.90,v+.06,2.05,.96,(c,w,h)=>{
              c.fillStyle='#243f35';c.fillRect(0,0,w,h);
              for(const [i,label] of ['CURRENCY     BUY     SELL','USD               7.75     7.85','EUR               8.74     9.21','JPY            5.210   5.460'].entries())
                lettering(c,label,16,16+i*30,'bold 25px','#e8d5a3',470,'left');
            });
            for(let k=0;k<8;k++)b.beam(f.at(u+.39+k*.212,floor+1.38,v+.1),f.at(u+.39+k*.212,floor+2.44,v+.1),.027,steel);
          }else{
            for(let row=0;row<2;row++)for(let k=0;k<10;k++){
              const s=l+.42+k*.42,h=floor+1.38+row*.49;
              tile(b,f,s-.10,s+.10,h,h+.33,v+.058,'#414c4b');
              tile(b,f,s-.076,s+.076,h+.045,h+.29,v+.066,['#9db7b5','#c9ac9c','#b4b0bd'][k%3]);
            }
          }
          sign(f,u,floor+2.85,v+.08,4.56,.60,money?'外幣找換':'流動通訊',money?'MONEY EXCHANGE':'MOBILE ACCESSORIES',money?'#bf8c32':'#55797b');
        }
        tile(b,f,(left+right)/2-1.5,(left+right)/2+1.5,floor,entryTop-.5,deep+.02,'#333e3b');
        sign(f,(left+right)/2,floor+3.15,deep+.05,2.53,.48,'商場通道','SHOPPING ARCADE','#59594d');
      });
      edges(ring(base),(a,c,i)=>{const f=frame(a,c),L=f.length;if(L<3)return;
        if(i!==8){tile(b,f,0,L,4.3,9.8,.035,'#374748');grid(f,4.3,9.8,3.1,3.0,'#c3b8a4');}
        for(let y=10.8;y<split;y+=1.13)strip(f,y,.19,.18,'#d1c9b9');
        if(i===8){
          tile(b,f,0,L*.24,4.3,9.6,.10,'#35474a');tile(b,f,L*.75,L,4.3,9.6,.10,'#35474a');
          for(const u of [.22,.27,.73,.78])tile(b,f,L*u,L*u+.48,4.3,9.65,.15,'#b4a797');
          sign(f,L*.50,10.1,.18,17.7,2.4,'重 慶 大 廈','CHUNGKING MANSIONS','#b9b6a9','#7c2626');
          for(const [pos,col,zh,en] of [[.1,'#902e27','找換','EXCHANGE'],[.88,'#c5a753','商場','ARCADE']])
            sign(f,L*pos,8.5,.18,4.6,.95,zh,en,col);
        }
      });
      for(const id of [239283,319094,319095,319096,319097]){
        const p=ring(id),end=top(id);shell(id,'#e0d6c1','#aaa99a',split,end);
        edges(p,(a,c,i)=>{const f=frame(a,c),L=f.length;
          if(L<2.4)return;
          const n=Math.max(1,Math.round(L/3.08)),pitch=L/n;
          for(let j=0;j<n;j++){
            const u=(j+.5)*pitch;
            const band=['#c48372','#d6a97f','#bdd1bb','#a9c7c3'][(Math.floor(j/2)+i)%4];
            tile(b,f,u-pitch*.43,u+pitch*.43,split,end-.35,.04,band);
            for(let row=0;row<13;row++){
              const h=split+row*3.29+1.53,w=pitch*.69;
              tile(b,f,u-w*.5,u+w*.5,h-.8,h+.83,.062,(row+j)%3?'#506568':'#6f8180');
              tile(b,f,u-.04,u+.04,h-.8,h+.83,.071,'#d7d7c9');
              if((row+j*2+i)%4===0)b.box(...f.at(u+.26,h-.93,.12),.66,.31,.20,'#adada2',f.angle);
            }
          }
          for(let h=split;h<end;h+=3.29)strip(f,h,.15,.20,'#e7dbc5');
        });
      }
    }
    function k11(){
      const id=256131,p=ring(id),y=low(id),end=top(id);shell(id,'#948e78','#baae8a');
      edges(p,(a,c,i)=>{const f=frame(a,c),L=f.length;if(L<1.4)return;
        panes(f,y+.18,end-.6,3.2,['#526e68','#3b5d5c','#74928c']);grid(f,y+.18,end-.55,3.15,4.3,'#9f926e');
        strip(f,y+4.5,.44,.28,'#aea07a');strip(f,end-.44,.72,.30,'#c5b291');
        if(i===3||i===28||i===2){
          const s=L*.48,w=Math.min(10.0,L*.65);
          for(let j=0;j<5;j++)b.beam(f.at(L*.12+j*L*.16,y+1.1,.15),f.at(L*.12+j*L*.16+1.5,end-1.1,.15),.13,'#aca07d');
          sign(f,s,y+8.8,.32,w,2.6,'K11','ART MALL','#242d2b','#d9caa0');
        }
      });
      const entry=ring(211487),base=ground(...mean(entry)),roof=Math.max(base+2.75,top(211487));
      // Separate low entrance canopy on the Hanoi Road side of the podium.
      b.prism(entry,roof-.17,roof,'#98876d','#b2ab93');
      edges(entry,(a,c,i)=>{const side=frame(a,c);
        b.box(a[0],(roof+base)/2,a[1],.21,roof-base,.21,'#9e8c70',side.angle);
        if(side.length>5){tile(g,side,0,side.length,base+.24,roof-.36,0,'#aac4b7');
          grid(side,base+.24,roof-.35,2,2,'#ad9a78');}
        if(i===1)sign(side,side.length*.48,roof-.63,.09,4.8,.75,'K11  ART MALL','','#3a4036','#e4cda0');
      });
    }
    function musea(){
      const p=ring(159627),y=low(159627),h=top(159627);shell(159627,'#a18f75','#86937a');
      edges(p,(a,c,i)=>{const f=frame(a,c),L=f.length;
        if(L<1.25)return;
        panes(f,y+.12,h-.8,4.1,['#537475','#3f6164','#607b73']);grid(f,y+.12,h-.5,3.7,5.8,'#a7997e');
        for(let j=0;j<6;j++){const cy=y+5.55+j*6.0;strip(f,cy,.51,.56,'#c7b69a');
          if((i+j)%4!==1 && L>3){
            const tiles=Math.max(1,Math.round(L/3));
            for(let k=0;k<tiles;k++){const xx=L*k/tiles,end=L*(k+1)/tiles;
              tile(b,f,xx,end,cy+.26,cy+1.35+Math.sin(i+j+k)*.42,.26,['#738351','#4f7753','#688254'][(i+j+k)%3]);}
          }
        }
        if([19,39,59].includes(i)){
          const cy=y+13.1,w=Math.min(L*.87,17);
          // A planted panel with three gold monograms distinguishes MUSEA from Art Mall.
          for(let j=0;j<15;j++)for(let k=0;k<8;k++){
            const a=(L-w)/2+w*j/15,lo=cy-5.2+k*1.25;
            tile(b,f,a,a+w/15+.015,lo,lo+1.26,.29+.012*((j+k)%3),['#4b6448','#596f44','#78824d','#58744e','#698450'][(j*7+k*3+Math.floor(j/2))%5]);}
          const crest=(c,w,h)=>{lettering(c,'K 1 1',w/2,42,'bold 71px','#e6c17c',430);lettering(c,'M U S E A',w/2,99,'bold 34px','#f3d9a2',423);};
          sign(f,L*.5,cy,.39,w*.70,5.6,crest);
        }
      });
      const tower=ring(239340),base=low(239340),end=top(239340);shell(239340,'#5c7778','#a4a696');
      edges(tower,(a,c,i)=>{const f=frame(a,c),L=f.length;if(L<1)return;
        panes(f,base,end,2.55,['#485f63','#5b7476','#657b78']);
        grid(f,base,end,3.4,3.8,'#927f69');
        for(let y=base+1.55,level=0;y<end-.42;y+=3.85,level++){
          const depth=.76+.27*Math.sin(i*.31+level*.39);
          b.box(...f.at(L/2,y,depth*.44),L+.06,.35,depth*1.13,'#d3c0a1',f.angle);
          tile(b,f,0,L,y+.18,y+.84,depth*.92,'#89938b');
          b.box(...f.at(L/2,y+.87,depth*.92),L,.065,.079,'#b7ad96',f.angle);
          if(L>4&&level%3===i%3){const u=L*.53;
            b.box(...f.at(u,y+.43,depth*.76),Math.min(2.4,L*.42),.38,.31,'#a28e72',f.angle);
            b.box(...f.at(u,y+.70,depth*.76),Math.min(2.26,L*.40),.26,.32,'#788859',f.angle);}
        }
      });
    }
    function arcade(f,lo,n){
      const pitch=f.length/n;
      for(let j=0;j<n;j++){const u=(j+.5)*pitch,w=pitch*.78;
        tile(b,f,u-w*.5,u+w*.5,lo+.13,lo+2.35,.052,'#596e61');
        for(let k=0;k<9;k++){
          const t=k*Math.PI/9,v=(k+1)*Math.PI/9;
          const arc=(a,r,h,d)=>f.at(u+Math.cos(a)*r,lo+2.35+Math.sin(a)*h,d);
          b.quad(arc(t,w/2,.72,.08),arc(v,w/2,.72,.08),arc(v,w/2+.12,.86,.08),arc(t,w/2+.12,.86,.08),'#f0e8cf');
          b.tri(f.at(u,lo+2.35,.055),arc(t,w/2,.72,.055),arc(v,w/2,.72,.055),'#53685e');
        }
        for(const s of [-1,1])tile(b,f,u+s*w*.32-.12,u+s*w*.32+.12,lo+.68,lo+2.24,.091,'#83957c');
        tile(b,f,u-w*.51,u+w*.51,lo+.7,lo+.81,.12,'#c6c6a7');
      }
    }
    function heritage(){
      for(const id of [117847,118006,118012]){const p=ring(id),y=low(id),h=top(id);
        if(id===118012){shell(id,'#ded4bb','#b4ada0',y,h-.7);edges(p,(a,c)=>{const f=frame(a,c);if(f.length>7){panes(f,y+2,h-1.2,3.4,['#8d9c91','#6c8681']);grid(f,y+2,h-1.2,3.4,3.4,stone);}});continue;}
        shell(id,'#e6dfc5','#565954',y,h-2.05);
        edges(p,(a,c)=>{const f=frame(a,c);if(f.length>6){
          const n=Math.max(2,Math.round(f.length/4.1));for(const v of [y+.26,y+4.6])arcade(f,v,n);
          strip(f,y+4.48,.33,.52,'#f1e8ce');strip(f,h-2.12,.28,.54,'#f2e7ce');
        }});
        const a=id===117847?[-38.9,-383.7]:[-35.9,-350],c=id===117847?[19.2,-387.0]:[21.8,-354.2];
        hip(a,c,6.15,h-2.0,h+.3,['#67665d','#525953','#868477']);
        if(id===118006){const f=edge(p,1);sign(f,f.length*.54,y+4.4,.35,9.4,.8,'香港文物探知館','HERITAGE DISCOVERY CENTRE','#575c4e');}
      }
    }
    function sports(){
      const id=336462,p=ring(id),lo=low(id),hi=top(id);shell(id,'#d9d6c7','#bcc4b7',lo,hi-.93);
      edges(p,(a,c,i)=>{const f=frame(a,c),L=f.length;if(L<2.3)return;
        tile(b,f,0,L,lo+2.1,lo+5.9,.05,'#829e99');grid(f,lo+2.1,lo+5.9,3.8,2.55,'#cecfc2');
        tile(b,f,0,L,hi-4.8,hi-2.35,.06,'#6d8283');
        for(let d=hi-4.55;d<hi-2.32;d+=.43)strip(f,d,.13,.26,'#aebbb5');
        if(i===18||i===27){for(let u=2.0;u<L-1;u+=5.7){
          b.cylinder(...f.at(u,lo+2.9,.11),.42,.44,5.8,'#bbd2c6',12);}
          sign(f,L*.5,lo+6.3,.23,13,1.55,'九龍公園體育館','KOWLOON PARK SPORTS CENTRE','#4a756c');}
        strip(f,hi-1.15,.62,.55,'#ece9d9');
      });
      const f=edge(p,18),L=f.length;
      for(let j=1;j<13;j++){
        const u=L*j/13;b.beam(f.at(u,hi-.83,-.9),f.at(u,hi,-16.6),.18,'#a1ada8');b.beam(f.at(u,hi,-16.6),f.at(u,hi-.83,-32),.18,'#a1ada8');
      }
    }
    function shops(f,y,h,seed){
      const L=f.length,n=Math.max(1,Math.round(L/8.2));
      for(let i=0;i<n;i++){
        const u=L*i/n,end=L*(i+1)/n,w=end-u;
        tile(b,f,u,end,y,h,.05,['#bfb6a3','#b0a293','#bab6a7','#9e9c91'][(i+seed)%4]);
        tile(b,f,u+w*.084,end-w*.084,y+.2,Math.min(y+5.7,h-.3),.072,['#44595a','#526a67','#65777a'][(i+seed)%3]);
        if(w>4){tile(b,f,u+w*.46,u+w*.49,y+.23,y+5.57,.094,'#bba988');tile(b,f,u+w*.83,u+w*.85,y+.23,y+5.57,.094,'#bba988');}
        tile(b,f,u+w*.09,end-w*.08,y+5.8,y+6.11,.097,'#dbcdb5');
      }
    }
    // Illustrate the depth of display windows at street scale, behind individually
    // modelled mullions and a recessed entrance. Store locations follow the mall plan.
    function boutique(f,u,width,y,h,name,style){
      const looks=[
        ['#c7b99c','#85775e','#e5d9ba','#423e37'],
        ['#424644','#262b2b','#c5bda7','#e5e1cc'],
        ['#bfc1b7','#848d85','#e8ddc5','#4d4e44']
      ],[front,shade,light,ink]=looks[style%3],left=u-width/2,right=u+width/2,displayTop=y+(h-y)*.50;
      tile(b,f,left,right,y+.04,h-.22,.13,front);
      const n=8;for(let j=0;j<n;j++)for(let k=0;k<3;k++){
        const a=left+width*j/n,v=displayTop+k*(h-displayTop)/3;
        tile(b,f,a+.027,a+width/n-.028,v+.028,v+(h-displayTop)/3-.027,.147,(j+k)%4===0?shade:front);
      }
      const shopWindow=(c,w,h)=>{
        const glow=c.createLinearGradient(0,0,w,h);glow.addColorStop(0,'#45585a');glow.addColorStop(.40,'#867e6b');glow.addColorStop(.64,'#ad967e');glow.addColorStop(1,'#4e5550');
        c.fillStyle=glow;c.fillRect(0,0,w,h);
        c.fillStyle='#cebf9f';c.fillRect(27,94,180,3);c.fillRect(293,96,176,3);
        for(let j=0;j<3;j++){
          const x=40+j*60;c.fillStyle=['#775242','#b29b7d','#584c41'][j];c.fillRect(x,69-j*3,37,22+j*3);
          c.strokeStyle='#cfb899';c.lineWidth=3;c.beginPath();c.arc(x+19,70-j*3,10,Math.PI,2*Math.PI);c.stroke();
        }
        c.fillStyle='#ded6b9';c.beginPath();c.moveTo(338,33);c.lineTo(374,39);c.lineTo(388,80);c.lineTo(323,80);c.fill();
        c.fillStyle='#c4c6b5';c.fillRect(347,81,3,15);c.fillRect(361,81,3,15);
        c.fillStyle='#dbe3d01f';c.beginPath();c.moveTo(0,0);c.lineTo(150,0);c.lineTo(65,h);c.lineTo(0,h);c.fill();
      };
      sign(f,u,(displayTop+y)/2,.171,width*.91,displayTop-y-.53,shopWindow);
      const cy=displayTop+(h-displayTop)*.38;
      sign(f,u,cy,.19,width*.84,Math.min(1.65,(h-displayTop)*.38),name,'',front,ink);
      for(const t of [.06,.38,.62,.94])b.box(...f.at(left+width*t,(y+displayTop)/2,.20),.095,displayTop-y,.16,light,f.angle);
      const entryWidth=width*.23;
      tile(b,f,u-entryWidth/2,u+entryWidth/2,y+.07,displayTop-.19,.202,'#2c3c3c');
      for(const v of [-1,1])b.box(...f.at(u+v*.12,y+1.16,.247),.042,.66,.072,'#d1baa1',f.angle);
      b.box(...f.at(u,displayTop-.08,.15),width*.93,.16,.41,light,f.angle);
    }
    function gateway(){
      const p=ring(21883),shopsByEdge={82:['GUCCI',1],96:['PRADA',2],137:['HERMÈS',0]};
      edges(p,(a,c,i)=>{const f=frame(a,c),L=f.length;if(L<3.3)return;
        const mid=f.at(L/2,0,.1);
        // Street shops along the Canton Road frontage. Keep the cut edges of passages bare.
        if(mid[0]<-181||mid[0]>-90||mid[2]<-404||mid[2]>-63||f.at(0,0,1)[0]<a[0]+.6)return;
        const y=Math.max(ground(a[0],a[1]),ground(c[0],c[1]),low(21883))+.06;
        if(y+6.6>17.4)return;
        shops(f,y,17.25,i);strip(f,16.94,.47,.31,'#d3c4ad');
        const shop=shopsByEdge[i];
        if(shop)boutique(f,L/2,L*.98,y,17.15,shop[0],shop[1]);
        if(!shop&&((L>14&&i%3===0)||i===129))sign(f,L*.5,15.62,.20,Math.min(L*.8,10),1.55,'港威商場','GATEWAY ARCADE','#454a43','#eedcb9');
      });
    }
    function ocean(){
      const pod=233817,p=ring(pod),h=top(pod);shell(pod,'#c3b9a5','#bab5a6');
      edges(p,(a,c,i)=>{const f=frame(a,c),L=f.length;if(L<3.5)return;
        const y=low(pod);shops(f,y,h-.4,i);
        for(const v of [y+7,h-.5])strip(f,v,.39,.27,'#ddceba');
        if(i===32){
          const grade=ground(...lerp2(a,c,.50));
          for(const [u,w,n,look] of [[19.3,18,'DIOR',2],[38.6,17.6,'CHANEL',1],[77.1,28,'LOUIS VUITTON',0]])
            boutique(f,u,w,grade,h-.23,n,look);
        }
        if(i!==32&&L>18&&f.at(0,0,1)[0]>a[0]+.3)sign(f,L*.54,h-2.35,.15,Math.min(L*.76,11),1.65,'海 港 城','H A R B O U R   C I T Y','#3e4949');
      });
      const id=156367,lo=low(id),hi=top(id);shell(id,'#92a7a7','#bec3ba');
      edges(ring(id),(a,c)=>{const f=frame(a,c);if(f.length<1)return;
        panes(f,lo,hi-.3,2.9,['#5d777a','#637d82','#769093']);grid(f,lo,hi,2.95,3.3,'#b7c3bf');
        for(let y=lo+.8;y<hi;y+=3.35)strip(f,y,.48,.44,'#d6d8cc');
      });
    }
    function terminal(){
      const id=205457,lo=low(id),hi=top(id),p=data.terminal;
      b.prism(p,lo,hi,'#d1d2c9','#b8bcb1');
      edges(p,(a,c,i)=>{const f=frame(a,c),L=f.length;if(L<3)return;
        for(const y of [lo+3.5,lo+8.2,lo+13.2]){
          tile(b,f,0,L,y,y+1.97,.044,'#577b84');grid(f,y,y+1.97,3.1,3,steel);strip(f,y-.12,.28,.40,'#eceade');
        }
        if(L>140){
          for(let u=4;u<L-1;u+=8){const A=f.at(u,hi+.66,-.85),B=f.at(u,hi+.66,-3.0);
            b.beam(A,B,.075,'#e4e4d7');b.box(...f.at(u,hi+.36,-.85),.10,.72,.10,steel,f.angle);}
          for(const s of [.3,.7])sign(f,L*s,lo+11,.12,18,1.75,'海 運 大 廈','OCEAN TERMINAL  ·  HARBOUR CITY','#486570');
        }
      });
      const levels=[lo,lo+3.62,lo+7.57,lo+11.34,lo+15.18,hi+.38];
      data.terraces.forEach((r,k)=>{
        const bottom=levels[k],ceiling=levels[k+1]-.33;
        const core=data.terraceCores[k];
        b.prism(core,bottom,ceiling,'#608188','#c6c1af');
        edges(core,(a,c)=>{const f=frame(a,c);if(f.length>2.5){panes(f,bottom+.1,ceiling-.15,3.1,['#50737d','#658891','#749394']);grid(f,bottom+.1,ceiling-.12,2.8,5,'#d8e1d9');}});
        if(k===0)b.prism(r,bottom-.42,bottom,'#b6bab3','#d2c8b4');
        b.prism(r,ceiling,levels[k+1],'#eee9dd',k===4?'#bcb7a5':'#d2cbb7');
        edges(r,(a,c)=>{const f=frame(a,c),L=f.length;if(L<2.7)return;
          const columns=Math.ceil(L/6.2);
          for(let j=0;j<columns;j++)b.box(...f.at(L*(j+.5)/columns,(ceiling+bottom)/2,-.34),.22,ceiling-bottom,.25,'#c7c9bf',f.angle);
          tile(g,f,.06,L-.06,levels[k+1]+.14,levels[k+1]+.89,-.12,'#afc6bf');
          const n=Math.ceil(L/2.5);
          for(let j=0;j<n;j++)b.box(...f.at(L*j/n,levels[k+1]+.48,-.1),.074,.95,.08,steel,f.angle);
          for(const v of [.5,.99])b.beam(f.at(0,levels[k+1]+v,-.1),f.at(L,levels[k+1]+v,-.1),.044,'#dce4dc');
        });
      });
      const roof=data.terraces.at(-1),C=mean(roof),deckY=hi+.40;
      const long=frame([C[0]-17.6,C[1]+3.65],[C[0]+17.6,C[1]-3.65]);
      b.box(...long.at(13.2,deckY+.045,0),18.2,.12,14.7,'#809b63',long.angle);
      for(let k=0;k<9;k++){
        const offset=24.5+k*.77,h=.22+k*.245;
        b.box(...long.at(offset,deckY+h/2,0),.79,h,15.4,'#bdab93',long.angle);
        b.box(...long.at(offset,deckY+h+.025,0),.76,.055,15.45,'#ddc6a5',long.angle);
      }
      for(const v of [-7.92,7.92])b.beam(long.at(24.2,deckY+.95,v),long.at(30.9,deckY+3.08,v),.068,steel);
      for(let j=0;j<12;j++){const u=5+j*2.6;b.box(...long.at(u,deckY+.038,9.1),.06,.061,3.6,'#a89b86',long.angle);}

      for(const [dx,dz] of [[-5,9],[4,9],[10,-9]]){
        b.cylinder(C[0]+dx,hi+.73,C[1]+dz,1.54,1.5,.68,'#bcb09a',16);
        b.dome(C[0]+dx,hi+1.03,C[1]+dz,1.36,.48,1.36,'#77885b',0,14);
      }
    }
    function mtr(code){
      const [id,ex,ez]=data.entrances[code],p=ring(id),y=ground(...mean(p)),east=code.match(/^[NP]/),cube=code==='A1';
      let index=0,score=Infinity;
      edges(p,(a,c,i)=>{const f=frame(a,c),q=f.at(f.length*.5,0),s=Math.hypot(q[0]-ex,q[2]-ez)+f.length*.75;
        if(s<score){index=i;score=s;}
      });
      if(cube)index=0;
      const f=edge(p,index),L=f.length,back=mean([p[(index+2)%4],p[(index+3)%4]]),front=f.at(L/2,0);
      const D=Math.hypot(front[0]-back[0],front[2]-back[1]),roof=cube?Math.max(y+7.6,top(id)-.5):Math.max(y+2.8,Math.min(top(id),y+4.8));
      const sideFrames=[edge(p,(index+1)%4),edge(p,(index+2)%4),edge(p,(index+3)%4)];
      b.prism(p,y-1.75,y+.065,'#788985','#455552');
      for(const s of sideFrames){
        const n=Math.ceil(s.length/(cube?2.4:1.65));
        tile(b,s,0,s.length,y-.3,y+.68,.002,'#b6bfbc');
        tile(g,s,0,s.length,y+.68,roof-.12,0,'#7eb8bc');
        for(let j=0;j<=n;j++)b.box(...s.at(s.length*j/n,(y+.65+roof)/2),.077,roof-y-.64,.09,steel,s.angle);
        for(let h=y+1.2;h<roof-.1;h+=cube?2.55:1.2)strip(s,h,.065,.095,steel);
      }
      if(cube){
        b.prism(p,roof-.14,roof,'#9db3b7','#c4d0ca');
        const W=L*.26;
        for(const u of [L*.63,L*.63+W])for(const v of [-D*.77,-D*.44])b.box(...f.at(u,(roof+y)/2,v),.16,roof-y,.16,'#54676d',f.angle);
        b.box(...f.at(L*.76,y+2.9,-D*.60),W*.85,2.6,D*.31,'#8caeb2',f.angle);
        for(const v of [y+3.55,roof-.9])b.beam(f.at(L*.65,v,-D*.45),f.at(L*.88,v,-D*.45),.08,steel);
        for(let h=y+5.4;h<roof-.1;h+=2.72){
          tile(g,f,0,L,h-2.70,h,0,'#8dbdc0');strip(f,h,.085,.12,'#b9c7c4');
        }
        for(const u of [0,L*.33,L*.66,L])b.box(...f.at(u,(y+4.4+roof)/2),.1,roof-y-4.4,.13,steel,f.angle);
      }else b.prism(p,roof-.21,roof,'#98aaa9','#bac2bc');
      // Recessed stairwell stays inside its surveyed enclosure. The dark well, stepped
      // return and sloping handrails give depth without opening a hole in the ground mesh.
      const depth=Math.min(5,D*.65),run=L*.89;
      tile(b,f,L*.07,L*.93,y+.08,y+2.72,-depth,'#26393d');
      for(let k=0;k<9;k++){const v=-.22-k*depth/10,sy=y+.07+.18*(1-k/9);
        b.box(...f.at(L/2,sy,v),run,.055,.17,k%2?'#697b7b':'#839492',f.angle);}
      for(const u of [L*.10,L*.54,L*.90]){
        b.beam(f.at(u,y+1.12,-.16),f.at(u,y+.42,-depth),.052,'#d4d9ce');
        b.box(...f.at(u,y+.58,-.22),.06,1.05,.06,steel,f.angle);
      }
      const sy=cube?y+3.7:roof-.45;
      const header=(c,w,h)=>{
        c.fillStyle='#173e50';c.fillRect(0,0,w,h);
        c.fillStyle='#be263b';c.beginPath();c.ellipse(57,62,41,49,0,0,TAU);c.fill();
        c.strokeStyle='#fffcf0';c.lineWidth=6;c.lineCap='round';c.beginPath();c.moveTo(57,24);c.lineTo(57,99);
        for(const s of [-1,1]){c.moveTo(57+s*15,38);c.bezierCurveTo(57+s*15,64,57-s*15,62,57-s*15,87);}c.stroke();
        lettering(c,east?'尖東站':'尖沙咀站',218,42,'bold 48px','#ffffed',211);
        lettering(c,east?'East Tsim Sha Tsui':'Tsim Sha Tsui',218,89,'bold 23px','#f9f9e9',219);
        c.fillStyle='#eeeddf';c.fillRect(357,13,137,98);lettering(c,code,425,66,'bold 76px','#203543',126);
      };
      sign(f,L/2,sy,.09,L*.98,cube?.95:.74,header);
      for(const s of [sideFrames[0],sideFrames[2]])if(s.length>4.1){
        sign(s,s.length*.5,cube?y+3.65:roof-.48,.10,Math.min(4.75,s.length*.8),.69,header);
      }
    }
    function water(i){
      const source=data.water[i];
      source.surfaces.forEach((r,k)=>{const level=i===0?20.3:k===0?25.95:26.90;
        b.prism(r,level-.26,level,i?'#719588':'#72928d',i?'#5f9486':'#689793');
      });
      edges(source.p,(a,c,j)=>{
        const len=Math.hypot(c[0]-a[0],c[1]-a[1]),n=Math.ceil(len/1.7);
        for(let k=0;k<n;k++){const q=lerp2(a,c,(k+.5)/n),h=poolLevel(i,q[1]);
          b.dome(q[0],h-.13,q[1],Math.max(.75,len/n*.57),.28+(k%3)*.1,.8,['#a5a18a','#8f9482','#adb09b'][(k+j)%3],-Math.atan2(c[1]-a[1],c[0]-a[0]),8);}
      });
    }
    function lake(){
      water(0);
      // Flamingos are small at natural scale; silhouette the curved neck and dark-tipped bill.
      [[-53,-438],[-50.8,-436.4],[-53.8,-433.9],[-49,-439.6],[-28.7,-439.3],[-27.3,-437.8],[-25.2,-439]].forEach(([x,z],i)=>{
        const f=frame([x,z],[x+.68+(i%2)*.3,z+(i%3-1)*.75]),y=20.3,rose=i%2?'#dfafa2':'#dc9991';
        for(const v of [-.10,.10])b.beam(f.at(.0,y-.05,v),f.at(.06,y+.66,v),.026,'#a47369');
        b.dome(x,y+.58,z,.35,.26,.21,rose,f.angle,10);
        const neck=[f.at(.19,y+.64),f.at(.35,y+.83),f.at(.25,y+1.10),f.at(.35,y+1.25),f.at(.52,y+1.17)];
        for(let j=1;j<neck.length;j++)b.beam(neck[j-1],neck[j],j===4?.055:.049,rose);
        b.beam(neck.at(-1),f.at(.54,y+1.09),.044,'#423b39');
      });
    }
    function garden(){
      water(1);const [x,z]=pavilion,level=26.90,deck=level+.58,n=6;
      const point=(i,r,y)=>[x+Math.cos(i*TAU/n)*r,y,z+Math.sin(i*TAU/n)*r];
      b.cylinder(x,deck-.3,z,3.55,3.5,.63,'#a4a194',6,0,Math.PI/6);
      for(let i=0;i<n;i++){const j=i+1;
        const p=point(i,2.65,deck+1.47);b.cylinder(...p,.145,.18,2.98,'#705a47',9);
        const arc=(i,t)=>point(i,4.05*(1-t),deck+3.22+t*t*2.35+.42*Math.pow(1-t,4));
        const mid=a=>point(i+.5,3.55*(1-a),deck+3.07+a*a*2.38);
        for(let k=0;k<5;k++){const s=k/5,t=(k+1)/5;
          b.quad(arc(i,s),mid(s),mid(t),arc(i,t),'#576c62');b.quad(mid(s),arc(j,s),arc(j,t),mid(t),'#445b54');
          b.beam(arc(i,s),arc(i,t),.085,'#838e7a');}
        if(i!==0)for(const y of [.47,.91])b.beam(point(i,2.72,deck+y),point(j,2.72,deck+y),.065,'#776855');
      }
      b.cylinder(x,deck+5.67,z,.06,.21,.42,'#85826a',8);
      const path=[[72,-492],[76,-488],[83,-491],[87,-495],[91,-496]];
      for(let j=1;j<path.length;j++){const a=path[j-1],c=path[j],f=frame(a,c),y=deck+.03;
        b.box(...f.at(f.length/2,y,0),f.length+.14,.28,1.45,'#c5bda3',f.angle);
        for(const side of [-1,1]){b.beam(f.at(0,y+.74,side*.66),f.at(f.length,y+.74,side*.66),.055,'#bfbda8');
          b.box(...f.at(.1,y+.35,side*.66),.12,.78,.12,'#b7b19a');}
      }
      for(let x=65;x<=72;x+=1.25)b.dome(x,26.15,-507,1.04,.66,.82,'#8c9785',0,8);
    }
    function playground(){
      for(const [i,[x,z]] of fortCenters.entries()){
        const terrain=ground(x,z),y=terrain+.15,r=i?5.6:6.8;
        b.cylinder(x,y-.4,z,r-.2,r-.2,.85,'#ae937e',24);
        // An open horseshoe of stonework around each former emplacement.
        for(let k=0;k<25;k++){
          const a=fortAngle(k),c=fortAngle(k+1);
          const P=(v,r,h)=>[x+r*Math.cos(v),y+h,z+r*Math.sin(v)];
          const A=P(a,r,0),C=P(c,r,0),floor=Math.min(ground(A[0],A[2]),ground(C[0],C[2]),y)-y-.25;
          b.quad(P(a,r,floor),P(c,r,floor),P(c,r,1.24),P(a,r,1.24),'#ae897b');
          b.quad(P(a,r,1.24),P(c,r,1.24),P(c,r-.57,1.24),P(a,r-.57,1.24),'#d0b5a1');
          b.quad(P(a,r-.57,0),P(a,r-.57,1.24),P(c,r-.57,1.24),P(c,r-.57,0),'#98796e');
          if(k%2===0){b.beam(P(a,r-.23,1.23),P(a,r-.23,2.0),.041,'#8e9a94');}
          b.beam(P(a,r-.23,1.97),P(c,r-.23,1.97),.04,'#a9aba1');
        }
        for(let j=0;j<5;j++)b.box(x,y+.09+j*.15,z+2.8-j*.48,3.5,.18,.52,'#c2aa91');
        b.cylinder(x,y+.55,z,1.75,2.14,1.1,'#b39b82',20);
      }
      const f=frame([-36,-586],[-26,-586]),y=ground(-31,-586);
      b.box(...f.at(5,y+1.36,0),9.8,2.72,1.9,'#a7867a',f.angle);
      for(const u of [1.55,5,8.2])tile(b,f,u-.60,u+.60,y+.18,y+1.82,.97,'#63584f');
      sign(f,5,y+2.30,.975,3.7,.62,'歷奇樂園','DISCOVERY PLAYGROUND','#536753');
    }
    function parkGate(){
      const [x,z]=gate,f=frame([x-1.8,z],[x+1.8,z]),y=ground(x,z);
      for(const u of [.14,3.46]){b.box(...f.at(u,y+1.16,0),.21,2.32,.21,'#62785c');b.dome(...f.at(u,y+2.39,0),.19,.23,.19,'#adbd9e',0,9);}
      const graphic=(c,w,h)=>{const grad=c.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#69c6c5');grad.addColorStop(1,'#8cb463');c.fillStyle=grad;c.fillRect(0,0,w,h);
        for(let j=0;j<45;j++){const u=(j*137)%w,v=91+(j*13)%36;c.fillStyle=['#d28078','#eac56e','#aa80a0','#52945f'][j%4];c.beginPath();c.arc(u,v,5+j%5,0,TAU);c.fill();}
        lettering(c,'九 龍 公 園',w/2,46,'bold 49px','#3a664b');lettering(c,'KOWLOON PARK',w/2,86,'bold 22px','#2b6556');};
      sign(f,1.8,y+1.42,.035,3.36,1.58,graphic);
      for(let i=0;i<5;i++)b.dome(x-1.3+i*.65,y+.19,z+.22,.38,.32,.36,'#739054',0,8);
    }
    function place(id,name,x,z,make){
      b=new Parts();g=new Parts();signs=signBatch();
      const group=new T.Group();group.name=name;group.userData.landmark=id;make(group);
      if(b.p.length)group.add(b.finish(name));if(g.p.length){const panes=g.finish('Glass');panes.material=glassMat;panes.castShadow=false;group.add(panes);}
      signs.finish(group);scene.add(group);placed.push({id,n:name,name,en:name,x,z,mesh:group});
    }
    const builders={science,isquare,peking,chungking,k11,musea,heritage,sports,terminal,ocean,gateway};
    const extensionBuilder=(extension,id)=>group=>extension.build(id,{b,group,frame,edges,ring,low,top,shell,sign,tile,ground});
    for(const extension of [window.HKHeritage,window.HKHarbourPlaces]){
      for(const [id] of extension?.sites||[])builders[id]=extensionBuilder(extension,id);
    }
    for(const [id,name,ids] of sites)if(ids.every(k=>records.has(k))){
      const [x,z]=mean(ring(ids[0]));place(id,name,x,z,builders[id]||(()=>mtr(id)));
    }
    for(const [id,name,x,z] of window.HKHarbourPlaces?.walks||[])place(id,name,x,z,extensionBuilder(HKHarbourPlaces,id));
    place('birdlake','九龍公園鳥湖',-30,-439,lake);place('garden','中國花園',...pavilion,garden);
    place('play','歷奇樂園',-31,-583,playground);place('parkgate','九龍公園海防道入口',...gate,parkGate);
    return placed;
  }
  return {prepare,replaces:b=>replaced.has(b),build,parkTerrain,clearPlanting,parkSolids,isPond,atlas,signBatch,lettering};
})();
