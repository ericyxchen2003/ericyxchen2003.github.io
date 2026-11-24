// Street elevations use the registered building blocks and their surveyed roof levels.
window.HKTaiModels=(()=>{
  const retail={
    'Olympian City One':['奧海城一期','OLYMPIAN CITY 1','#488d9b'],
    'Olympian City Two':['奧海城二期','OLYMPIAN CITY 2','#467d86'],
    'Olympian City Three':['奧海城三期','OLYMPIAN CITY 3','#906c50'],
    'Metro Harbour Plaza':['港灣豪庭廣場','METRO HARBOUR PLAZA','#506f89'],
    'Hoi Fu Shopping Centre':['海富商場','HOI FU SHOPPING CENTRE','#588479'],
    'Olympic Station':['奧運站','Olympic Station','#24665e']
  };
  const names=new Map(Object.entries(retail).map(([k,v])=>[k.toUpperCase(),v]));
  for(const [i,phase] of ['One','Two','Three'].entries())names.set('OLYMPIAN CITY '+(i+1),retail['Olympian City '+phase]);
  // Spandrels, corner pilasters and roof enclosures distinguish adjacent estates at driving distance.
  const estates=[
    ['Island Harbourview','#dbd1bb','#679da1',5],['Harbour Green','#b4ccc6','#447f79',6],
    ['The Long Beach','#d2d5cb','#537d89',6],['One Silver Sea','#c2c9d2','#526f92',6],
    ['Metro Harbour View','#d5c2ac','#838698',7],['Florient Rise','#d1c6b4','#686f79',7],
    ['Park Avenue','#e2d2bf','#91a29a',5],['Central Park','#ddc4ac','#75908f',5],
    ['The Hermitage','#d9c5aa','#6c7478',7]
  ];
  const estate=b=>b.h>40 && estates.find(r=>b.en?.startsWith(r[0]));
  const municipal=b=>b.id===253330&&!b.foundation;
  let atlas,roofMaterial;
  const labels=new Map();
  function sign(text){
    const [zh,en,bg]=text,key=text.join('|');
    if(!labels.has(key)){
      atlas??=HKDetails.atlas();
      labels.set(key,atlas.add((ctx,w,h)=>{
        ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
        HKDetails.lettering(ctx,zh,w/2,48,'bold 55px','#fff8de',w-20);
        HKDetails.lettering(ctx,en,w/2,98,'bold 25px','#edf7f1',w-18);
      }));
    }
    return labels.get(key);
  }
  function sides(ring,props,signs){
    const area=ring.reduce((n,p,i)=>{const q=ring[(i+1)%ring.length];return n+p[0]*q[1]-q[0]*p[1];},0);
    return ring.map((p,i)=>{
      const q=ring[(i+1)%ring.length],dx=q[0]-p[0],dz=q[1]-p[1],w=Math.hypot(dx,dz);
      const rot=Math.atan2(dz,dx)+(area>0?Math.PI:0),c=Math.cos(rot),s=Math.sin(rot);
      const at=(u,y,v)=>[(p[0]+q[0])/2+u*c-v*s,y,(p[1]+q[1])/2+u*s+v*c];
      return {w,at,nx:-s,nz:c,
        box:(u,y,v,width,h,d,color)=>props.add('box',...at(u,y,v),width,h,d,color,-rot),
        badge:(u,y,v,width,h,text)=>signs.quad(sign(text),[at(u-width/2,y-h/2,v),at(u+width/2,y-h/2,v),at(u+width/2,y+h/2,v),at(u-width/2,y+h/2,v)])
      };
    }).filter(f=>f.w>.25);
  }
  function civic(b,faces,props,group,height){
    const white='#e6e5d9',gold='#c99f3e',blue='#426674',dark='#35464a';
    const top=b.top,base=b.basePD,H=top-base;
    const front=faces.reduce((best,f)=>f.nz>best.nz?f:best);
    const pool=faces.reduce((best,f)=>f.nx>best.nx?f:best);
    for(const f of faces){
      const {w,box,badge}=f;
      const foot=Math.min(base-1,...[-.49,0,.49].map(t=>{const [x,,z]=f.at(w*t,0,0);return height(x,z)-.55;}));
      box(0,(top+foot)/2,-.83,w,top-foot,1.6,dark);
      // Perimeter columns run to the pavement, closing the corners of each ward.
      for(const u of [-.5,.5])box(u*(w-1.5),base+H/2,-.10,1.6,H,.28,white);
      box(0,top-1.05,-.08,w,2.1,.35,white);
      if(f===front){
        box(0,top-7.5,-.03,w-3,10.4,.34,gold);
        box(w*.07,top-3.45,.16,w*.65,1.65,.12,'#2c3939');
        box(0,base+28.8,.02,w-2,13.1,.38,white);
        for(let row=0;row<11;row++)box(0,base+22.7+row*1.16,.225,w-2,.055,.035,'#c7c9c0');
        for(let u=-w*.43;u<w*.47;u+=3.6)box(u,base+28.8,.23,.045,12.8,.04,'#c0c4bb');
        box(0,base+38.6,.04,w-2,6.7,.32,gold);
        const span=w*.72,center=-w*.035;
        // Set the glass back behind the two-storey frame so the sill and
        // side returns read as real openings when seen obliquely from Ivy Street.
        for(let i=0;i<=4;i++)box(center+span*(i/4-.5),base+12,.28,.96,19.3,1.05,gold);
        for(const [y,h] of [[5.5,4.05],[12.75,1.4],[20.15,2.75]])
          box(center,base+y,.28,span+.9,h,1.05,gold);
        for(let i=0;i<4;i++)for(let row=0;row<2;row++){
          const u=center+span*((i+.5)/4-.5),y=base+9.5+row*6.4,ww=span/4-1.05;
          box(u,y,-.09,ww,4.9,.12,'#334b4e');
          box(u,y-1.1,.25,ww,.12,.10,'#bdc1ac');
          for(let j=-2;j<=2;j++)box(u+j*ww/5,y-1.8,.24,.07,1.4,.09,'#9ba5a1');
        }
        box(w*.405,base+13.4,.12,w*.13,21,.45,white);
        badge(w*.405,base+14.2,.37,w*.12,4.0,['體育館','SPORTS CENTRE','#437a74']);
        for(let i=-2;i<=2;i++){
          box(i*3.0,base+1.48,.05,2.77,2.95,.24,'#46616a');
          box(i*3.0,base+1.45,.21,.09,2.85,.08,'#adb6ad');
        }
        box(0,base+3.03,.96,17,.23,2.0,'#b9c0ad');
        for(const u of [-7.8,7.8])box(u,base+1.5,1.75,.16,3,.16,'#89958a');
        badge(0,base+3.9,.86,Math.min(21,w*.58),1.65,['大角咀街市','TAI KOK TSUI MARKET','#62644f']);
      }else if(f===pool){
        box(0,base+H*.57,-.02,w-3,H*.78,.3,blue);
        for(let i=1;i<=8;i++)box((i/9-.5)*w,base+H*.57,.16,.23,H*.78,.26,'#819aa1');
        for(let i=1;i<11;i++)box(0,base+7+i*3.6,.18,w-3,.26,.3,'#8b9b99');
        for(const y of [15,20,25])box(0,base+y,.29,w-2.8,1.35,.5,white);
        box(-w*.37,base+H*.52,.45,w*.11,H*.87,.65,gold);
      }else{
        box(0,base+H/2,-.09,w-3,H-3,.3,white);
        for(let i=1;i<9;i++){
          const ww=w*(i>5?.60:.76),y=base+4.5+i*4.7;
          box(w*.04,y,.095,ww,2.45,.19,i>5?blue:dark);
          for(let j=1;j<7;j++)box(w*.04+ww*(j/7-.5),y,.22,.16,2.45,.14,'#c5cbc4');
        }
        if(f.nz<-.3){
          box(w*.37,base+H*.27,.21,2.6,H*.5,.68,'#a6634d');
          box(0,base+4.7,.65,w*.67,.35,1.35,'#b9c6bd');
          badge(0,base+6,.36,Math.min(27,w*.72),2.18,['大角咀市政大廈','TAI KOK TSUI MUNICIPAL SERVICES BUILDING','#596e71']);
          for(let j=-2;j<=2;j++)box(j*2.65,base+1.8,.18,2.3,3.5,.34,'#365862');
        }
      }
    }
    const poly=b.p.map(([x,z])=>new THREE.Vector2(x,z)),tri=THREE.ShapeUtils.triangulateShape(poly,[]),v=[];
    for(const face of tri)for(const i of face)v.push(poly[i].x,top,poly[i].y);
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.computeVertexNormals();
    roofMaterial??=new THREE.MeshLambertMaterial({color:0xb6b8ab,side:THREE.DoubleSide});
    const roof=new THREE.Mesh(geo,roofMaterial);roof.name='大角咀市政大廈';group.add(roof);
    const center=b.p.reduce((a,p)=>[a[0]+p[0]/b.p.length,a[1]+p[1]/b.p.length],[0,0]);
    props.add('box',center[0],top+.48,center[1],12,.95,6,'#b9c3bd',-.17);
  }
  function building(b,props,signs,height,group){
    if(!b.p||b.foundation)return;
    const mall=names.get(b.en?.toUpperCase()),home=estate(b);
    if(!municipal(b)&&!mall&&!home)return;
    const faces=sides(b.p,props,signs);if(!faces.length)return;
    if(municipal(b)){civic(b,faces,props,group,height);return;}
    const top=b.top,low=b.basePD,h=top-low;
    const longest=faces.reduce((best,f)=>f.w>best.w?f:best);
    if(home){
      const [,trim,band]=home;
      for(const f of faces){
        if(f.w<4)continue;
        f.box(0,top-.65,.035,f.w,1.3,.22,trim);
        if(f.w<7)continue;
        f.box(f.w*.38,low+h*.52,.09,.56,h*.93,.28,trim);
        for(const t of [.28,.56,.82])f.box(0,low+h*t,.08,f.w,.54,.25,band);
      }
      if(longest.w>8)longest.box(0,top+.65,-1.05,longest.w*.66,1.35,1.9,trim);
      return;
    }
    const station=b.en==='Olympic Station',trim=mall[2];
    for(const f of faces){
      if(f.w<6)continue;
      const H=Math.min(h-1,station?13:12);
      f.box(0,top-.7,.08,f.w,1.2,.42,trim);
      if(H<3)continue;
      f.box(0,low+H*.55,.06,f.w-.16,H*.88,.22,station?'#516f71':'#507887');
      const n=Math.max(1,Math.round(f.w/(station?4.4:3.65)));
      for(let i=0;i<n;i++)f.box((i/n-.5)*f.w,low+H*.55,.24,.21,H*.90,.34,'#c3c8bc');
      f.box(0,low+H*.79,.23,f.w,.24,.38,'#a7b9b4');
      if(f.w>17)f.box(0,low+4.9,.37,f.w*.88,.35,.85,trim);
    }
    if(longest.w>12&&h>5){
      longest.badge(0,low+Math.min(8.2,h*.66),.48,Math.min(20,longest.w*.72),2.4,mall);
      if(station)longest.box(0,top+.18,-1,longest.w*.88,.44,1.8,'#92b0a7');
    }
  }
  return {building,replaces:municipal,style:b=>names.has(b.en?.toUpperCase())?12:estate(b)?.[3]};
})();
