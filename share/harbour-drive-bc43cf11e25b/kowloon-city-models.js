// Architectural elevations use the surveyed outlines and absolute roof levels.
window.HKKowloonCityModels=(()=>{
  const {faces,shell,badge}=HKCoastModels.geometry;
  const mall=1030225, market=285292, school=1075581, studio=1107627, temple=1090940, yamen=1113204;
  const roofs=HKKowloonGarden.roofs, campus=new Set([school,studio]);
  const signs=new Map([
    [mall,['九龍城廣場','KCP  ·  KOWLOON CITY PLAZA','#31765b']],
    [market,['九龍城街市及熟食中心','KOWLOON CITY MARKET','#246961']],
    [school,['香港兆基創意書院','HKICC LEE SHAU KEE SCHOOL OF CREATIVITY','#984a43']],
    [temple,['侯王古廟','HAU WONG TEMPLE','#7e322c']],
    [yamen,['九龍寨城公園 · 衙府','KOWLOON WALLED CITY PARK','#725039']]
  ]);
  const publicFace=new Map([[mall,[1855,-3836]],[market,[1934,-3712]],[school,[1764,-4222]],[temple,[1776,-4074]],[yamen,[2115,-3972]]]);
  const special=b=>!b.foundation&&(b.id===mall||b.id===market||campus.has(b.id)||!!roofs[b.id]);
  function panel(m,f,u,y,w,h,d,col){
    m.quad(f.at(u-w/2,y-h/2,d),f.at(u+w/2,y-h/2,d),f.at(u+w/2,y+h/2,d),f.at(u-w/2,y+h/2,d),col);
  }
  function flatRoof(mesh,b){
    const rings=[b.p,...(b.holes||[])].map(r=>r.map(([x,z])=>new THREE.Vector2(x,z)));
    const idx=THREE.ShapeUtils.triangulateShape(rings[0],rings.slice(1)),vertices=rings.flat();
    for(const t of idx)mesh.tri(...t.map(i=>[vertices[i].x,b.top,vertices[i].y]),'#b7b8ae');
  }
  function mainFace(b,fs){
    const target=publicFace.get(b.id);
    return fs.filter(f=>f.w>=Math.min(8,Math.max(...fs.map(f=>f.w))*.8)).sort((a,c)=>{
      const cost=f=>{const [x,,z]=f.at(0,0,0);return Math.hypot(x-target[0],z-target[1])-.13*Math.min(f.w,35)};
      return cost(a)-cost(c);
    })[0];
  }
  function facade(b,m,f,lit){
    const base=b.basePD,top=b.top,h=top-base,schoolBlock=campus.has(b.id);
    const hall=b.id===market,plaza=b.id===mall;
    const paint=(u,y,w,dh,depth,color)=>{if(m)panel(m,f,u,y,w,dh,depth,color)};
    const lamp=(u,y,w,dh,d,color)=>lit?.litPanel(f.at,u,y,d,w,dh,color);
    if(roofs[b.id]){
      const rise=Math.min(1.9,h*.28),eave=top-rise,isTemple=b.id===temple;
      paint(0,(eave+base-2)/2,f.w,eave-base+2,0,isTemple?'#b77460':'#ded6c2');
      paint(0,eave-.22,f.w,.45,.065,'#574e43');
      for(let u=-f.w/2+1.7;u<f.w/2-1;u+=3.3){
        paint(u,base+(eave-base)*.43,1.18,(eave-base)*.64,.08,isTemple?'#813526':'#55483b');
        lamp(u,base+(eave-base)*.55,.75,.7,.11,'#eec084');
      }
      return;
    }
    paint(0,base+h/2-1.2,f.w,h+2.4,0,plaza?'#deded7':hall?'#dbcdc0':'#e0e0d9');
    if(f.w<2)return;
    // Lower loggia, concourse glazing or retail arcade set between columns.
    const bays=Math.max(1,Math.floor(f.w/(hall?4.4:5.4))),pitch=f.w/bays;
    for(let j=0;j<bays;j++){
      const u=(j+.5-bays/2)*pitch;
      paint(u,base+2.25,pitch*.84,4.2,.045,plaza?'#507771':hall?'#58615c':'#67848a');
      if(j%3!==1)lamp(u,base+2.8,pitch*.64,1.64,.09,plaza?'#f2dbab':'#dbc9a7');
    }
    const floors=Math.max(1,Math.floor((h-4)/3.5)),step=(h-4)/floors;
    for(let k=0;k<floors;k++){
      const y=base+4+(k+.47)*step;
      if(plaza){
        const tone=k%3===1?'#688f80':'#bbc4bb';
        paint(0,y,f.w,step*.39,.07,tone);
        if(k===0||k===floors-1)lamp(0,y+.07,f.w*.98,.11,.1,'#b3d8b9');
      }else{
        for(let j=0;j<bays;j++){
          const u=(j+.5-bays/2)*pitch,colour=hall?'#677b70':'#5c737a';
          paint(u,y,pitch*(hall?.68:.91),step*.56,.065,colour);
          if((j*5+k*3+b.id)%9<3)lamp(u,y,pitch*.58,step*.41,.10,schoolBlock?'#dae1d9':'#e9ce99');
        }
        paint(0,y-step*.32,f.w,hall?.39:.55,.12,hall?'#af8776':'#eeebe1');
      }
    }
    if(hall)paint(0,base+4.55,f.w,.58,.15,'#477e70');
    if(schoolBlock&&f.w>17){
      const u=-f.w*.30;
      paint(u,base+h*.5,Math.min(2.2,f.w*.06),h*.87,.16,'#a44b40');
      if(b.id===studio)for(let j=0;j<5;j++)paint((j-2)*f.w*.13,base+3.2,f.w*.124,3.1,.18,['#b95643','#dba858','#8aa29a','#758796','#b995ac'][j]);
    }
  }
  function civic(b,m,lit,labels){
    const fs=faces(b.p);
    for(const f of fs)facade(b,m,f,lit);
    for(const hole of b.holes||[])for(const f of faces(hole))if(m)panel(m,f,0,b.basePD+b.h/2,f.w,b.h,0,'#cecec4');
    if(m&&roofs[b.id]){
      const rise=Math.min(1.9,b.h*.28);
      for(const tri of roofs[b.id])m.tri(...tri.map(([x,z,t])=>[x,b.top-rise+rise*t,z]),b.id===temple?'#57705c':'#65665d');
      if(b.id===temple){
        // The ceramic ridge is confined to the surveyed temple roof.
        for(const tri of roofs[b.id]){
          const end=tri.filter(v=>v[2]>.999);
          if(end.length===2){const [a,c]=end;m.quad([a[0],b.top,a[1]],[c[0],b.top,c[1]],[c[0],b.top+.27,c[1]],[a[0],b.top+.27,a[1]],'#75977b');}
        }
      }
    }else if(m)flatRoof(m,b);
    if(signs.has(b.id)){
      const f=mainFace(b,fs),h=roofs[b.id]?Math.min(3.1,b.h*.53):4.95,w=Math.min(b.id===mall?21:15,f.w*.88);
      if(labels)badge(f,labels,b.basePD+h,.24,w,Math.min(1.38,w*.16),signs.get(b.id));
      if(lit)lit.litPanel(f.at,0,b.basePD+h+.80,.24,w,.10,'#f2d094');
      if(m&&b.id===mall&&f.w>21){
        const palette=['#548c81','#b67659','#977ca1'];
        palette.forEach((col,i)=>{const u=(i-1)*f.w*.245;panel(m,f,u,b.basePD+12,f.w*.22,8,.14,col);
          panel(m,f,u,b.basePD+14.2,f.w*.16,.42,.16,'#e9daba');});
      }
    }
  }
  function garden(mesh,lit,height){
    for(const feature of HKKowloonGarden.features){
      const {kind,p,y}=feature;
      if(kind==='pond')continue;
      if(kind==='remains'){
        if(mesh)for(const f of faces(p)){
          const a=f.at(-f.w/2,0,0),b=f.at(f.w/2,0,0);
          a[1]=height(a[0],a[2]);b[1]=height(b[0],b[2]);
          mesh.quad(a,b,[b[0],b[1]+.46,b[2]],[a[0],a[1]+.46,a[2]],'#9c9382');
        }
        continue;
      }
      const cx=p.reduce((v,q)=>v+q[0],0)/p.length,cz=p.reduce((v,q)=>v+q[1],0)/p.length;
      const tall=kind==='tower',eave=y+(tall?7.2:3.3);
      for(const f of faces(p)){
        if(mesh){
          const a=f.at(-f.w/2,eave,0),b=f.at(f.w/2,eave,0);
          const c=[cx+(b[0]-cx)*.61,eave+.57,cz+(b[2]-cz)*.61],d=[cx+(a[0]-cx)*.61,eave+.57,cz+(a[2]-cz)*.61];
          mesh.quad(a,b,c,d,'#657267');mesh.tri(c,d,[cx,eave+(tall?3.3:1.9),cz],'#53665d');
          const post=f.at(-f.w/2,0,-.4),h=height(post[0],post[2]);
          for(const [dx,dz] of [[.14,0],[0,.14]])mesh.quad([post[0]-dx,h,post[2]-dz],[post[0]+dx,h,post[2]+dz],[post[0]+dx,eave,post[2]+dz],[post[0]-dx,eave,post[2]-dz],'#865349');
          if(tall){panel(mesh,f,0,y+2.7,f.w*.94,4.9,-.2,'#dbd1b7');panel(mesh,f,0,y+3,f.w*.58,2.35,-.15,'#766450');}
        }
        if(lit&&f.w>2.5)lit.litPanel(f.at,0,eave-.15,-.16,Math.min(f.w*.6,2.8),.13,'#e9bf82');
      }
    }
  }
  // Granite terrace and open entrance pavilion at the Junction Road temple.
  function forecourt(mesh,lit,height){
    const at=(u,y,v)=>[1795.9+.87*u+.493*v,y,-4064.3-.493*u+.87*v];
    if(lit){
      for(const u of [-1.85,1.85]){
        lit.litQuad(at(u-.16,26,.92),at(u+.16,26,.92),at(u+.16,26.48,.92),at(u-.16,26.48,.92),'#efaf74');
      }
      return;
    }
    const terrace=HKKowloonGarden.templeTerrace;
    const top=24.0;
    for(const f of faces(terrace)){
      const a=f.at(-f.w/2,top,0),b=f.at(f.w/2,top,0);
      mesh.quad([a[0],height(a[0],a[2])-.2,a[2]],[b[0],height(b[0],b[2])-.2,b[2]],b,a,'#8f8a7b');
    }
    for(const tri of HKKowloonGarden.templeCap)mesh.tri(...tri.map(([x,z])=>[x,top,z]),'#b0a895');
    for(const u of [-2.25,2.25])for(const v of [-1.35,1.35]){
      const corners=[[-.14,-.14],[.14,-.14],[.14,.14],[-.14,.14]];
      for(let i=0;i<4;i++){
        const [x,z]=corners[i],[xx,zz]=corners[(i+1)%4];
        mesh.quad(at(u+x,top,v+z),at(u+xx,top,v+zz),at(u+xx,27.35,v+zz),at(u+x,27.35,v+z),'#908c80');
      }
    }
    for(const side of [-1,1]){
      const rows=[[27.75,2.05],[27.48,1.65],[27.95,.80],[28.75,0]];
      for(let i=1;i<rows.length;i++){
        const [h0,v0]=rows[i-1],[h1,v1]=rows[i],w0=2.35+v0*.44,w1=2.35+v1*.44;
        mesh.quad(at(-w0,h0,side*v0),at(w0,h0,side*v0),at(w1,h1,side*v1),at(-w1,h1,side*v1),i===1?'#967c5d':'#537062');
      }
      mesh.tri(at(side*3.15,27.66,-2.05),at(side*3.15,27.66,2.05),at(side*2.35,28.74,0),'#d6c394');
      mesh.quad(at(-2.45,28.73,side*.08),at(2.45,28.73,side*.08),at(2.48,29.02,side*.08),at(-2.48,29.02,side*.08),'#8a986d');
    }
    // Shallow stone treads rise from the mapped public approach.
    for(const stair of HKKowloonGarden.templeSteps){
      let h0=height(...stair[0])+.04;
      for(let j=1;j<stair.length;j++){
        const a=stair[j-1],b=stair[j],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
        const h1=Math.min(top+.02,Math.max(height(...b)+.05,top+.02-(stair.length-1-j)*.4));
        const n=Math.max(2,Math.ceil(Math.abs(h1-h0)/.17));
        const v=(i,off,y)=>[a[0]+dx*i/n-dz*off/len,y,a[1]+dz*i/n+dx*off/len];
        for(let i=0;i<n;i++){
          const h=h0+(h1-h0)*i/n,hnext=h0+(h1-h0)*(i+1)/n;
          mesh.quad(v(i,-.85,h),v(i,.85,h),v(i+1,.85,h),v(i+1,-.85,h),'#b6b2a4');
          mesh.quad(v(i+1,-.85,h),v(i+1,.85,h),v(i+1,.85,hnext),v(i+1,-.85,hnext),'#8f8d82');
        }
        h0=h1;
      }
    }
  }
  function render(b,group,labels,height){
    const m=shell(b.n||'九龍寨城公園',group);
    civic(b,m,null,labels);
    if(b.id===yamen)garden(m,null,height);
    if(b.id===temple)forecourt(m,null,height);
    m.finish();
  }
  function lights(b,lit){if(special(b)){civic(b,null,lit);if(b.id===yamen)garden(null,lit);if(b.id===temple)forecourt(null,lit);}}
  return {replaces:special,lights,
    building(b,props,signs,height,group){if(special(b)){render(b,group,signs,height);lights(b,props);}},
    distant(b,batch,group,height){if(!special(b))return false;render(b,group,null,height);return true;}
  };
})();
