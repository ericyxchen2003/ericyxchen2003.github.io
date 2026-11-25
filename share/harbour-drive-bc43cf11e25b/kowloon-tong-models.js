// Street elevations are attached to the actual survey volumes, including stacked podiums.
window.HKKowloonTongModels=(()=>{
  const {faces,shell,badge}=HKCoastModels.geometry;
  const sites=[
    ['mall',[2091635,2104093],'又一城','FESTIVAL WALK',[442,-4528],'#bac4c5','#456575'],
    ['university',[2235619],'香港城市大學','CITY UNIVERSITY OF HONG KONG',[321,-4594],'#d3c3a5','#476b78'],
    ['crystal',[2244189],'邵逸夫創意媒體中心','CREATIVE MEDIA CENTRE',[-107,-4862],'#dfdfd8','#59676a'],
    ['college',[2337478,2111853,2337475,2337609],'香港浸會大學','HONG KONG BAPTIST UNIVERSITY',[956,-4945],'#ba8876','#525c65'],
    ['hall',[2245873],'大學會堂','ACADEMIC COMMUNITY HALL',[956,-4995],'#be916e','#69605a'],
    ['chapel',[2111267],'大學禮拜堂','UNIVERSITY CHAPEL',[1046,-4973],'#c4a18a','#525f68'],
    ['hospital',[2110331,2152061,2151798,2236471,2236470,2236472,2075519],'香港浸信會醫院','HONG KONG BAPTIST HOSPITAL',[1014,-4825],'#ded9cb','#608d8b'],
    ['broadcast',[2249523],'香港電台廣播大廈','RTHK  ·  BROADCASTING HOUSE',[1090,-5050],'#d1bdb0','#665f5b'],
    ['education',[2255455,2255652],'教育局九龍塘教育服務中心','EDUCATION SERVICES CENTRE',[762,-4523],'#d7cbbc','#698890'],
    ['temple',[2112439],'中國香港聖殿','HONG KONG CHINA TEMPLE',[744,-4891],'#e6e2d5','#97adb0'],
    ['franki',[2111604],'建新中心','FRANKI CENTRE',[1119,-4774],'#bd907f','#526c71'],
    ['tao',[2227524],'省善真堂','SHANG SIN CHUN TONG',[726,-4200],'#e1cdab','#84443a'],
    ['mansion',[138247,139139],'','',[952,-4045],'#a6bc99','#476656'],
    ['villa',[2269777],'四季薈','MY PALACE',[682,-4652],'#e3d8c7','#626b69'],
    ['church',[145571],'聖德肋撒堂','ST. TERESA’S CHURCH',[832,-3298],'#e4d7bc','#a87763'],
    ['clock',[324407],'中電鐘樓文化館','CLP PULSE',[758,-2792],'#ad5d45','#485c62']
  ];
  const byId=new Map(sites.flatMap(row=>row[1].map(id=>[id,row])));
  const houseColors=['#ded5be','#cbb7a5','#d6d5c2','#d5c7b9','#c6d3c5'];
  for(const id of window.HKTongVillas||[]){
    if(!byId.has(id))byId.set(id,['house',[id],'','',[770,-4410],houseColors[id%houseColors.length],'#5b7471']);
  }
  const replaces=b=>!b.foundation&&byId.has(b.id);
  function panel(m,f,u,y,w,h,d,col){
    m?.quad(f.at(u-w/2,y-h/2,d),f.at(u+w/2,y-h/2,d),f.at(u+w/2,y+h/2,d),f.at(u-w/2,y+h/2,d),col);
  }
  function roof(m,b,y,col){
    if(!m)return;
    const rings=[b.p,...(b.holes||[])].map(r=>r.map(([x,z])=>new THREE.Vector2(x,z)));
    const indices=THREE.ShapeUtils.triangulateShape(rings[0],rings.slice(1)),v=rings.flat();
    for(const triangle of indices)m.tri(...triangle.map(i=>[v[i].x,y,v[i].y]),col);
  }
  function box(m,x,z,y,w,d,h,col){
    if(!m)return;
    const a=[[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2]];
    for(const f of faces(a))panel(m,f,0,y+h/2,f.w,h,0,col);
    roof(m,{p:a},y+h,col);
  }
  function dial(m,lights,f,y,r){
    const center=f.at(0,y,.11);
    for(let j=0;j<20;j++){
      const a=j*Math.PI/10,b=(j+1)*Math.PI/10;
      m?.tri(center,f.at(r*Math.cos(a),y+r*Math.sin(a),.11),f.at(r*Math.cos(b),y+r*Math.sin(b),.11),'#e8ddba');
    }
    for(const [x,h,wd,ht] of [[0,r*.30,.12,r*.60],[r*.25,0,r*.50,.11]])panel(m,f,x,y+h,wd,ht,.14,'#384246');
    lights?.litPanel(f.at,0,y-r-.12,.15,r*1.7,.10,'#f6d797');
  }
  function tower(m,lights,x,z,base,w,h,kind){
    const p=[[x-w/2,z-w/2],[x+w/2,z-w/2],[x+w/2,z+w/2],[x-w/2,z+w/2]];
    box(m,x,z,base,w,w,h,kind==='clock'?'#b86951':'#e1cfaa');
    for(const [i,f] of faces(p).entries()){
      if(kind==='clock'&&i===2)continue;
      if(kind==='church')for(const u of [-.23,0,.23])panel(m,f,u*w,base+h*.57,w*.15,h*.23,.06,'#65625a');
      dial(m,lights,f,base+h*.82,w*.24);
      panel(m,f,0,base+h-.23,w+.25,.47,.12,'#d2c3a6');
      if(kind==='church')m?.tri(f.at(-w*.53,base+h,0),f.at(w*.53,base+h,0),[x,base+h+w*.66,z],'#865e4f');
    }
  }
  function arched(m,f,u,y,w,h,col){
    panel(m,f,u,y+h*.40,w,h*.8,.075,col);
    for(let k=0;k<10;k++){
      const a=k*Math.PI/10,c=(k+1)*Math.PI/10;
      m?.tri(f.at(u,y+h*.8,.075),f.at(u+Math.cos(a)*w/2,y+h*.8+Math.sin(a)*h*.2,.075),f.at(u+Math.cos(c)*w/2,y+h*.8+Math.sin(c)*h*.2,.075),col);
    }
  }
  function draw(b,m,lights,signs){
    const [kind,ids,zh,en,target,wall,glass]=byId.get(b.id),base=b.basePD,top=b.top,h=top-base;
    const fs=faces(b.p);if(!fs.length)return;
    const widest=Math.max(...fs.map(f=>f.w));
    const front=fs.filter(f=>f.w>=Math.min(9,widest*.76)).sort((a,c)=>{
      const cost=f=>{const [x,,z]=f.at(0,0,0);return Math.hypot(x-target[0],z-target[1])-.18*Math.min(40,f.w)};
      return cost(a)-cost(c);
    })[0];
    const historical=['church','tao','villa','mansion','temple','clock','house'].includes(kind);
    const slopes=window.HKTongRoofs?.[b.id],rise=slopes?Math.min(kind==='church'?4.1:1.9,h*.23):0;
    const cap=top-rise,litColor=kind==='hospital'?'#deeee5':kind==='mall'?'#cfedf0':historical?'#e9c995':'#dfdfc7';
    const crystalRim=(x,z)=>{
      const u=(x+151)/54,v=(z+4882)/32;
      return [-151+(x+151)*.95+1.7*v,top-2.3-4.2*Math.abs(u-.32*v),-4882+(z+4882)*.88-1.3*u];
    };
    for(const f of fs){
      if(kind!=='crystal')panel(m,f,0,(base+cap)/2-1,f.w,cap-base+2,0,wall);
      const floors=Math.max(1,Math.round((cap-base)/(kind==='mall'?5.0:historical?4.6:3.5))),fh=(cap-base)/floors;
      const n=Math.max(1,Math.floor(f.w/(kind==='mall'?5.3:historical?4.1:3.4))),bay=f.w/n;
      if(kind==='crystal'){
        // The roof and the tilted upper faces meet on the same creased rim.
        const finish=(u,t)=>{
          const [x,,z]=f.at(u,0,0),lip=crystalRim(x,z);
          return [x+(lip[0]-x)*t,base-1+(lip[1]-base+1)*t,z+(lip[2]-z)*t];
        };
        const a=finish(-f.w/2,0),b=finish(f.w/2,0),c=finish(f.w/2,1),l=finish(-f.w/2,1);
        m?.tri(a,b,c,'#bdc3c4');m?.tri(a,c,l,'#e1e4e1');
        const slit=(u,t,offset=.09)=>{const q=finish(u,t),e=f.at(0,0,offset),o=f.at(0,0,0);return [q[0]+e[0]-o[0],q[1],q[2]+e[2]-o[2]]};
        m?.quad(slit(-f.w*.49,.13),slit(f.w*.42,.66),slit(f.w*.48,.78),slit(-f.w*.44,.28),glass);
        if(f.w>8&&lights){
          const panes=Math.max(2,Math.round(f.w/4.5));
          for(let j=0;j<panes;j++){
            if(j%4===2)continue;
            const left=.06+.88*j/panes,right=left+.58/panes;
            const pane=(t,v)=>slit((t-.5)*f.w,.21+t*.54+v,.19);
            lights.litQuad(pane(left,0),pane(right,0),pane(right,.028),pane(left,.028),'#afc5c3');
          }
        }
        continue;
      }
      for(let k=0;k<floors;k++){
        const y=base+(k+.53)*fh;
        if(['hospital','education','mall','university','franki','broadcast'].includes(kind)){
          panel(m,f,0,y,f.w*.97,fh*(kind==='mall'?.68:.45),.042,glass);
          panel(m,f,0,y-fh*.32,f.w,kind==='education'?.48:.25,.12,kind==='hospital'?'#94aaa0':wall);
        }
        for(let j=0;j<n;j++){
          const u=(j+.5-n/2)*bay;
          if(kind==='church'||kind==='tao'){
            if(k===0&&f.w>3)arched(m,f,u,base+1.7,bay*.46,Math.min(h*.47,7),glass);
          }else if(!historical&&['mall','university','hospital','education','broadcast','franki'].includes(kind)){
            panel(m,f,u-bay*.46,y,.19,fh*.72,.085,wall);
          }else{
            panel(m,f,u,y,bay*(kind==='temple'?.38:.61),fh*(kind==='temple'?.77:.54),.055,glass);
          }
          if((j+2*k+b.id)%4===0&&(kind!=='church'&&kind!=='tao'||!k))lights?.litPanel(f.at,u,y,.12,bay*.32,fh*.30,litColor);
        }
      }
      if(kind==='temple'&&f.w>5){
        // Continuous art-glass bays set between the pale stone piers.
        const bays=Math.max(1,Math.round(f.w/3.5)),step=f.w/bays;
        for(let j=0;j<bays;j++){
          const u=(j+.5-bays/2)*step,y=base+h*.56,wh=h*.64;
          panel(m,f,u,y,step*.51,wh,.14,'#8b9a97');
          panel(m,f,u,y,step*.36,wh-.58,.17,'#9aafb0');
          for(let k=1;k<5;k++)panel(m,f,u,y+wh*(k/5-.5),step*.49,.19,.20,wall);
          lights?.litPanel(f.at,u,y,.22,step*.16,wh-.8,'#bfcebe');
        }
      }
      if(kind==='mansion'&&f.w>7){
        const bays=Math.max(2,Math.floor(f.w/5.5)),step=f.w/bays;
        for(let j=0;j<bays;j++){
          const u=(j+.5-bays/2)*step;
          for(let k=0;k<8;k++){
            const arc=(i,d)=>f.at(u+Math.cos(i*Math.PI/8)*step*.38,base+3.35+Math.sin(i*Math.PI/8)*.83,d);
            m?.quad(arc(k,.08),arc(k+1,.08),arc(k+1,.95),arc(k,.95),'#d7ddd0');
          }
        }
      }
      if(kind==='house'&&f.w>7){
        panel(m,f,0,base+.68,f.w,1.36,.09,'#b9b3a1');
        if(f===front){const y=base+Math.min(3.3,h*.57);panel(m,f,0,y,f.w*.5,.26,.36,'#dedaca');
          for(const k of [-1,1])panel(m,f,k*f.w*.21,(base+y)/2,.24,y-base,.35,wall);}
      }
      if(kind==='chapel'&&f.w>9){
        const y=base+h*.71;
        panel(m,f,0,y,.35,3.5,.16,'#e2d1b4');panel(m,f,0,y+.65,1.9,.32,.17,'#e2d1b4');
        lights?.litPanel(f.at,0,y,.18,.14,2.4,'#f4d596');
      }
      if(f.w>3){
        panel(m,f,0,cap-.27,f.w,.48,.10,kind==='tao'?'#4d796b':kind==='mansion'?'#739772':wall);
        if(kind==='mall'||kind==='temple'||kind==='clock')lights?.litPanel(f.at,0,cap-.45,.15,f.w*.90,.13,litColor);
      }
    }
    if(slopes&&m){
      for(const tri of slopes)m.tri(...tri.map(([x,z,t])=>[x,cap+rise*t,z]),kind==='church'?'#99705b':kind==='tao'?'#496e62':'#788474');
    }else if(kind==='crystal'&&m){
      const contours=b.p.map(([x,z])=>new THREE.Vector2(x,z)),holes=(b.holes||[]).map(r=>r.map(([x,z])=>new THREE.Vector2(x,z))),v=[contours,...holes].flat();
      for(const tri of THREE.ShapeUtils.triangulateShape(contours,holes))m.tri(...tri.map(i=>crystalRim(v[i].x,v[i].y)),'#cdd3d4');
    }else roof(m,b,top,kind==='mall'?'#aab4b1':historical?wall:'#b5b6ad');
    for(const ring of b.holes||[])for(const f of faces(ring))panel(m,f,0,base+h/2,f.w,h,0,wall);
    if(b.id===138247&&m){
      // A low white cupola above the main green wing on Durham Road.
      const point=(i,j)=>{
        const angle=i*Math.PI/8,lat=j*Math.PI/10,r=2.25*Math.cos(lat);
        return [953+r*Math.cos(angle),top+.1+2.05*Math.sin(lat),-4064+r*Math.sin(angle)];
      };
      for(let j=0;j<5;j++)for(let i=0;i<16;i++)m.quad(point(i,j),point(i+1,j),point(i+1,j+1),point(i,j+1),'#e1dfd2');
    }
    if(b.id===2104093){
      // Long roof lantern over the Festival Walk atrium.
      const station=(u,v,y)=>[478.4+.704*u-.710*v,y,-4569.5+.710*u+.704*v];
      for(let j=-15;j<15;j++){
        const a=j*4,c=a+3.84;
        m?.quad(station(a,-12,top+.13),station(c,-12,top+.13),station(c,0,top+2.9),station(a,0,top+2.9),'#7a999d');
        m?.quad(station(a,0,top+2.9),station(c,0,top+2.9),station(c,12,top+.13),station(a,12,top+.13),'#a6babc');
        if(j%3===0)lights?.litQuad(station(a,-11.8,top+.28),station(a+.32,-11.8,top+.28),station(a+.32,0,top+3.01),station(a,0,top+3.01),'#aec9c8');
      }
    }
    if(kind==='university'){
      const band=base+h*.48;
      panel(m,front,0,band,front.w*.88,2.25,.17,'#e9e5d8');
      const w=Math.min(5,front.w*.16);
      panel(m,front,-front.w*.32,band,w,1.7,.19,'#a54241');
      lights?.litPanel(front.at,0,band-.99,.22,front.w*.70,.11,litColor);
    }
    if(kind==='temple'){box(m,756,-4915,top-.02,7,6,1.7,wall);box(m,756,-4915,top+1.65,4,3.6,.65,'#c9c7b9');}
    if(kind==='church')tower(m,lights,838,-3331,base,5.3,24,'church');
    if(kind==='clock')tower(m,lights,751,-2805,base,5.2,21,'clock');
    if(kind==='villa'||kind==='mansion'||kind==='tao'){
      const width=Math.min(10,front.w*.70);
      const y=base+Math.min(4.1,h*.57);
      m?.quad(front.at(-width/2,y,0),front.at(width/2,y,0),front.at(width/2,y,.95),front.at(-width/2,y,.95),wall);
      for(const sign of [-1,1])panel(m,front,sign*width*.43,(base+y)/2,.32,y-base,.76,kind==='tao'?'#8e4a42':wall);
    }
    if(ids[0]===b.id&&zh&&front.w>3){
      const y=base+Math.min(h*.62,historical?3.8:5.1),w=Math.min(historical?8:17,front.w*.84);
      if(signs)badge(front,signs,y,.21,w,Math.min(1.35,w*.16),[zh,en,kind==='hospital'?'#286458':historical?'#66523d':'#375261']);
      lights?.litPanel(front.at,0,y+.73,.22,w*.92,.10,litColor);
    }
  }
  function render(b,g,signs){const m=shell(b.n||byId.get(b.id)[2],g);draw(b,m,null,signs);m.finish();}
  return {replaces,building(b,props,signs,height,g){if(replaces(b)){render(b,g,signs);draw(b,null,props);}},
    distant(b,batch,g){if(!replaces(b))return false;render(b,g);return true;},
    lights(b,fixtures){if(replaces(b))draw(b,null,fixtures);}};
})();
