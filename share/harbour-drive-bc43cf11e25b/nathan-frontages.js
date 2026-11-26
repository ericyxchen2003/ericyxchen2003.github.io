/* Nathan Road shopfronts. Each doorway and display recess belongs to one
   exposed survey wall; both traffic directions see the outward sign faces. */
window.HKFrontages=(()=>{
  'use strict';
  const trades={
    tailor:['洋服訂造','BESPOKE TAILOR','#183b36','#ece0bb','洋服'],
    fashion:['時裝','FASHION','#6d504f','#fff1dd','時裝'],
    shoes:['鞋履','FOOTWEAR','#364b55','#f6eee0','鞋履'],
    jewels:['珠寶金行','FINE JEWELLERY','#702c32','#f1d391','珠寶'],
    watch:['鐘錶行','TIMEPIECES','#233740','#e9d5a8','鐘錶'],
    optics:['眼鏡','OPTICAL','#285a67','#f1f0d8','眼鏡'],
    beauty:['美妝','COSMETICS','#925764','#ffefe5','美妝'],
    pharmacy:['中西藥房','DISPENSARY','#eee7cf','#984538','藥房'],
    market:['便利商店','PROVISIONS','#2e6652','#f9e9c2','便利'],
    bakery:['餅家','BAKERY','#b27546','#fff1cf','餅家'],
    exchange:['找換','MONEY EXCHANGE','#eeb84c','#282d2b','找換'],
    tech:['影音數碼','CAMERA & AUDIO','#44515a','#f1eedf','影音'],
    cafe:['茶餐廳','HONG KONG CAFE','#8a4939','#fee5ad','冰室'],
    bank:['銀行服務','BANKING','#554f49','#f5f0de','銀行'],
    lobby:['商場入口','SHOPPING ARCADE','#544c41','#ead9b7','商場']
  };
  const enNames={245968:'MIRADOR MANSION',237846:'MIRADOR MANSION',224797:"CHUANG’S LONDON PLAZA",233562:'MIRA PLACE',291382:'MIRA PLACE',61610:"PARK LANE",123606:"PARK LANE",148473:"PARK LANE"};
  // Illustrative independent tenants. Mapped POIs inform the trade only.
  const shopNames={
    tailor:[['春和洋服','CHUN WO TAILOR'],['雅裁洋服','ELEGANT TAILOR']],
    fashion:[['素裳','THREAD & LINE'],['麗都時裝','LIDO FASHION']],
    shoes:[['步履鞋坊','FOOTWORK'],['皮匠鞋業','LEATHER SHOES']],
    jewels:[['瑞彩堂珠寶','SUI CHOI JEWELLERY'],['金玉軒','GOLD & JADE']],
    watch:[['瑞光鐘錶','SUI KWONG WATCH'],['時正錶行','TIME HOUSE']],
    optics:[['明窗眼鏡','MING CHEUNG OPTICAL'],['晶明眼鏡','CRYSTAL OPTICAL']],
    beauty:[['花研','FLEUR BEAUTY'],['妍彩','COLOUR STUDIO']],
    pharmacy:[['安康西藥房','ON HONG DISPENSARY'],['永宜藥房','WING YEE PHARMACY']],
    market:[['街坊辦館','DAILY PROVISIONS'],['合記士多','HOP KEE STORE']],
    bakery:[['金穗餅家','GOLDEN WHEAT'],['香麥西餅','HEUNG MAK BAKERY']],
    exchange:[['匯通找換','WUI TUNG EXCHANGE'],['金港找換','KAM KONG EXCHANGE']],
    tech:[['光影音響','LIGHT & SOUND'],['星匯數碼','STAR DIGITAL']],
    cafe:[['南風冰室','NAM FUNG CAFE'],['樂園茶餐廳','LOK YUEN CAFE']],
    bank:[['理財中心','FINANCIAL SERVICES'],['銀行服務','BANKING']]
  };
  const inks={tailor:['#2e443e','#324858'],jewels:['#672c30','#473641'],watch:['#273d53','#533e34'],
    cafe:['#315147','#823c32'],pharmacy:['#e7dfca','#efe7d0'],exchange:['#f0c56c','#ecd8a3'],
    optics:['#324e67','#456562'],bakery:['#916045','#764a45'],tech:['#424f62','#3e5957']};
  const lerp=(a,b,t)=>a+(b-a)*t;
  // The arcade opens on the street below Kowloon Park. Blend only the
  // intervening forecourt into the surveyed kerb, leaving the rooftop park above.
  function arcadeTerrain(base){
    const clamp=t=>Math.max(0,Math.min(1,t)),smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
    const strips=HK_NATHAN.promenades.map(({n,rows,roof})=>{
      const [x,z]=rows[0],last=rows.at(-1),length=Math.hypot(last[0]-x,last[1]-z);
      const profiles=rows.map(([x,z,w])=>{
        const kerb=base(x+n[0]*w,z+n[1]*w);
        return [w,kerb,Math.min(roof-3.98,kerb+.13)];
      });
      return {x,z,n,length,tx:(last[0]-x)/length,tz:(last[1]-z)/length,profiles};
    });
    const bounds=strips.map(s=>[s.x,s.z,s.x+s.tx*s.length,s.z+s.tz*s.length]);
    const xmin=Math.min(...bounds.flatMap(v=>[v[0],v[2]]))-23,xmax=Math.max(...bounds.flatMap(v=>[v[0],v[2]]))+23;
    const zmin=Math.min(...bounds.flatMap(v=>[v[1],v[3]]))-23,zmax=Math.max(...bounds.flatMap(v=>[v[1],v[3]]))+23;
    return (x,z)=>{
      const original=base(x,z);
      if(x<xmin||x>xmax||z<zmin||z>zmax)return original;
      for(const s of strips){
        const dx=x-s.x,dz=z-s.z,u=dx*s.tx+dz*s.tz,d=dx*s.n[0]+dz*s.n[1];
        if(u<=-2||u>=s.length+2||d<=-5)continue;
        const idx=clamp(u/s.length)*(s.profiles.length-1),i=Math.min(s.profiles.length-2,Math.floor(idx));
        const a=s.profiles[i],b=s.profiles[i+1],t=idx-i,width=lerp(a[0],b[0],t);
        if(d>=width)continue;
        const kerb=lerp(a[1],b[1],t),floor=lerp(a[2],b[2],t);
        const blend=smooth((d+5)/2.7)*smooth((width-d)/1.8)*smooth((u+2)/2)*smooth((s.length+2-u)/2);
        return lerp(original,lerp(floor,kerb,clamp(d/width)),blend);
      }
      return original;
    };
  }
  function paintPavement(c){
    c.save();
    for(const {n,rows} of HK_NATHAN.promenades){
      const point=(r,d)=>[r[0]+n[0]*d,r[1]+n[1]*d];
      c.save();c.beginPath();c.moveTo(...point(rows[0],-1.8));
      c.lineTo(...point(rows.at(-1),-1.8));
      for(const r of rows.slice().reverse())c.lineTo(...point(r,r[2]+1));
      c.closePath();c.clip();c.fillStyle='#c6b9a7';c.fill();
      for(let i=0;i<rows.length;i++){
        const r=rows[i];c.beginPath();c.moveTo(...point(r,-1.8));c.lineTo(...point(r,r[2]+1));
        c.lineWidth=i%4===0?.36:.088;c.strokeStyle=i%4===0?'#a19485':'#baad9a';c.stroke();
      }
      for(const d of [1.2,2.1,4.5,6.9,9.3,11.7,14.1]){
        c.beginPath();c.moveTo(...point(rows[0],d));c.lineTo(...point(rows.at(-1),d));
        c.lineWidth=d===2.1?.28:.1;c.strokeStyle='#a99b8b';c.stroke();
      }
      c.restore();
    }
    c.restore();
  }
  function context(map,height){
    const data=window.HK_NATHAN;
    const bays=data.bays.map((b,index)=>{
      const building=map.buildings[b.b],floor=height(b.x,b.z);
      const roof=building.top??floor+building.h;
      const heightM=Math.min(roof-floor-.16,(b.theme==='mall'?4.65:b.theme==='park'?3.75:3.92)+(b.seed%6)*.075);
      return {...b,index,building,floor,roof,height:heightM};
    });
    const cuts=new Map(),owners=new Set();
    for(const [key,spans] of Object.entries(data.cuts)){
      const [i,j]=key.split('/').map(Number),building=map.buildings[i];
      const live=spans.filter(s=>bays[s[2]].height>=2.70);
      if(!live.length)continue;
      if(!cuts.has(building))cuts.set(building,new Map());
      cuts.get(building).set(j,live);
      owners.add(building.id);
    }
    return {bays:bays.filter(b=>b.height>=2.70),owners,cuts,head:i=>bays[i].floor+bays[i].height};
  }

  let interiors;
  function interiorAtlas(){
    if(interiors)return interiors;
    const w=384,h=256,cells=[...Object.keys(trades),'books','seafood'],canvas=document.createElement('canvas');
    canvas.width=2048;canvas.height=2048;
    const c=canvas.getContext('2d'),uv={};
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
    // Deep shop elevations with stocked shelves, lit merchandise and a
    // perspective floor. They sit behind separate counters, windows and doors.
    function paint(kind,variant){
      let seed=2141+cells.indexOf(kind)*499+variant*719;
      const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
      const rect=(x,y,a,b,fill)=>{c.fillStyle=fill;c.fillRect(x,y,a,b);};
      const line=(x,y,xx,yy,col,weight=2)=>{c.strokeStyle=col;c.lineWidth=weight;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();};
      const poly=(p,col)=>{c.fillStyle=col;c.beginPath();c.moveTo(...p[0]);for(const q of p.slice(1))c.lineTo(...q);c.closePath();c.fill();};
      const oval=(x,y,rx,ry,col,stroke=false)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(stroke){c.strokeStyle=col;c.lineWidth=2.7;c.stroke();}else{c.fillStyle=col;c.fill();}};
      const text=(s,x,y,size,col)=>{c.font='600 '+size+'px Arial,"PingFang HK",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle=col;c.fillText(s,x,y);};
      const ritzy=['watch','jewels','optics','bank','lobby'].includes(kind), warm=ritzy||['cafe','bakery','tailor'].includes(kind);
      const back=warm?'#baa58a':'#b7c2b9',side=warm?'#826b55':'#738282';
      let grad=c.createLinearGradient(0,0,0,h);grad.addColorStop(0,warm?'#796a56':'#6e7777');grad.addColorStop(.5,back);grad.addColorStop(1,'#4c4b41');
      rect(0,0,w,h,grad);
      poly([[0,0],[54,35],[54,197],[0,242]],side);poly([[w,0],[340,35],[340,198],[w,241]],side);
      poly([[0,0],[w,0],[340,38],[54,38]],warm?'#6c6252':'#778482');
      poly([[0,h],[0,240],[54,195],[340,195],[w,240],[w,h]],warm?'#a69277':'#a1aaa2');
      for(let x=-170;x<600;x+=82)line(195+(x-195)*.47,197,x,256,'#8c8979',1);
      for(const y of [204,224,246])line(0,y,w,y,'#8e8e7c',1);
      for(let i=0;i<5;i++){
        const x=30+i*79;rect(x,12,29,3,'#fff0c7');rect(x+4,16,22,2,'#dfc695');
      }
      const palette=['#d5ab61','#e9d8b0','#80926f','#9e4b49','#dba988','#536a6b','#c0c3a1','#947650'];
      function shelf(x,y,width){rect(x,y,width,5,'#d5c6a9');rect(x,y+5,width,3,'#645b51');}
      if(['market','pharmacy','beauty','tech'].includes(kind)){
        for(let k=0;k<3;k++){
          const x=45+k*99;rect(x,50,90,139,'#53635f');rect(x+3,50,83,139,kind==='beauty'?'#c3a598':'#a3a995');
          for(let r=0;r<3;r++){
            const y=86+r*41;
            for(let j=0;j<(kind==='tech'?4:8);j++){
              const xx=x+5+j*(kind==='tech'?20:10),hh=(kind==='tech'?19:11)+rand()*15;
              const col=palette[(k+r*3+Math.floor(j/2)+variant)%palette.length];
              if(kind==='tech'){
                rect(xx,y-hh,15,hh,'#333b41');rect(xx+2,y-hh+2,11,hh-5,j%2?'#9cbcbb':'#738c9b');
              }else{
                rect(xx,y-hh,7+rand()*2,hh,col);rect(xx+1,y-hh+hh*.42,6,4,'#f3e4ca');
                if(kind==='beauty'||j%3===1)rect(xx+1,y-hh-3,5,3,kind==='beauty'?'#8d6161':'#d2b181');
              }
            }shelf(x+2,y,87);
          }
        }
      }else if(kind==='tailor'||kind==='fashion'){
        for(let i=0;i<11;i++){
          const x=48+i*27,y=64+rand()*5,col=palette[(i*3+variant)%8];
          line(x,50,x,60,'#887560');line(x,59,x-9,65,'#dac7a4');
          poly([[x-7,y],[x,y+4],[x+7,y],[x+15,y+8],[x+12,y+25],[x+8,y+22],[x+9,y+66],[x-10,y+66],[x-8,y+22],[x-14,y+26],[x-17,y+13]],col);
          line(x,y+8,x+1,y+60,'#ffffff40',1);
        }
        rect(40,48,302,3,'#c0aa84');shelf(53,182,270);
        for(let j=0;j<14;j++){
          const x=57+j*18,hh=20+rand()*22;
          rect(x,180-hh,14,hh,palette[(j+variant)%8]);oval(x+7,180-hh,7,3,'#d5c0a4');oval(x+7,180-hh,2,1,'#584b43');
        }
      }else if(kind==='jewels'||kind==='watch'||kind==='optics'||kind==='shoes'){
        for(let i=0;i<3;i++){
          const x=45+i*101;rect(x,52,90,141,ritzy?'#4b4941':'#68706b');
          const g=c.createRadialGradient(x+45,64,3,x+45,104,87);g.addColorStop(0,'#e6c99a');g.addColorStop(1,ritzy?'#75654f':'#91978a');rect(x+4,56,82,132,g);
          rect(x+34,57,21,3,'#fff2cf');
          if(kind==='jewels'){
            const cx=x+45;poly([[cx-9,86],[cx+9,86],[cx+12,99],[cx+28,108],[cx+20,147],[cx-21,147],[cx-27,108],[cx-12,99]],i%2?'#464744':'#e8d8b8');
            c.beginPath();c.moveTo(cx-15,102);c.quadraticCurveTo(cx,139,cx+15,102);c.strokeStyle='#e2b85f';c.lineWidth=2.5;c.stroke();oval(cx,120,3.1,4.3,'#fff0ce');
          }else if(kind==='watch'){
            for(let k=0;k<2;k++){const xx=x+28+k*34;rect(xx-5,103,10,43,'#604f3e');oval(xx,124,10,11,'#d4b16b');oval(xx,124,7.6,8.5,k?'#e4dbc6':'#394243');line(xx,124,xx-3,119,'#a98752',1.5);line(xx,124,xx+5,123,'#a98752',1.5);}
          }else if(kind==='optics'){
            for(let j=0;j<3;j++){const yy=84+j*26;oval(x+33,yy,11,6,'#363c3d',true);oval(x+58,yy,11,6,'#363c3d',true);line(x+44,yy,x+47,yy,'#363c3d');}
          }else{
            for(let j=0;j<3;j++){const yy=86+j*29;poly([[x+15,yy],[x+26,yy-10],[x+34,yy-7],[x+48,yy-2],[x+66,yy+2],[x+67,yy+7],[x+13,yy+7]],palette[(i+j+variant)%8]);shelf(x+9,yy+8,69);}
          }
          shelf(x+9,151,71);rect(x+32,161,24,7,'#e6d7bb');
        }
      }else if(kind==='bakery'||kind==='cafe'){
        rect(47,49,284,142,'#746451');
        for(let i=0;i<4;i++){
          const x=50+i*70;rect(x,53,64,33,i%2?'#e5c18e':'#deccb2');
          oval(x+18,69,12,8,'#f2e2c2');oval(x+18,69,8,5,i%2?'#a75c3d':'#d18f45');
          for(let j=0;j<3;j++)rect(x+36,61+j*6,21-j*2,2,'#857058');
        }
        if(kind==='bakery'){
          for(let j=0;j<3;j++){const y=111+j*32;shelf(48,y+9,282);for(let i=0;i<12;i++){
            const x=59+i*23.2;oval(x,y+4,9,6,['#d8a159','#bb7b42','#e6bb70'][(i+j)%3]);line(x-3,y+1,x,y-1,'#f0d59a',1.5);
          }}
        }else{
          for(let j=0;j<3;j++){const x=72+j*92;rect(x-8,128,38,36,'#98644e');rect(x-13,151,50,9,'#714f40');oval(x+30,143,24,5,'#e1cfac');rect(x+27,147,4,35,'#665d4c');rect(x+20,135,7,7,'#f2dfbf');rect(x+37,130,3,10,'#ad5241');}
        }
      }else if(kind==='books'){
        rect(42,45,300,151,'#795c47');
        for(let row=0;row<3;row++){
          const base=94+row*46;
          for(let x=49;x<328;){
            const thick=5+rand()*9,hh=22+rand()*16;
            rect(x,base-hh,thick,hh,palette[Math.floor(rand()*palette.length)]);
            rect(x+1,base-hh+5,thick-2,2,'#f1deba');x+=thick+2;
          }
          shelf(43,base,298);
        }
      }else if(kind==='seafood'){
        rect(44,47,297,144,'#92603e');
        for(let row=0;row<2;row++)for(let i=0;i<7;i++){
          const x=64+i*42,y=90+row*63;
          rect(x-14,y-28,28,44,'#c5ac83');rect(x-12,y-15,24,30,'#af7145');
          for(let j=0;j<17;j++)oval(x-10+rand()*20,y-11+rand()*23,2+rand()*2,1.7,'#e0b477');
          rect(x-15,y-29,30,5,'#6c4e3a');rect(x-8,y-9,16,8,'#ead5a5');shelf(x-19,y+17,41);
        }
      }else if(kind==='exchange'||kind==='bank'){
        rect(48,53,167,111,'#263e39');text(kind==='exchange'?'CURRENCY   BUY   SELL':'CUSTOMER SERVICES',131,65,12,'#f2dc98');
        for(let i=0;i<5;i++){rect(51,76+i*16,160,1,'#59716a');text(['HKD','USD','JPY','EUR','GBP'][i],74,84+i*16,10,'#d5d8bb');for(let j=0;j<2;j++)for(let n=0;n<5;n++)rect(117+j*47+n*4,81+i*16,2,4,'#d8c575');}
        rect(228,58,99,103,'#9da59a');rect(235,69,86,64,'#54665e');oval(284,106,11,15,'#b89779');poly([[260,141],[262,126],[276,116],[294,117],[306,127],[307,141]],'#67695d');
        rect(47,150,284,8,'#d6c6a8');rect(47,158,284,30,'#9e8b6c');
      }else{
        for(let i=0;i<2;i++){const x=69+i*99;rect(x,51,72,139,'#594e41');rect(x+4,55,64,131,'#baa68c');line(x+36,55,x+36,187,'#786e5e',2);rect(x+20,45,32,5,'#e3c892');}
        rect(272,70,50,73,'#4d5954');for(let i=0;i<7;i++)rect(278,77+i*9,29+i%3*3,2,'#ded1ad');
      }
      // Weak glazing reflections keep the wares readable at driving distance.
      poly([[8,0],[40,0],[166,h],[133,h]],'#e0f1ed11');poly([[53,0],[64,0],[190,h],[180,h]],'#e0f1ed0c');
      grad=c.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#1d282a50');grad.addColorStop(.36,'#1d282a00');grad.addColorStop(1,'#1b28283a');rect(0,0,w,h,grad);
    }
    cells.forEach((kind,k)=>{for(let v=0;v<2;v++){const i=k*2+v,x=i%5*400+4,y=Math.floor(i/5)*280+4;
      c.save();c.translate(x,y);c.beginPath();c.rect(0,0,w,h);c.clip();paint(kind,v);c.restore();
      uv[kind+v]=[(x+1)/2048,1-(y+h-1)/2048,(x+w-1)/2048,1-(y+1)/2048];
    }});
    return interiors={uv,material:new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,toneMapped:false})};
  }

  function draw(plan,scene,height,{tileBins,flatBatch,color},interiors){
    const group=new THREE.Group();group.name='彌敦道地舖';scene.add(group);
    const bins=tileBins(115),shutters=tileBins(115),letters=new Map(),tints=new Map();
    const tint=s=>{if(!tints.has(s))tints.set(s,color(s));return tints.get(s);};
    const white=tint('#ffffff'),records=[];
    for(const b of plan.bays){
      const {nx,nz,w,trade,seed}=b,tx=nz,tz=-nx,H=b.height,lo=-w/2,hi=w/2;
      const classic=b.theme==='street'||b.theme==='arcade',quiet=!classic,lobby=trade==='lobby';
      const tier=Math.floor(seed/13)%3,shop=trades[trade];
      const id=b.building.id;
      const variation=Math.floor(seed/97)%3,identity=!lobby&&variation?shopNames[trade][variation-1]:shop;
      const zh=lobby?(b.theme==='park'?'栢麗購物大道':id===233562?'美麗華廣場':b.building.n||'大廈入口'):identity[0];
      const en=lobby?(enNames[id]||b.building.en||'BUILDING ENTRANCE'):identity[1];
      const ink=shop[3],bg=quiet&&!lobby?['#394644','#544b4d','#514b42'][tier]:inks[trade]?.[seed%2]||shop[2];
      const frame=classic?['#87918d','#b2a287','#666e69'][tier]:['#b4a88e','#80908e','#a6a498'][tier];
      const trim=classic?['#c4b990','#e1d5b9','#b8cacc'][tier]:'#d0c5ad';
      const back='#474943',floor=classic?'#9c9484':'#b9b3a3',border=quiet?'#a79c88':'#82908a';
      const face=H-(quiet?.82:.91),entryHigh=Math.min(2.61,face-.14);
      const at=(u,y,d)=>[b.x+tx*u+nx*d,b.floor+y,b.z+tz*u+nz*d];
      const grounded=(u,d)=>{const p=at(u,0,d);p[1]=height(p[0],p[2])+.025;return p;};
      const solid=bins.get(b.x,b.z,0),images=bins.get(b.x,b.z,1);
      const labelCell=Math.floor(b.z/145);
      if(!letters.has(labelCell))letters.set(labelCell,HKDetails.signBatch());
      const signs=letters.get(labelCell),hours=HKShopLights.hours(b.x,b.z);
      const quad=(a,e,f,g,c)=>solid.quad(a,e,f,g,tint(c));
      const front=(l,r,y0,y1,d)=>[at(l,y0,d),at(r,y0,d),at(r,y1,d),at(l,y1,d)];
      if(!lobby){
        const sheet=shutters.get(b.x,b.z,0);
        sheet.quad(...front(lo+.10,hi-.10,-.16,face,.15),white);sheet.shopHours(hours);
      }
      function box(l,r,y0,y1,deep,out,col){
        quad(...front(l,r,y0,y1,out),col);
        quad(at(l,y0,deep),at(l,y0,out),at(l,y1,out),at(l,y1,deep),col);
        quad(at(r,y0,out),at(r,y0,deep),at(r,y1,deep),at(r,y1,out),col);
        quad(at(l,y1,out),at(r,y1,out),at(r,y1,deep),at(l,y1,deep),col);
        quad(at(l,y0,deep),at(r,y0,deep),at(r,y0,out),at(l,y0,out),col);
        quad(at(r,y0,deep),at(l,y0,deep),at(l,y1,deep),at(r,y1,deep),col);
      }
      // Shop recess. The rear wall and both returns enclose the removed part
      // of the survey shell. The threshold meets the terrain at each jamb.
      const deep=lobby?-1.56:-1.08;
      quad(at(lo,-.33,deep),at(hi,-.33,deep),at(hi,H+.02,deep),at(lo,H+.02,deep),back);
      for(const u of [lo,hi])quad(at(u,-.33,.06),at(u,-.33,deep),at(u,H+.02,deep),at(u,H+.02,.06),border);
      quad(at(lo,H,.10),at(hi,H,.10),at(hi,H,deep),at(lo,H,deep),'#c7c3ac');
      quad(grounded(lo,.09),grounded(hi,.09),at(hi,.08,deep),at(lo,.08,deep),floor);
      for(const u of [lo,hi-.115])box(u,u+.115,-.25,H+.04,-.13,.12,frame);
      const doorW=lobby?Math.min(w*.64,3.05):Math.min(w*.36,1.36);
      const door=lobby?0:(seed%2?1:-1)*(w*.5-doorW*.5-.21);
      const e0=door-doorW/2,e1=door+doorW/2,dd=lobby?-.98:-.68;
      for(const [l,r] of [[lo+.105,e0-.07],[e1+.07,hi-.105]]){
        if(r-l<.28)continue;
        images.quad(...front(l,r,.11,face-.06,deep+.024),white,interiors.uv[(lobby?'lobby':trade)+(seed%2)]);images.shopHours(hours);
        const dh=['jewels','watch','optics'].includes(trade)?.54:.25;
        box(l,r,-.23,dh,-.54,.055,classic?'#726c5e':'#9e9786');
        box(l,r,dh,dh+.065,-.59,.08,trim);
        // Display-case glass edges, a sill and track lights in front of the
        // merchandise are at different depths when passing the window.
        box(l,r,.12,.18,-.13,.095,frame);
        if(r-l>2.6){const mid=lerp(l,r,.56);box(mid-.033,mid+.033,.18,face,-.10,.06,frame);}
        const lamps=Math.max(1,Math.floor((r-l)/1.15));
        for(let k=0;k<lamps;k++){const u=lerp(l,r,(k+.5)/lamps);box(u-.12,u+.12,face-.12,face-.075,-.46,-.23,'#f0dab0');}
        if(['jewels','watch','bakery','optics'].includes(trade)){
          for(let k=0;k<Math.max(2,Math.round((r-l)/.65));k++){
            const u=lerp(l,r,(k+.5)/Math.max(2,Math.round((r-l)/.65)));
            box(u-.11,u+.11,dh+.065,dh+.13,-.32,-.16,quiet?'#c2b295':'#b39973');
            box(u-.053,u+.053,dh+.13,dh+.18,-.26,-.19,'#d6bb83');
          }
        }
      }
      const doorBase=grounded(door,0)[1]-b.floor;
      images.quad(...front(e0,e1,doorBase+.05,entryHigh,lobby?deep+.04:dd-.12),white,interiors.uv[trade+(seed%2)]);images.shopHours(hours);
      box(e0,e1,doorBase-.07,doorBase+.11,dd-.02,dd+.05,frame);
      for(const side of [-1,1]){
        const u=door+side*doorW*.25;
        quad(at(u-doorW*.17,entryHigh-.12,dd),at(u-doorW*.10,entryHigh-.12,dd),
          at(u+doorW*.16,entryHigh*.58,dd),at(u+doorW*.13,entryHigh*.58,dd),'#a1aaa1');
      }
      for(const u of [e0+.045,e1-.045,door])box(u-.027,u+.027,doorBase+.03,entryHigh,dd,dd+.06,trim);
      for(const d of [-1,1])box(door+d*.088-.019,door+d*.088+.019,.88,1.53,dd+.04,dd+.12,'#ddc9a0');
      box(e0-.06,e1+.06,entryHigh-.085,entryHigh+.02,dd-.02,.045,frame);
      for(const u of [e0,e1])quad(at(u,doorBase,.045),at(u,doorBase,dd),at(u,entryHigh,dd),at(u,entryHigh,.045),border);
      if(face>entryHigh+.08){
        box(e0,e1,entryHigh+.02,face,dd-.03,dd+.02,'#687471');
        for(let j=1;j<4;j++){const sy=lerp(entryHigh,face,j/4);box(e0,e1,sy-.019,sy+.019,dd+.021,dd+.055,frame);}
      }
      // Blade-free Park Lane bays share a low continuous canopy. Older blocks
      // have independent fascias and a mixture of projecting and flush shopheads.
      const lip=b.theme==='park'?.78:classic?.37+(seed%4)*.07:.51;
      box(lo,hi,face-.015,H,-.08,.13,bg);
      box(lo,hi,H-.07,H+.035,-.12,lip,frame);
      box(lo+.025,hi-.025,face-.10,face,-.15,classic?.26:.42,trim);
      const fascia=HKDetails.shopBoard(zh,en,bg,quiet?'#f3e9cf':ink,w-.18,H-face-.115,trade,quiet);
      signs.quad(fascia,front(lo+.09,hi-.09,face+.02,H-.095,.139),hours);
      if(classic&&trade==='cafe'){
        const stripes=Math.max(7,Math.round(w/.28));
        for(let k=0;k<stripes;k++){
          const l=lerp(lo+.08,hi-.08,k/stripes),r=lerp(lo+.08,hi-.08,(k+1)/stripes);
          quad(at(l,face-.04,.16),at(r,face-.04,.16),at(r,face-.26,.67),at(l,face-.26,.67),k%2?'#d4c8ab':'#826450');
        }
      }
      let bladeInfo=null;
      if(b.blade){
        const vertical=seed%3===0||trade==='pharmacy';
        const h=vertical?2.15+(seed%5)*.15:.75+(seed%4)*.13;
        const base=Math.min(4.65+(seed%6)*.39,b.roof-b.floor-h-.23);
        if(base>4.15){
          const bx=(seed%2?1:-1)*Math.min(w*.24,1.42),d0=vertical?.30:.24;
          const d1=Math.min(b.blade,vertical?1.30:(tier===1?3.45:2.65)),th=.095;
          // Two anchors and diagonal braces connect both readable sign faces to the wall.
          for(const y of [base+.13,base+h-.13]){
            box(bx-.15,bx+.15,y-.15,y+.15,-.05,.11,'#555c56');
            box(bx-.055,bx+.055,y-.048,y+.048,.07,d1-.11,'#707973');
          }
          quad(at(bx,base+h+.13,.085),at(bx,base+h+.20,.085),at(bx,base+h-.08,d1-.18),at(bx,base+h-.12,d1-.18),'#66716a');
          box(bx-th,bx+th,base,base+h,d0,d1,border);
          const tag=HKDetails.shopBoard(zh,en,bg,ink,d1-d0-.06,h-.07,trade);
          for(const side of [-1,1]){
            const v=bx+side*(th+.008),l=side>0?d1-.03:d0+.03,r=side>0?d0+.03:d1-.03;
            const p=[at(v,base+.035,l),at(v,base+.035,r),at(v,base+h-.035,r),at(v,base+h-.035,l)];
            signs.quad(tag,p,hours);
          }
          bladeInfo=[at(bx,base,d0),at(bx,base+h,d1)];
        }
      }
      records.push({id,name:zh,x:b.x,z:b.z,w,theme:b.theme,blade:bladeInfo});
    }
    bins.build([flatBatch(),HKShopLights.material(interiors.material)],group,true);
    shutters.build([HKShopLights.shutter],group);
    for(const s of letters.values())s.finish(group);
    group.userData.bays=records;
  }
  return {context,draw,interiorAtlas,arcadeTerrain,paintPavement};
})();
