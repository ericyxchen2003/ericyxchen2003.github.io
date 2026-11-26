/* Original public streetscape elevations. X east, Z south, heights in mPD. */
window.HKYauPlaces=(()=>{
  'use strict';
  const market=window.HKTempleMarket;
  const wards=new Map([[337651,'A'],[337648,'B'],[337650,'C'],[337787,'D'],[337649,'E'],[337645,'F'],
    [337646,'G'],[337786,'H'],[337653,'J'],[337783,'K'],[337654,'L'],[88912,'M'],[70967,'P']]);
  const templeHalls=[70706,236926,234759,234753,235161];
  const heritageBlocks=[159291,163187,159290];
  const sites=[
    ['qeh','伊利沙伯醫院',[337651,...Array.from(wards.keys()).filter(id=>id!==337651),311454,311455,253654]],
    ['lands','土地審裁處',[90224]],['tinhau','油麻地天后廟建築群',[...templeHalls,70966,71516]],
    ['redbrick','油麻地抽水站宿舍（紅磚屋）',[70722]],['gunclub','槍會山軍營',heritageBlocks],
    ['wingon','永安九龍中心',[224286,299525]],['inspoint','現時點',[228485]]
  ];
  const walks=[['nightmarket','廟街夜市',market.gate[0],market.gate[1]]];
  function groundRect([x,z,dx,dz],w,d,u=0,v=0){
    return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>[x+(u+a*w/2)*dx-(v+b*d/2)*dz,z+(u+a*w/2)*dz+(v+b*d/2)*dx]);
  }
  const solids=market.stalls.map(st=>({p:groundRect(st,st[4],st[5]),h:2.5}));
  for(const s of [-1,1])solids.push({p:groundRect(market.gate,.77,.79,0,s*3.45),h:4.9});
  // Only displace procedural trees where an actual booth, gateway or lamp occupies the pavement.
  const clearPlanting=(x,z)=>(x>11&&x<64&&z>-1558&&z< -1512)||x>-45&&x<96&&z< -1035&&z> -1760&&(
    market.stalls.some(s=>Math.abs(s[0]-x)<2.4&&Math.abs(s[1]-z)<2.4)||
    Math.hypot(x-market.gate[0],z-market.gate[1])<4.5);
  function surveyFront(points,nx,nz){
    const n=Math.hypot(nx,nz);nx/=n;nz/=n;
    const ux=nz,uz=-nx,along=points.map(([x,z])=>x*ux+z*uz),depth=points.map(([x,z])=>x*nx+z*nz);
    const l=Math.min(...along),r=Math.max(...along),d=Math.max(...depth);
    return [ux*l+nx*d,uz*l+nz*d,ux,uz,r-l,d-Math.min(...depth)];
  }
  const directory=[449.4,-1372.4,-.969,.247];
  solids.push({p:groundRect(directory,3.6,.28),h:3.9});
  const courtFootprint=window.HKMAP.buildings.find(b=>b.id===90224);
  if(courtFootprint){
    const f=surveyFront(courtFootprint.p,-.646,.763);
    solids.push({p:groundRect(f,22.3,3.25,f[4]/2,3.12),h:2.5});
  }
  const templeFootprint=window.HKMAP.buildings.find(b=>b.id===234759);
  if(templeFootprint){
    const f=surveyFront(templeFootprint.p,-.9842,.177);
    for(const [u,w] of [[-4.65,16],[18.05,16]])solids.push({p:groundRect(f,w,.51,u,5.8),h:1.64});
    for(const [u,v] of [[-6.7,15.8],[17.2,11.8],[21,26],[-8,27.7]])solids.push({p:groundRect(f,.82,.82,u,v),h:3.9});
  }
  const materials=new Map();
  function wallMaterial(kind){
    if(materials.has(kind))return materials.get(kind);
    const cv=document.createElement('canvas');cv.width=512;cv.height=256;
    const c=cv.getContext('2d');
    const glazed=['curtain','care','office','ward'].includes(kind);
    const mask=glazed?cv.cloneNode():null,glow=mask?.getContext('2d');
    if(glow){glow.fillStyle='#000';glow.fillRect(0,0,512,256);}
    function fill(x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
    if(kind==='brick'||kind==='granite'||kind==='greybrick'){
      const colours=kind==='brick'?['#ad5e46','#b97254','#a95744','#bd7358','#b2614c']:
        kind==='granite'?['#b1aca0','#bbb4a6','#bcb6aa','#c1baae','#b7b2a6']:['#797d74','#85867c','#85887d','#777c73','#888b81'];
      fill(0,0,512,256,kind==='brick'?'#c49d81':'#a6a799');
      const rows=kind==='granite'?4:10,cols=kind==='granite'?4:8;
      for(let row=0;row<rows;row++)for(let k=-1;k<cols;k++){
        const x=(k+(row%2)*.5)*512/cols,y=row*256/rows;
        fill(x+1.2,y+1.7,512/cols-2.3,256/rows-3.1,colours[Math.abs(k*7+row*3+k*row)%5]);
        fill(x+1.5,y+2,512/cols-3,1,'#ffffff19');
      }
    }else{
      const glass=kind==='curtain',modern=kind==='care',office=kind==='office';
      fill(0,0,512,256,glass?'#c7d2cf':modern?'#e9e3d9':office?'#bcc3bc':'#e7bfb3');
      for(let k=0;k<4;k++){
        const x=128*k,offset=glass?3:modern?8:15;
        fill(x+offset-3,20,128-2*offset+6,155,glass?'#b5cbcd':'#f0e4d5');
        const grad=c.createLinearGradient(x,30,x+68,170);
        grad.addColorStop(0,glass?'#8ca2a2':modern?'#98a5a5':'#9caeaa');
        grad.addColorStop(.52,glass?'#577a83':modern?'#6c8486':'#627b7a');
        grad.addColorStop(1,glass?'#375765':'#4f696d');
        fill(x+offset,24,128-2*offset,glass?193:144,grad);
        if(glow&&(k===1||k===3)){
          glow.fillStyle=office?'#bfba9e':'#c1cec0';
          const start=k===3&&!glass?90:31,bottom=glass?208:162;
          for(const [left,width] of [[x+offset+2,59-offset],[x+66,59-offset]]){
            glow.fillRect(left,start,width,bottom-start);
            glow.clearRect(left,82,width,6);
          }
        }
        if(!glass&&k%3===0)fill(x+offset,27,128-2*offset,34+k*9,'#d8cabb');
        fill(x+61,24,3,glass?193:145,'#d5d8cc');fill(x+offset,83,128-2*offset,4,'#c4cec5');
        if(!glass)fill(x+offset-3,166,128-2*offset+6,5,'#ebe6d8');
      }
      if(kind==='ward'){fill(0,194,512,8,'#eee4d4');fill(0,208,512,4,'#ab9890');}
      if(glass){fill(0,213,512,9,'#839e9e');fill(0,224,512,13,'#3b5865');}
    }
    const tex=new THREE.CanvasTexture(cv);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
    const mat=new THREE.MeshLambertMaterial({map:tex,side:THREE.DoubleSide});if(mask){
      const tex=new THREE.CanvasTexture(mask);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.colorSpace=THREE.SRGBColorSpace;
      HKModels.dimmable(mat,tex,.55);
    }
    materials.set(kind,mat);return mat;
  }
  function build(id,{b,group,frame,edges,ring,low,top,shell,sign,shopSign,tile,ground}){
    const cream='#eee4d1',stone='#c6bba9',deep='#3b5154',iron='#52615b',roofGrey='#5b605b';
    const batches=new Map();
    const flat=p=>[p[0],p[2]];
    const box=(f,u,y,v,w,h,d,color)=>b.box(...f.at(u,y,v),w,h,d,color,f.angle);
    const patch=(f,l,r,y,h,v,color)=>tile(b,f,l,r,y,h,v,color);
    const bar=(f,u,y,v,U,Y,V,r,c)=>b.beam(f.at(u,y,v),f.at(U,Y,V),r,c);
    const localFrame=(f,a,v,A,V)=>frame(flat(f.at(a,0,v)),flat(f.at(A,0,V)));
    const station=([x,z,dx,dz])=>frame([x,z],[x+dx,z+dz]);
    const localGround=(f,u,v)=>ground(...flat(f.at(u,0,v)));
    // Reconstruct the front sill in the measured orientation, even where a facade is split by bay windows.
    function front(key,nx,nz){
      const [x,z,dx,dz,width,depth]=surveyFront(ring(key),nx,nz);
      const f=frame([x,z],[x+dx*width,z+dz*width]);f.depth=depth;return f;
    }
    function skin(f,start,end,lo,hi,style,unitsX,unitsY,off=.045){
      if(end-start<.15||hi<=lo)return;
      const mat=wallMaterial(style);
      if(!batches.has(mat))batches.set(mat,{points:[],uv:[]});
      const bin=batches.get(mat),u=(end-start)/unitsX,v=(hi-lo)/unitsY;
      const q=[f.at(start,lo,off),f.at(end,lo,off),f.at(end,hi,off),f.at(start,hi,off)],uv=[[0,0],[u,0],[u,v],[0,v]];
      for(const k of [0,1,2,0,2,3]){bin.points.push(...q[k]);bin.uv.push(...uv[k]);}
    }
    function paintedShell(key,style,colour,pitch,levels){
      const lo=low(key),hi=top(key),floor=(hi-lo-.85)/levels;
      shell(key,colour,'#b7b7aa');
      edges(ring(key),(a,c)=>{
        const f=frame(a,c);if(f.length<1)return;
        skin(f,0,f.length,lo+.12,hi-.73,style,pitch,floor);
        if(f.length>3.5)box(f,f.length/2,hi-.38,.06,f.length,.38,.23,'#e4dfd0');
      });
      return floor;
    }
    function sash(f,u,y,w,h,d,shutters=false){
      patch(f,u-w/2-.1,u+w/2+.1,y-.11,y+h+.13,d,stone);
      patch(f,u-w/2,u+w/2,y,y+h,d+.025,'#435a5a');
      const [x,,z]=f.at(u,y,d);
      if(Math.abs(Math.round(x*1.4+z+y))%5<2)
        tile(b.lights,f,u-w*.46,u+w*.46,y+.07,y+h-.05,d+.033,'#b39c75');
      for(const t of [-.24,0,.24])patch(f,u+w*t-.026,u+w*t+.026,y,y+h,d+.045,cream);
      patch(f,u-w/2,u+w/2,y+h*.55,y+h*.55+.05,d+.05,cream);
      if(shutters)for(const s of [-1,1]){
        const m=u+s*w*.71;box(f,m,y+h/2,d+.02,w*.37,h,.08,'#496955');
        for(let n=1;n<8;n++)patch(f,m-w*.16,m+w*.16,y+h*n/8,y+h*n/8+.033,d+.073,'#8b9b77');
      }
    }
    function arcade(f,u,y,w,leg,rise,d,color,glazing){
      patch(f,u-w/2,u+w/2,y,y+leg,d,glazing);
      for(let k=0;k<14;k++){
        const a=Math.PI*k/14,c=Math.PI*(k+1)/14;
        const pt=(t,extra)=>f.at(u+(w/2+extra)*Math.cos(t),y+leg+(rise+extra)*Math.sin(t),d+.02);
        b.tri(f.at(u,y+leg,d+.01),pt(a,0),pt(c,0),glazing);
        b.quad(pt(a,0),pt(c,0),pt(c,.16),pt(a,.16),color);
      }
    }
    function hip(f,u,v,w,d,y,h,clay,hipped=true){
      // Ridge follows the local u axis. Both end faces are closed to the eaves.
      const l=u-w/2,r=u+w/2,inset=hipped?Math.min(d*.38,w*.23):0;
      for(const s of [-1,1]){
        b.quad(f.at(l,y,v+s*d/2),f.at(r,y,v+s*d/2),f.at(r-inset,y+h,v),f.at(l+inset,y+h,v),s===1?clay[0]:clay[1]);
        bar(f,l,y,v+s*d/2,r,y,v+s*d/2,.095,clay[2]);
        for(let j=1;j<=7;j++){
          const t=j/8;bar(f,l+inset*t,y+t*h,v+s*d/2*(1-t),r-inset*t,y+t*h,v+s*d/2*(1-t),.033,clay[2]);
        }
      }
      for(const s of [-1,1]){
        const x=u+s*w/2;b.tri(f.at(x,y,v-d/2),f.at(x-s*inset,y+h,v),f.at(x,y,v+d/2),hipped?clay[0]:clay[2]);
      }
      bar(f,l+inset,y+h+.02,v,r-inset,y+h+.02,v,.12,clay[2]);
    }
    function hospital(){
      const letters='#dfddd3',warm='#e4b8a8',ash='#e7e5db';
      // Keep the podium's surveyed cut-outs and every ward's individual roof level.
      shell(253654,'#cacbc0','#b7b8a9');
      for(const [key,name] of wards){
        const ward=key!==337787&&key!==70967&&key!==88912;
        const lo=low(key),hi=top(key),levels=Math.max(4,Math.round((hi-lo)/3.65));
        const step=paintedShell(key,ward?'ward':'care',ward?warm:ash,ward?11.5:13,levels);
        edges(ring(key),(a,c)=>{
          const f=frame(a,c),w=f.length;if(w<10)return;
          // Recessed ribbon glazing, ends of the concrete sunshades and distinct stair glazing.
          for(let i=2;i<levels;i+=ward?1:2)box(f,w/2,lo+step*i+.12,.12,w-.16,.16,ward?.44:.28,letters);
          if(w>24){
            const u=w*.78;patch(f,u-1.3,u+1.3,lo+1.3,hi-.8,.25,'#ced0c4');
            for(let j=1;j<levels;j++){
              patch(f,u-.71,u+.71,lo+step*j-.5,lo+step*j+.9,.27,'#748a86');
              tile(b.lights,f,u-.68,u+.68,lo+step*j-.46,lo+step*j+.86,.277,'#b9c9b6');
            }
          }
        });
        const points=ring(key),f=front(key,.24,.97);
        if([337651,337650,337649,337645].includes(key))sign(f,f.length*.45,hi-2.03,-.02,1.75,1.84,name,'','#a25a4a','#fff3db');
        const a=points[0],c=points[1],len=Math.hypot(c[0]-a[0],c[1]-a[1]);
        if(len>11){
          const side=frame(a,c),span=Math.min(9,len*.46);
          box(side,len/2,hi+.62,-2.55,span,1.25,3.7,'#c1bdb1');
          box(side,len/2,hi+1.29,-2.55,span+.2,.17,3.9,ash);
          for(let j=-1;j<=1;j++)box(side,len/2+j*span*.24,hi+.66,-.67,.48,.59,.11,'#777e75');
        }
      }
      for(const [key,modern] of [[311454,false],[311455,true]]){
        const lo=low(key),hi=top(key),floors=modern?14:7,step=paintedShell(key,modern?'curtain':'care',ash,modern?11:12.6,floors);
        edges(ring(key),(a,c)=>{
          const f=frame(a,c);if(f.length<12)return;
          if(modern){
            for(let j=1;j<floors;j++)box(f,f.length/2,lo+j*step,.13,f.length,.38,.46,'#dce1d9');
            for(const u of [f.length*.12,f.length*.88])box(f,u,(lo+hi)/2,.15,.8,hi-lo,.52,ash);
            box(f,f.length/2,hi+.64,.08,f.length,1.22,.58,ash);
          }
        });
        const f=front(key,.24,.97),w=f.length;
        sign(f,w*.52,hi-3,.29,modern?23:16,1.85,modern?'日間醫療中心新翼':'日間醫療中心',modern?'AMBULATORY CARE CENTRE EXTENSION':'AMBULATORY CARE CENTRE','#e0e3d7','#486868');
      }
      // Higher plant rooms, white roof frames, exhausts and cooling banks on the clinical buildings.
      for(const key of [311454,311455,337787]){
        const f=front(key,.24,.97),w=f.length,d=f.depth,hi=top(key),modern=key===311455;
        const u=w*.50,v=-d*.50;
        const roomW=Math.min(w*.42,22),roomD=Math.min(d*.26,8),roomH=modern?3.9:2.55;
        box(f,u,hi+roomH/2,v,roomW,roomH,roomD,'#d7d5ca');
        box(f,u,hi+roomH+.09,v,roomW+.34,.24,roomD+.35,'#e9e4d9');
        for(let j=0;j<Math.floor(roomW/.84);j++)
          box(f,u-roomW/2+.72+j*.80,hi+roomH*.48,v+roomD*.50+.02,.46,roomH*.61,.08,'#849394');
        for(let j=0;j<4;j++){
          const x=u+(j-1.5)*3.85,z=v+roomD*.5+2.44;
          box(f,x,hi+.63,z,3.25,1.26,2.55,'#acb4ac');
          b.cylinder(...f.at(x,hi+1.31,z),.90,.90,.11,'#62736f',16);
          for(const t of [-1,0,1])box(f,x,hi+1.39,z+t*.34,1.55,.05,.075,'#c0c4b9');
        }
        if(modern){
          const cornice=hi+3.55;
          for(const frac of [.065,.935]){
            const x=w*frac;
            for(const fracD of [.14,.86])box(f,x,hi+1.85,-d*fracD,.68,3.7,.72,cream);
            box(f,x,cornice,-d/2,.79,.54,d*.72+.8,cream);
          }
          for(const fracD of [.14,.86])box(f,w*.5,cornice,-d*fracD,w*.87+.64,.54,.80,cream);
        }
      }
      // Recessed street doors and an open drop-off canopy on the roundabout side of the ACC.
      const entry=frame([461.1,-1367.6],[470.5,-1329.9]),deck=top(253654);
      for(let j=0;j<5;j++){
        const u=10.6+j*2.3;
        patch(entry,u-1.06,u+1.06,deck+.12,deck+2.85,.10,'#526f70');
        tile(b.lights,entry,u-1.03,u+1.03,deck+.18,deck+2.79,.108,'#c9d3bd');
        box(entry,u,deck+1.52,.14,.060,2.74,.07,'#d4d8ce');
      }
      box(entry,15.0,deck+3.55,1.52,14.0,.36,3.35,'#e1e0d3');
      for(const u of [8.7,21.2])box(entry,u,deck+1.73,2.88,.24,3.46,.24,'#b2b7ac');
      sign(entry,15,deck+3.57,3.21,8.4,.49,'日間醫療中心入口','AMBULATORY CARE CENTRE','#607b75');
      const ward=front(337651,.24,.97);
      sign(ward,ward.length*.49,top(337651)-.95,.28,22,1.55,'伊利沙伯醫院','QUEEN ELIZABETH HOSPITAL','#f1e6d8','#974741');
      // Low covered ambulance arrival at the F/G junction, on the clinical podium.
      const ae=frame([581.08,-1507.85],[574.17,-1535.72]),level=top(253654);
      box(ae,8.4,level+3.7,1.35,15.7,.54,3.25,'#d6d9d2');
      tile(b.lights,ae,.64,16.16,level+3.46,level+3.54,2.98,'#ffdfb2');
      for(const u of [1.25,15.45])box(ae,u,level+1.81,2.73,.24,3.62,.24,ash);
      sign(ae,8.4,level+3.75,3.02,10.9,.8,'急症室','ACCIDENT & EMERGENCY','#b54037','#fff1e2');
      for(const u of [5.2,7.0,8.8,10.6]){
        patch(ae,u-.84,u+.84,level+.03,level+2.45,.055,'#52696b');
        box(ae,u,level+1.28,.10,.052,2.44,.06,'#b9c8c3');
      }
      const parking=localFrame(ae,12,4.85,19,4.85);
      b.quad(ae.at(.5,level+.035,3.05),ae.at(22,level+.035,3.05),ae.at(22,level+.035,7.68),ae.at(.5,level+.035,7.68),'#858a81');
      for(const v of [3.2,7.52])box(ae,11.25,level+.055,v,21.2,.025,.09,'#e6c66e');
      box(parking,3.6,level+1.29,0,4.97,1.86,1.94,'#dfd6a2');
      box(parking,3.5,level+2.26,0,4.6,.19,1.87,'#e9e6d9');
      for(const side of [-1,1]){
        box(parking,3.58,level+.95,side*.977,4.62,.25,.05,'#c76749');
        box(parking,4.92,level+1.65,side*.978,1.10,.76,.05,'#536e77');
        for(const u of [2.1,5.0]){
          const pos=parking.at(u,level+.43,side*.97);
          b.cylinder(...pos,.39,.39,.19,'#474944',12,Math.PI/2,0,-parking.angle);
        }
      }
      box(parking,5.99,level+1.62,0,.08,.66,1.65,'#516c73');
      box(parking,6.04,level+.71,0,.13,.17,1.85,'#747877');
      for(const side of [-1,1]){
        box(parking,6.04,level+1.03,side*.71,.09,.19,.35,'#f3e8bb');
        box(parking,1.09,level+1.04,side*.72,.06,.31,.19,'#b75d48');
        const flank=localFrame(parking,1.86,side*.985,3.72,side*.985);
        sign(flank,.92,level+1.47,.014,1.45,.36,'救護車','AMBULANCE','#dad3a3','#76554a');
      }
      for(const v of [-.55,.55])box(parking,4.95,level+2.43,v,.27,.12,.28,'#7699af');
      // Roadside hospital directory faces arriving vehicles on Queen Elizabeth Hospital Road.
      const road=station(directory),y=localGround(road,0,0);
      box(road,0,y+1.95,0,3.6,3.9,.28,'#e0e4d9');
      sign(road,0,y+2.56,.16,3.47,1.42,'伊利沙伯醫院','QUEEN ELIZABETH HOSPITAL','#e9e5d8','#783f3a');
      sign(road,0,y+1.43,.16,3.47,.72,'急症室  ↑','ACCIDENT & EMERGENCY','#a9473e');
    }
    function court(){
      const key=90224,y=low(key),hi=top(key),f=front(key,-.646,.763),w=f.length;
      shell(key,'#aea89c','#9c9e93');
      edges(ring(key),(a,c)=>{
        const side=frame(a,c),width=side.length;
        if(width<2)return;
        skin(side,0,width,y+.1,hi-.45,'brick',3.6,2.0);
        skin(side,0,width,Math.min(y-.05,localGround(side,width/2,0)-.45),y+3.18,'granite',5.5,2.3,.065);
        const n=Math.floor(width/3.3);
        for(let j=0;j<n;j++)for(const base of [3.6,7.3])sash(side,width*(j+.5)/n,y+base,1.28,2.13,.09);
        box(side,width/2,hi-.32,.11,width,.46,.43,cream);
      });
      const left=w*.16,right=w*.84,m=w/2;
      box(f,m,y+3.18,.42,right-left+1.2,.65,2.6,stone);
      box(f,m,hi-.52,.51,right-left+1.8,.72,2.62,cream);
      box(f,m,hi-.12,.55,right-left+2.1,.22,2.85,stone);
      for(let j=0;j<8;j++){
        const u=left+(right-left)*j/7,shaft=hi-y-4.3;
        b.cylinder(...f.at(u,y+3.76+shaft/2,1.24),.36,.45,shaft,'#d9d2bf',16);
        for(const [h,r,th] of [[3.45,.59,.18],[3.64,.49,.17],[hi-y-.93,.49,.19],[hi-y-.78,.57,.17]])
          b.cylinder(...f.at(u,y+h,1.24),r,r,th,cream,16);
        box(f,u,hi-.67,1.24,1.22,.22,1.08,cream);
      }
      const entry=ground(...flat(f.at(m,0,4))),landing=y+3.35;
      box(f,m,(entry+landing)/2,3.04,5.0,Math.max(.35,landing-entry),3.5,stone);
      skin(f,m-2.49,m+2.49,entry-.06,landing,'granite',4.9,1.9,4.81);
      for(const dir of [-1,1]){
        const walk=8.65,n=16,run=walk/n;
        for(let j=0;j<n;j++){
          const u=m+dir*(2.35+(j+.5)*run),base=localGround(f,u,3.18),t=(n-j)/n;
          const head=Math.max(base+.09,base+(landing-base)*t);
          box(f,u,(base+head)/2,3.15,run+.035,head-base+.07,3.16,'#cac5b6');
          skin(f,u-run/2,u+run/2,base-.07,head,'granite',3.6,1.48,4.74);
          if(j%2===0){
            b.cylinder(...f.at(u,head+.35,4.62),.075,.14,.70,cream,8);
            b.cylinder(...f.at(u,head+.51,4.62),.12,.077,.25,cream,8);
          }
        }
        const end=m+dir*(2.35+walk),base=localGround(f,end,3.18);
        bar(f,m+dir*2.35,landing+.82,4.62,end,base+.93,4.62,.105,cream);
      }
      for(const side of [-1,1]){
        const edge=m+side*(w*.34),inner=m+side*2.75,l=Math.min(edge,inner),r=Math.max(edge,inner);
        box(f,(l+r)/2,y+4.19,1.76,r-l,.15,.26,cream);
        for(let u=l+.28;u<r;u+=.57){
          b.cylinder(...f.at(u,y+3.84,1.76),.106,.145,.57,cream,7);
        }
      }
      box(f,m,y+5.08,-.07,3.07,3.17,.35,'#8e8879');
      patch(f,m-1.31,m+1.31,y+3.53,y+6.55,.13,'#45483e');
      for(const side of [-1,1])box(f,m+side*.64,y+4.91,.18,1.13,2.43,.09,'#605444');
      sign(f,m,y+6.93,.21,4.16,.69,'土地審裁處','LANDS TRIBUNAL','#565c51','#ede6ce');
    }
    function redBrick(){
      const key=70722,y=low(key),hi=top(key),f=front(key,-.985,.173),w=f.length,d=f.depth,eave=hi-2.08;
      const gallery=y+4.14;
      shell(key,'#a25c48','#b9ac91',y,gallery);
      edges(ring(key),(a,c)=>{
        const wall=frame(a,c);if(wall.length<2)return;
        const mid=wall.at(wall.length/2,0),out=wall.at(wall.length/2,0,1);
        const west=(out[0]-mid[0])<-.93;
        skin(wall,0,wall.length,y+.08,gallery,'brick',2.45,1.08);
        if(!west){
          box(wall,wall.length/2,(gallery+eave)/2,-.10,wall.length,eave-gallery,.2,'#ab614b');
          skin(wall,0,wall.length,gallery,eave,'brick',2.45,1.08);
          for(let j=0,n=Math.floor(wall.length/3.65);j<n;j++)for(const k of [0,1])
            sash(wall,(j+.5)*wall.length/n,y+.75+k*3.65,1.09,1.78,.06,true);
        }
        box(wall,wall.length/2,gallery-.12,.05,wall.length,.16,.18,stone);
        box(wall,wall.length/2,eave-.08,.06,wall.length+.08,.23,.26,'#ba8063');
      });
      const bay=w/5,leg=1.83,rise=.43,foot=gallery+.36,spring=foot+leg;
      // Five shallow segmental arches face Shanghai Street above the mostly blind ground floor.
      // Model the depth of the gallery and the X-pattern ironwork as seen after conservation.
      box(f,w/2,(eave+gallery)/2,-1.62,w-.2,eave-gallery,.27,'#795244');
      for(let j=0;j<5;j++){
        const u=(j+.5)*bay,rad=bay*.421;
        sash(f,u,gallery+.69,.96,1.62,-1.45,true);
        for(const side of [-1,1]){
          const x=u+side*(rad+.08);
          box(f,x,(eave+gallery)/2,-.12,.18,eave-gallery,.38,'#a6614b');
          skin(f,x-.088,x+.088,gallery,eave,'brick',2.45,1.08,.081);
        }
        for(let k=0;k<12;k++){
          const a=Math.PI*k/12,c=Math.PI*(k+1)/12;
          const arc=(ang,offset,v)=>f.at(u+(rad+offset)*Math.cos(ang),spring+(rise+offset)*Math.sin(ang),v);
          const A=arc(a,0,.085),C=arc(c,0,.085);
          b.quad(A,C,arc(c,.135,.085),arc(a,.135,.085),'#bb805f');
          b.quad(arc(a,.135,.065),arc(c,.135,.065),f.at(u+(rad+.135)*Math.cos(c),eave,.065),f.at(u+(rad+.135)*Math.cos(a),eave,.065),'#a15c48');
          b.quad(A,C,arc(c,0,-.31),arc(a,0,-.31),'#915f50');
        }
        box(f,u,gallery+.85,.05,rad*2,.12,.16,'#c1b49c');
        for(let k=0;k<3;k++){
          const l=u-rad+k*rad*2/3,r=l+rad*2/3;
          bar(f,l,gallery+.1,.07,r,gallery+.78,.07,.022,iron);
          bar(f,l,gallery+.78,.07,r,gallery+.1,.07,.022,iron);
          bar(f,l,gallery+.1,.07,l,gallery+.78,.07,.027,iron);
        }
      }
      sash(f,w*.49,y+1.04,.85,1.24,.079);
      hip(f,w/2,-d/2,w+.42,d+.48,eave,hi-eave,['#5f615d','#69716b','#898980'],false);
      box(f,w*.72,hi+.43,-d*.5,.64,1.2,.79,'#a05c47');
      box(f,w*.72,hi+1.03,-d*.5,.85,.17,.96,'#c19c80');
      for(const u of [w*.20,w*.80]){
        bar(f,u,y+.16,.17,u,eave-.75,.17,.069,iron);
        box(f,u,eave-.62,.17,.29,.32,.24,iron);
      }
      sign(f,w*.54,y+3.66,.36,2.45,.56,'紅磚屋','RED BRICK BUILDING','#735041');
    }
    function temple(){
      const names=['書院','公所','天后古廟','福德祠','書院'];
      for(const [i,key] of templeHalls.entries()){
        const f=front(key,-.9842,.177),w=f.length,d=f.depth,y=low(key),hi=top(key),central=i===2;
        const eave=hi-(central?2.62:1.86),floor=y+.36,wall=central?'#a69c83':'#828576';
        shell(key,'#a19b86','#b7ad95',y,floor);
        const setback=central?1.04:0;
        for(const v of [-.30-setback,-d+.24]){
          box(f,w/2,(floor+eave)/2,v,w-.19,eave-floor,.44,wall);
          if(v< -d/2)continue;
          skin(f,.09,w-.09,floor,eave,'greybrick',2.65,1.28,.012-setback);
          const door=w*(central?.22:.31);
          patch(f,w/2-door/2,w/2+door/2,floor,floor+2.48,.033-setback,'#503a32');
          for(const signSide of [-1,1]){
            if(central){
              const q=f.at(w/2+signSide*(door*.5+.53),floor+2.36,.51-setback);
              b.cylinder(...q,.20,.18,.38,'#a3422b',10);
              b.lights.cylinder(...q,.204,.184,.33,'#e1783e',10);
            }
            const u=w/2+signSide*(door*.5+.18);
            box(f,u,floor+1.42,.11-setback,.26,2.84,.21,'#a53f32');
            box(f,u,floor+1.55,.24-setback,.035,1.95,.018,'#d8b567');
            if(w>8)sash(f,w/2+signSide*w*.34,floor+.96,1.04,1.12,.09-setback);
          }
          sign(f,w/2,floor+2.93,.17-setback,Math.min(3.3,w*.62),.78,names[i],'',central?'#333d34':'#8b4536','#e9cb85');
        }
        for(const u of [.17,w-.17])box(f,u,(floor+eave)/2,-d/2,.34,eave-floor,d-.35,'#848678');
        const pitch=central?1.75:1.16,clay=['#687f72','#506a60','#8c9a82'];
        // Front and rear pitched halls flank an open lightwell; narrow side passages join them.
        const frontDepth=d*.40,rearDepth=d*.40;
        for(const [v,span] of [[-frontDepth/2,frontDepth],[-d+rearDepth/2,rearDepth]]){
          hip(f,w/2,v,w+.34,span+.5,eave,pitch,clay,false);
          for(const s of [-1,1]){
            const u=w/2+s*(w/2+.06);
            bar(f,u-s*.76,eave+pitch+.02,v,u+s*.20,eave+pitch+.33,v,.115,'#889082');
            b.dome(...f.at(u+s*.19,eave+pitch+.3,v),.15,.23,.15,'#85a998',0,6);
          }
          if(central){
            box(f,w/2,eave+pitch+.23,v,w*.81,.45,.34,'#a18f70');
            const colours=['#668e79','#a85e43','#7e98a0','#d6b275'];
            for(let k=0;k<21;k++)b.dome(...f.at(w*(.12+.038*k),eave+pitch+.43,v),.19,.16+.06*(k%3),.15,colours[k%4],0,6);
          }
        }
        for(const u of [.55,w-.55])box(f,u,eave-.14,-d/2,1.12,.33,d*.24,roofGrey);
        if(central){
          // Projecting eaves, two raised drum terraces and painted brackets shelter the entrance.
          const porchRoof=eave-.24;
          b.quad(f.at(.32,porchRoof+.18,-.85),f.at(w-.32,porchRoof+.18,-.85),f.at(w-.32,porchRoof-.40,1.46),f.at(.32,porchRoof-.40,1.46),'#647f70');
          for(let col=0;col<31;col++)bar(f,.35+col*(w-.7)/30,porchRoof+.22,-.86,.35+col*(w-.7)/30,porchRoof-.35,1.48,.062,'#819886');
          for(const s of [-1,1]){
            const u=w/2+s*2.55,terrace=w/2+s*w*.35;
            box(f,terrace,floor+.37,.17,w*.25,.74,1.67,'#a5a18e');
            box(f,terrace,floor+.78,.18,w*.26,.14,1.8,'#c2b7a2');
            for(const xx of [u,terrace]){
              box(f,xx,porchRoof-.62,.82,.76,.19,.56,'#a47f57');
              box(f,xx,porchRoof-.42,.82,1.12,.22,.48,'#799185');
            }
            b.cylinder(...f.at(u,floor+1.57,.65),.17,.20,3.15,'#aeaba0',10);
            const v=1.1;b.cylinder(...f.at(u+s*.64,floor+2.05,v),.34,.33,.55,'#bd4838',10);
            bar(f,u+s*.64,floor+1.52,v,u+s*.64,floor+1.8,v,.045,'#dfb558');
          }
          box(f,w/2,floor+3.29,.42,7.12,.24,1.5,'#8c5841');
          const v=2.4; b.cylinder(...f.at(w/2,floor+.57,v),.63,.4,.8,'#8b7960',14);
          for(let k=0;k<9;k++)bar(f,w/2-.29+.069*k,floor+.95,v,w/2-.33+.075*k,floor+1.28+.05*(k%3),v,.012,'#af7051');
        }
      }
      const f=front(234759,-.9842,.177),centre=f.length/2;
      // The planted public square has a paved approach and an enclosing screen wall.
      for(let u=-9;u<23;u+=2)for(let v=1.8;v<30;v+=2){
        const q=[[u,v],[u+2,v],[u+2,v+2],[u,v+2]].map(([a,d])=>f.at(a,localGround(f,a,d)+.11,d));
        b.quad(...q,(Math.round((u+v)/2)%3)?'#c2b49e':'#b8aa94');
      }
      for(const [u,width] of [[-4.65,16],[18.05,16]]){
        const frontSide=localFrame(f,u-width/2,5.8,u+width/2,5.8);
        for(let j=0;j<8;j++){
          const a=j*2,y=localGround(frontSide,a+1,0);
          box(frontSide,a+1,y+.55,0,2.02,1.10,.46,'#975d49');
          skin(frontSide,a,a+2,y+.03,y+1.07,'brick',2.2,.98,.238);
          box(frontSide,a+1,y+1.08,0,2.03,.13,.52,'#c3b59a');
          for(let k=0;k<4;k++)box(frontSide,a+.22+k*.50,y+1.32,0,.18,.43,.26,'#8e9e81');
          box(frontSide,a+1,y+1.57,0,2.04,.15,.54,'#778e77');
        }
      }
      for(const u of [3.35,10.05]){
        const y=localGround(f,u,5.8);
        box(f,u,y+1.40,5.8,.88,2.80,.89,'#ad7254');
        box(f,u,y+2.74,5.8,1.04,.23,1.03,cream);
        hip(f,u,5.8,1.33,1.19,y+2.85,.41,['#708d7c','#526d62','#8e9c80']);
      }
      const crown=new THREE.IcosahedronGeometry(1,1);
      for(const [u,v,scale] of [[-6.7,15.8,1.02],[17.2,11.8,.86],[21,26,1.12],[-8,27.7,.9]]){
        const p=f.at(u,localGround(f,u,v),v),[x,y,z]=p;
        b.cylinder(x,y+2.2,z,.36,.55,4.4,'#746d57',9);
        for(let k=0;k<9;k++){
          const a=k*2.4+u,rad=(2.05+(k%4)*.62)*scale,xx=x+Math.cos(a)*rad,zz=z+Math.sin(a)*rad,yy=y+4.9+(k%4)*.64;
          b.beam([x,y+2.8,z],[xx,yy,zz],.15,'#766d58');
          b.mesh(crown,['#647950','#536e51','#72865b'][k%3],xx,yy+1.1,zz,2.7*scale,1.65,2.4*scale,0,a);
          if(k%3===0)b.beam([xx,yy+.2,zz],[xx-.12,yy-2.15,zz+.1],.046,'#806f56');
        }
      }
      for(const key of [70966,71516])shell(key,'#808477','#666d62',low(key),Math.min(top(key),11.1));
    }
    function barracks(){
      for(const key of heritageBlocks){
        const f=front(key,...(key===159290?[.999,-.031]:[.032,.9995])),w=f.length,d=f.depth;
        const lo=low(key),hi=top(key),eave=hi-2.05;
        shell(key,'#d6ceaf','#b5ad99',lo,eave);
        for(const side of [f,localFrame(f,w,-d,0,-d)]){
          const length=side.length,n=Math.round(length/4.15),pitch=length/n;
          for(let j=0;j<n;j++)for(const lev of [.44,(eave-lo)*.52+.14]){
            const u=pitch*(j+.5);
            patch(side,u-pitch*.39,u+pitch*.39,lo+lev,lo+lev+2.45,.04,'#817e6b');
            sash(side,u,lo+lev+.34,1.02,1.65,.08,true);
            box(side,u-pitch*.46,lo+lev+1.28,.27,.25,2.68,.4,cream);
            if(lev>1){
              box(side,u,lo+lev+.68,.4,pitch-.25,.09,.10,cream);
              box(side,u,lo+lev+.28,.38,pitch-.25,.34,.15,'#d7d0b8');
            }
          }
          box(side,length/2,(lo+eave)/2,.21,length,.24,.56,cream);
        }
        hip(f,w/2,-d/2,w+.6,d+.55,eave,hi-eave,['#aa705b','#956451','#b4876c']);
      }
    }
    function commerce(){
      const wing=id==='wingon',key=wing?224286:228485;
      if(wing)paintedShell(299525,'office','#d3d0bc',11,12);
      const y=low(key),hi=top(key),en=wing?'WING ON':'IN’S POINT';
      shell(key,wing?'#d1c6b4':'#d9d5c9','#bcb9a9');
      edges(ring(key),(a,c)=>{
        const f=frame(a,c),w=f.length;if(w<1.6)return;
        const retailTop=Math.min(hi-.2,y+(wing?12.6:14.4)),opening=Math.min(4.1,retailTop-y);
        if(hi>retailTop+1)skin(f,0,w,retailTop,hi-.4,'office',12.4,3.46);
        patch(f,0,w,y+.15,y+opening,.055,'#476569');
        for(let j=0,n=Math.max(1,Math.round(w/3.5));j<n;j++){
          const u=(j+.52)*w/n,span=w/n;
          patch(f,u-span*.39,u+span*.39,y+.3,y+opening-.34,.09,j%3?'#768b84':'#4e6868');
          b.shopWindow(f,u-span*.37,u+span*.37,y+.43,y+opening-.47,.104,'#c5af87');
          box(f,u,y+opening*.52,.14,.074,opening-.22,.11,'#cec7b5');
          if(j%3===1)box(f,u,y+.89,.18,.10,1.08,.1,'#d5ba84');
        }
        for(let h=y+opening+.74;h<retailTop;h+=1.03)box(f,w/2,h,.12,w,.15,.24,'#b5ada0');
        if(w>8)box(f,w/2,y+opening+.22,.28,w,.41,.62,wing?'#7b3438':'#504978');
      });
      // The two podiums face opposite sides of Nathan Road.
      const f=front(key,wing?.996:-.983,wing?-.094:.18),w=f.length;
      const u=wing?w*.54:w*.5,sw=Math.min(w*.78,wing?17:11.3);
      if(wing){
        sign(f,u,y+7.2,.24,sw,3.08,'永 安 百 貨',en,'#843841','#f1e2bd');
        sign(f,u,y+3.8,.45,sw*.63,.72,'永安九龍中心','WING ON KOWLOON CENTRE','#51483e');
      }else{
        box(f,u,y+7.18,.33,sw+.42,3.3,.78,'#49376d');
        sign(f,u,y+7.18,.74,sw,2.99,'現 時 點',en,'#6e468c','#ffdc55');
      }
    }
    function nightMarket(){
      const cloth=['#9b5246','#27746d','#385d89','#b28c53','#8a4f5d','#427070','#aca48c','#675e87','#477957','#a86646','#456b83','#84725e'];
      const banners=[
        ['手打魚蛋','CURRY FISH BALLS'],['廟街小炒','WOK KITCHEN'],['港式點心','BAMBOO STEAMERS'],
        ['成衣布辦','COTTON & LINEN'],['帆布手袋','CANVAS BAGS'],['舊日唱片','VINYL RECORDS'],
        ['鮮榨蔗汁','FRESH JUICE'],['茶檔','HONG KONG TEA'],['手繪摺扇','PAINTED FANS'],
        ['懷舊玩具','TIN TOYS'],['街坊麵檔','NOODLE STALL'],['時款錶帶','WATCH STRAPS']
      ];
      const range=(n,fn)=>{for(let i=0;i<n;i++)fn(i);};
      function booth(kind){
        const p=new b.constructor(),shade=cloth[kind],pale=['#e9dbc1','#d6ceac','#c2cdd0'][kind%3],metal='#908f82';
        const cub=(x,y,z,w,h,d,c)=>p.box(x,y,z,w,h,d,c);
        const cyl=(x,y,z,r,R,h,c,n=10)=>p.cylinder(x,y,z,r,R,h,c,n);
        const rod=(a,c,r,tint=metal)=>p.beam(a,c,r,tint);
        function tarp(x0,x1,y0,y1,z0,z1,color){
          p.quad([x0,y0,z0],[x1,y0,z0],[x1,y1,z1],[x0,y1,z1],color);
        }
        const h=2.39+.095*(kind%4);
        for(const x of [-1.55,1.55])for(const z of [-.82,.82]){
          cub(x,h*.5,z,.046,h,.046,metal);
          rod([x,h-.35,z],[x*.78,h-.05,z],.022);
        }
        for(const side of [-1,1]){
          const n=8;
          range(n,i=>{
            const x=-1.73+i*(3.46/n),color=(kind%3===1&&i%2===0)?pale:shade;
            tarp(x,x+3.46/n,h+.29,h-.045,0,side*.98,color);
            if(side===1)tarp(x,x+3.46/n,h-.045,h-.22,.98,.98,color);
          });
          rod([-1.68,h-.05,side*.91],[1.68,h-.05,side*.91],.03);
        }
        if(kind%3!==0){
          tarp(-1.52,1.52,h-.12,.79,-.84,-.84,kind%2?'#d2bea0':'#a4a48c');
          for(const x of [-1.50,0,1.50])cub(x,1.5,-.81,.035,1.45,.032,metal);
        }
        cub(0,.76,.35,2.91,.12,.89,'#ad9d81');
        cub(0,.44,.72,2.9,.6,.07,kind%2?shade:'#ab785b');
        for(const x of [-1.31,1.31])cub(x,.36,.16,.07,.71,.07,metal);
        // Fluorescent strips and pendant shades sit under the canvas, visible from both ends.
        cub(.06,h-.2,.43,1.06,.052,.066,'#fff0b6');
        for(const x of [-1.01,.97]){
          cyl(x,h-.29,.47,.07,.18,.13,'#bb5b49',8);cyl(x,h-.375,.47,.082,.072,.062,'#ffe49d',8);
        }
        const inks=['#d9b65f','#9d5354','#577975','#718fa3','#e1d8ba','#ab8262'];
        if([0,1,2,6,7,10].includes(kind)){
          if(kind===2){
            for(const x of [-.86,-.25,.38,.97])for(let j=0;j<2+(x>0?1:0);j++){
              cyl(x,.87+j*.12,.4,.235,.23,.116,'#cc9f64',12);
              cyl(x,.93+j*.12,.4,.227,.225,.019,'#e0bc83',12);
            }
          }else if(kind===1||kind===10){
            for(const x of [-.65,.62]){
              cyl(x,.84,.39,.41,.31,.09,'#606261',12);cyl(x,.93,.39,.36,.22,.15,'#464e49',12);
              rod([x+.26,.96,.4],[x+.51,1.06,.62],.033,'#765a43');
            }
            cub(0,1.67,-.75,1.47,.36,.13,'#aeb3a8');
          }else{
            for(const x of [-.83,.05,.83]){
              cyl(x,.99,.29,.22,.22,.33,kind===7?'#b9b9a5':'#b9b0a1',12);
              cyl(x,1.17,.29,.23,.23,.043,'#d5cabb');
            }
          }
          range(6,j=>cyl(.63+(j%3)*.17,.87+Math.floor(j/3)*.06,.62,.067,.045,.11,'#e6ddbc',8));
        }else if(kind===3||kind===4){
          rod([-1.37,2.09,-.37],[1.37,2.09,-.37],.033);
          range(7,j=>{
            const x=-1.16+j*.38,hue=inks[(j+kind)%inks.length];
            if(kind===3){
              const pts=[[-.15,.0],[-.27,-.12],[-.20,-.22],[-.14,-.18],[-.14,-.49],[.14,-.49],[.14,-.18],[.20,-.22],[.27,-.12],[.15,0]];
              for(let k=0;k<pts.length;k++){
                const q=pts[k],r=pts[(k+1)%pts.length];p.tri([x,1.81,-.34],[x+q[0],2.01+q[1],-.34],[x+r[0],2.01+r[1],-.34],hue);
              }
            }else{
              cub(x,1.66,-.34,.27,.33,.11,hue);
              rod([x-.1,1.79,-.34],[x,2.05,-.34],.013);rod([x,2.05,-.34],[x+.1,1.79,-.34],.013);
            }
          });
          range(9,j=>cub(-.91+.58*(j%4),.85+.052*Math.floor(j/4),.35,.41,.06,.34,inks[j%6]));
        }else{
          range(12,j=>{
            const x=-1.12+(j%6)*.45,z=.19+.33*Math.floor(j/6);
            if(kind===8){
              for(let k=0;k<6;k++){
                const a=k*Math.PI/6,c=(k+1)*Math.PI/6;
                p.tri([x,.88,z],[x+Math.cos(a)*.20,.88+Math.sin(a)*.2,z-.045],[x+Math.cos(c)*.2,.88+Math.sin(c)*.2,z-.045],inks[(j+Math.floor(k/2))%6]);
              }
            }else if(kind===5){
              cub(x,.99,z,.32,.33,.045,inks[j%6]);cyl(x,1.0,z+.027,.08,.08,.019,'#524e46',8);
            }else cub(x,.88,z,.28,.12,.23,inks[(j+kind)%6]);
          });
        }
        if(kind===7||kind===10){
          const x=-1.29,z=-.32;
          cyl(x,.76,z,.40,.4,.063,'#aaa28b');cyl(x,.39,z,.045,.075,.7,metal);
          for(const sign of [-1,1]){
            const xx=x+sign*.33,zz=z-.33;
            cub(xx,.38,zz,.26,.075,.26,kind===7?'#b75745':'#4e8191');
            for(const leg of [-1,1])cub(xx+leg*.097,.19,zz,.040,.37,.19,kind===7?'#aa4e3f':'#507485');
          }
          cyl(x,.828,z,.094,.056,.07,'#e1d9bd');
        }
        // Vendor in the stall, serving from behind the counter.
        const vx=kind%2?-.63:.55,vz=-.29,skinTone=kind%3?'#bc8d73':'#d4ac89';
        for(const s of [-1,1])cub(vx+s*.083,.40,vz,.13,.73,.17,'#505755');
        cub(vx,1.08,vz,.39,.6,.22,inks[(kind+1)%6]);
        cub(vx,1.03,vz+.116,.29,.4,.025,kind%2?'#ddd2b3':'#536562');
        cyl(vx,1.58,vz,.131,.123,.245,skinTone,8);cyl(vx,1.715,vz-.012,.128,.142,.097,'#443f39',8);
        for(const s of [-1,1]){
          rod([vx+s*.174,1.31,vz],[vx+s*.26,1.06,vz+.1],.064,inks[(kind+1)%6]);
          rod([vx+s*.26,1.06,vz+.1],[vx+s*.16,.99,vz+.26],.046,skinTone);
        }
        return p.finish(banners[kind][0]);
      }
      for(const poly of market.paving){
        const q=poly.map(([x,z])=>[x,ground(x,z)+.075,z]);b.quad(...q,'#77776e');
      }
      const prototypes=banners.map((_,i)=>booth(i)),chunks=new Map(),rotation=new THREE.Quaternion(),
        axis=new THREE.Vector3(0,1,0),scale=new THREE.Vector3(),position=new THREE.Vector3();
      for(const [i,st] of market.stalls.entries()){
        const [x,z,dx,dz,w,d]=st,h=ground(x,z),kind=(i*5+Math.floor(i/11)*3+Math.floor(i/27))%12;
        const key=Math.floor(z/65);
        if(!chunks.has(key))chunks.set(key,{x,z,rows:banners.map(()=>[]),far:new b.constructor()});
        const chunk=chunks.get(key);
        rotation.setFromAxisAngle(axis,-Math.atan2(dz,dx));scale.set(w/3.5,1,d/2);
        chunk.rows[kind].push(new THREE.Matrix4().compose(position.set(x-chunk.x,h,z-chunk.z),rotation,scale));
        const f=station(st),ff=station([x-chunk.x,z-chunk.z,dx,dz]),hours=HKShopLights.hours(x,z);
        b.shopWindow(f,-w*.28,w*.28,h+2.05,h+2.14,d*.47,'#ffdc98',hours);
        for(const side of [-1,1]){
          chunk.far.quad(ff.at(-w/2,h+2.37,side*d/2),ff.at(w/2,h+2.37,side*d/2),ff.at(w/2,h+2.69,0),ff.at(-w/2,h+2.69,0),cloth[kind]);
        }
        chunk.far.box(x-chunk.x,h+.52,z-chunk.z,w*.79,.90,d*.54,'#aa8e73',ff.angle);
        if(i%3===0||Math.abs(z-market.gate[1])<32){
          shopSign(hours,f,0,h+2.22+.095*(kind%4),d*.495,w*.77,.39,...banners[kind],kind%3===0?'#a94d40':kind%3===1?'#375b54':'#e2cf9f',kind%3===2?'#503d30':'#fff0c8');
        }
      }
      for(const chunk of chunks.values()){
        const lod=new THREE.LOD(),near=new THREE.Group();lod.position.set(chunk.x,0,chunk.z);
        chunk.rows.forEach((array,k)=>{
          if(!array.length)return;
          const source=prototypes[k],draw=new THREE.InstancedMesh(source.geometry,source.material,array.length);
          array.forEach((m,i)=>draw.setMatrixAt(i,m));draw.computeBoundingSphere();draw.name=banners[k][0];
          draw.receiveShadow=true;near.add(draw);
        });
        lod.addLevel(near,0);lod.addLevel(chunk.far.finish('Distant canvas stalls'),160);group.add(lod);
      }
      const storeNames=[['隆記電器','ELECTRICAL GOODS'],['老字號涼茶','HERBAL TEA'],['華興布莊','FABRIC SHOP'],['茶餐室','TEA & TOAST'],
        ['上海理髮','BARBER SHOP'],['膠片相機','FILM CAMERAS'],['文記冰室','BING SUTT'],['利民辦館','PROVISIONS']];
      const trades=['tech','cafe','tailor','cafe',null,'tech','cafe','market'];
      const interiors=HKFrontages.interiorAtlas(),shutter={timedMaterial:HKShopLights.shutter,uv:[0,0,1,1]};
      for(const [i,st] of market.fronts.entries()){
        const f=station(st),w=st[4],floor=ground(st[0],st[1]),col=cloth[(i*5)%12];
        patch(f,-w/2,w/2,floor-.22,floor+3.32,.035,'#b6aa8c');
        patch(f,-w*.42,w*.42,floor+.15,floor+2.42,.053,'#455652');
        const hours=HKShopLights.hours(st[0],st[1]);
        patch(f,-w*.39,w*.02,floor+.58,floor+2.27,.068,i%3?'#80958b':'#ad9b75');
        const trade=trades[i%8];
        if(trade){
          shopSign(hours,f,-w*.185,floor+1.425,.078,w*.41,1.69,{mat:interiors.material,uv:interiors.uv[trade+Math.floor(i/8)%2]});
        }else b.shopWindow(f,-w*.39,w*.02,floor+.58,floor+2.27,.073,'#c7ad83',hours);
        shopSign(hours,f,0,floor+1.21,.23,w*.84,2.42,shutter);
        for(let k=0;k<4;k++)box(f,w*(-.38+k*.105),floor+1.38,.08,.045,1.75,.08,'#d6c8aa');
        box(f,w*.19,floor+1.4,.08,.84,2.4,.07,'#536963');
        box(f,w*.19,floor+1.04,.14,.05,.49,.05,'#dbc69c');
        for(let k=0;k<5;k++)box(f,-w*.18+(k%3)*.22,floor+.72+Math.floor(k/3)*.23,.13,.17,.18,.09,['#c9a75f','#af7454','#d4c5a7'][k%3]);
        shopSign(hours,f,0,floor+2.92,.105,w*.96,.69,...storeNames[i%8],col,'#f9e8ba');
        b.quad(f.at(-w/2,floor+2.65,.04),f.at(w/2,floor+2.65,.04),f.at(w/2,floor+2.45,.56),f.at(-w/2,floor+2.45,.56),i%3?col:'#c7ac86');
        if(i%7===0){
          const blade=localFrame(f,w*.35,.1,w*.35,1.45);
          box(blade,blade.length/2,floor+4.1,0,blade.length,.85,.10,col);
          shopSign(hours,blade,blade.length/2,floor+4.1,.057,blade.length,.81,storeNames[i%8][0],'',col,'#ffdf99');
          const reverse=localFrame(f,w*.35,1.45,w*.35,.1);
          shopSign(hours,reverse,reverse.length/2,floor+4.1,.057,reverse.length,.81,storeNames[i%8][0],'',col,'#ffdf99');
          bar(f,w*.35,floor+4.94,.05,w*.35,floor+4.56,1.33,.034,iron);
        }
      }
      for(const [i,st] of market.guests.entries()){
        let f=station(st);f=localFrame(f,.5,0,-.5,0);
        const y=ground(st[0],st[1]),short=1-(i%7)*.018,shirt=['#8b6878','#d39d62','#627d87','#9aaf90','#cb7865'][i%5];
        for(const s of [-1,1]){
          box(f,s*.085,y+.39*short,s*.045,.12,.72*short,.15,'#575d5e');
          box(f,s*.085,y+.078,s*.045+.035,.13,.11,.22,'#5b554e');
        }
        box(f,0,y+1.02*short,0,.37,.57*short,.22,shirt);
        b.cylinder(...f.at(0,y+1.51*short,0),.12,.115,.228*short,'#c49a7a',8);
        b.cylinder(...f.at(0,y+1.63*short,-.015),.119,.131,.091,i%3?'#514940':'#795d4b',8);
        bar(f,-.17,y+1.19*short,0,-.21,y+.88*short,.08,.059,shirt);
        bar(f,.17,y+1.19*short,0,.22,y+1.01*short,.16,.060,shirt);
        if(i%3===0)box(f,-.23,y+.72*short,.05,.23,.24,.12,'#c4a477');
      }
      // The stepped red-and-gold gateway faces Jordan Road.
      const axisFrame=station(market.gate),f=localFrame(axisFrame,0,-3.45,0,3.45),w=f.length,y=localGround(f,w/2,0);
      for(const u of [0,w]){
        const bottom=localGround(f,u,0);
        box(f,u,bottom+.28,0,.76,.56,.78,'#aaa598');
        b.cylinder(...f.at(u,(y+5.34+bottom)/2,0),.265,.31,y+5.34-bottom,'#a74233',12);
      }
      box(f,w/2,y+4.67,0,w+.5,.38,.42,'#963c2e');
      for(const u of [1.26,w-1.26])box(f,u,y+5.68,0,.28,1.94,.33,'#a94132');
      function gateRoof(u,width,base){
        hip(f,u,0,width,1.32,base,.35,['#c49d60','#bd965b','#ddbf82']);
        for(let j=0;j<Math.floor(width/.28);j++){
          const s=u-width/2+.18+j*.28;bar(f,s,base+.035,.64,s+.015,base+.15,.40,.043,'#d7b575');
        }
      }
      gateRoof(w/2,w+1.05,y+5.32);gateRoof(w/2,w-.68,y+6.72);
      box(f,w/2,y+6.0,0,w-2.0,.99,.26,'#c6a96e');
      for(const face of [f,localFrame(f,w,0,0,0)])sign(face,w/2,y+6.01,.15,w-2.18,.85,'廟 街','TEMPLE STREET','#e9d8aa','#51402f');
      const lights=[];
      for(const [i,st] of market.lanterns.entries()){
        const rope=station(st),y=localGround(rope,0,0)+4.45;
        for(const s of [-1,1]){
          bar(rope,0,y+.58,s*3.65,0,y,0,.021,'#595953');
          box(rope,0,y-1.06,s*3.65,.047,3.31,.047,iron);
        }
        for(let j=-2;j<=2;j++){
          const v=j*1.25,head=y+Math.abs(v)*.15;
          bar(rope,0,head,v,0,head-.15,v,.014,iron);
          const col=['#e1a24b','#d98b99','#c36156','#c9b96f','#9d86b4'][(i+j+7)%5];
          b.cylinder(...rope.at(0,head-.28,v),.16,.255,.24,col,10);
          b.cylinder(...rope.at(0,head-.45,v),.255,.135,.13,col,10);
          b.cylinder(...rope.at(0,head-.535,v),.077,.077,.052,'#e7cc89',8);
          b.lights.cylinder(...rope.at(0,head-.28,v),.164,.259,.232,col,10);
          b.lights.cylinder(...rope.at(0,head-.45,v),.259,.139,.12,col,10);
          lights.push(rope.at(0,head-.51,v));
        }
      }
      const bulbs=new THREE.InstancedMesh(new THREE.SphereGeometry(.089,8,5),new THREE.MeshBasicMaterial({color:0xffe8a8,toneMapped:false}),lights.length);
      lights.forEach((point,i)=>bulbs.setMatrixAt(i,new THREE.Matrix4().makeTranslation(...point)));
      bulbs.name='廟街串燈';bulbs.computeBoundingSphere();group.add(bulbs);
    }
    const builders={qeh:hospital,lands:court,tinhau:temple,redbrick:redBrick,gunclub:barracks,
      wingon:commerce,inspoint:commerce,nightmarket:nightMarket};
    builders[id]();
    for(const [mat,bin] of batches){
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(bin.points,3));
      geometry.setAttribute('uv',new THREE.Float32BufferAttribute(bin.uv,2));geometry.computeVertexNormals();
      const mesh=new THREE.Mesh(geometry,mat);mesh.name='Exterior masonry and glazing';mesh.receiveShadow=true;group.add(mesh);
    }
  }
  return {sites,walks,solids,clearPlanting,build};
})();
